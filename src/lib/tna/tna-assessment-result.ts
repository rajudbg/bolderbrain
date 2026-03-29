import {
  AssessmentInstanceStatus,
  AssessmentTemplateType,
  EvaluatorStatus,
  ScoringStrategy as PrismaScoringStrategy,
  TrainingNeedSource,
  TrainingNeedStatus,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { createScoringStrategy } from "@/lib/scoring/factory";
import type { ScoringInput, ScoringQuestionMeta, ScoringResponse } from "@/lib/scoring/types";
import { priorityFromGap } from "./gaps";
import { resolveTargetForCompetency } from "./targets";
import { rebuildSkillsInventoryForUser } from "./inventory";

export type TnaStoredResult = {
  version: 1;
  strategy: "TNA_DIAGNOSTIC";
  byCompetency: Array<{ competencyKey: string; score: number }>;
  overall: number;
};

function roleToSource(role: string): ScoringResponse["source"] {
  const r = role.toLowerCase();
  if (r === "self") return "self";
  if (r === "peer") return "peer";
  if (r === "manager") return "manager";
  return "self";
}

/**
 * Finalize TNA self-assessment: TRAIT_AGGREGATE scores, persist JSON, open TrainingNeeds, refresh inventory.
 */
export async function tryFinalizeTnaAssessmentResult(assessmentId: string): Promise<TnaStoredResult | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      template: true,
      evaluators: true,
      result: true,
    },
  });

  if (!assessment || assessment.template.type !== AssessmentTemplateType.TNA_DIAGNOSTIC) {
    return null;
  }
  if (assessment.result) {
    return assessment.result.competencyScores as unknown as TnaStoredResult;
  }

  const allDone = assessment.evaluators.every((e) => e.status === EvaluatorStatus.COMPLETED);
  if (!allDone || assessment.evaluators.length === 0) {
    return null;
  }

  const questions = await prisma.question.findMany({
    where: { templateId: assessment.templateId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  const questionMetas: ScoringQuestionMeta[] = questions.map((q) => ({
    id: q.id,
    key: q.key,
    weight: Number(q.weight),
    correctOptionId: q.correctOptionId,
    traitCategory: q.traitCategory,
  }));

  const responsesRows = await prisma.assessmentResponse.findMany({
    where: {
      evaluator: { assessmentId },
    },
    include: {
      evaluator: { select: { role: true } },
    },
  });

  const responses: ScoringResponse[] = responsesRows.map((r) => ({
    questionId: r.questionId,
    numericValue: r.numericValue ?? undefined,
    source: roleToSource(String(r.evaluator.role)),
  }));

  const input: ScoringInput = {
    templateId: assessment.templateId,
    questions: questionMetas,
    responses,
  };

  if (assessment.template.scoringStrategy !== PrismaScoringStrategy.TRAIT_AGGREGATE) {
    return null;
  }

  const engine = createScoringStrategy(PrismaScoringStrategy.TRAIT_AGGREGATE);
  const scored = engine.score(input);
  if (scored.strategy !== "TRAIT_AGGREGATE") {
    return null;
  }

  const byCompetency = Object.entries(scored.byTrait).map(([competencyKey, score]) => ({
    competencyKey,
    score,
  }));

  const payload: TnaStoredResult = {
    version: 1,
    strategy: "TNA_DIAGNOSTIC",
    byCompetency,
    overall: scored.overall,
  };

  await prisma.$transaction([
    prisma.assessmentResult.create({
      data: {
        assessmentId,
        competencyScores: payload as object,
      },
    }),
    prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: AssessmentInstanceStatus.COMPLETED },
    }),
  ]);

  await generateNeedsFromTna(assessment.organizationId, assessment.subjectUserId, assessmentId, payload);
  await rebuildSkillsInventoryForUser(assessment.organizationId, assessment.subjectUserId);

  return payload;
}

async function generateNeedsFromTna(
  organizationId: string,
  userId: string,
  assessmentId: string,
  payload: TnaStoredResult,
) {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { department: true },
  });

  const competencies = await prisma.competency.findMany({
    where: { organizationId },
  });
  const compByKey = new Map(competencies.map((c) => [c.key, c]));

  for (const row of payload.byCompetency) {
    const comp = compByKey.get(row.competencyKey);
    if (!comp) continue;

    const target = await resolveTargetForCompetency(organizationId, comp.id, member?.department ?? null);
    const targetScore = target?.targetScore ?? 4.0;
    const gap = targetScore - row.score;
    if (gap <= 0.25) continue;

    await prisma.trainingNeed.create({
      data: {
        organizationId,
        userId,
        competencyId: comp.id,
        currentScore: row.score,
        targetScore,
        gap,
        priority: priorityFromGap(gap),
        source: TrainingNeedSource.TNA_ASSESSMENT,
        status: TrainingNeedStatus.OPEN,
        sourceAssessmentId: assessmentId,
      },
    });
  }
}
