import {
  AssessmentTemplateType,
  EvaluatorRole,
  EvaluatorStatus,
  ScoringStrategy as PrismaScoringStrategy,
} from "@/generated/prisma/enums";
import { autoAssignActionsAfter360, recordCompetencySnapshots } from "@/lib/action-engine";
import { onAssessment360FinalizedForTraining } from "@/lib/training-enrollment-sync";
import prisma from "@/lib/prisma";
import { createScoringStrategy } from "@/lib/scoring/factory";
import type { ScoringInput, ScoringQuestionMeta, ScoringResponse, ScoringResult } from "@/lib/scoring/types";

/** Persisted shape in `AssessmentResult.competencyScores` for 360 MULTI_SOURCE. */
export type Assessment360StoredResult = {
  version: 1;
  strategy: "MULTI_SOURCE";
  byCompetency: Array<{
    competencyKey: string;
    self?: number;
    peerAvg?: number;
    manager?: number;
    othersAverage: number;
    gapSelfVsOthers: number;
  }>;
  summary: {
    selfOverall: number;
    othersOverall: number;
    gapSelfVsOthers: number;
  };
  gaps: {
    highest: { competencyKey: string; gap: number };
    lowest: { competencyKey: string; gap: number };
  };
};

function roleToSource(role: EvaluatorRole): string {
  switch (role) {
    case EvaluatorRole.SELF:
      return "self";
    case EvaluatorRole.PEER:
      return "peer";
    case EvaluatorRole.MANAGER:
      return "manager";
    default:
      return String(role).toLowerCase();
  }
}

function toStoredPayload(result: Extract<ScoringResult, { strategy: "MULTI_SOURCE" }>): Assessment360StoredResult {
  const byCompetency = result.byCompetency.map((c) => ({
    competencyKey: c.competencyKey,
    self: c.averagesBySource.self,
    peerAvg: c.averagesBySource.peer,
    manager: c.averagesBySource.manager,
    othersAverage: c.othersAverage,
    gapSelfVsOthers: c.gapSelfVsOthers,
  }));
  return {
    version: 1,
    strategy: "MULTI_SOURCE",
    byCompetency,
    summary: result.summary,
    gaps: result.gaps,
  };
}

/**
 * When every evaluator is COMPLETED, runs MULTI_SOURCE scoring and writes `AssessmentResult`.
 * No-op if already computed or prerequisites not met.
 */
export async function tryFinalizeAssessmentResult(assessmentId: string): Promise<Assessment360StoredResult | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      template: true,
      evaluators: true,
      result: true,
    },
  });

  if (!assessment || assessment.template.type !== AssessmentTemplateType.BEHAVIORAL_360) {
    return null;
  }
  if (assessment.result) {
    return assessment.result.competencyScores as unknown as Assessment360StoredResult;
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
    textValue: r.textValue ?? undefined,
    source: roleToSource(r.evaluator.role) as ScoringResponse["source"],
  }));

  const input: ScoringInput = {
    templateId: assessment.templateId,
    questions: questionMetas,
    responses,
  };

  if (assessment.template.scoringStrategy !== PrismaScoringStrategy.MULTI_SOURCE) {
    return null;
  }

  const engine = createScoringStrategy(PrismaScoringStrategy.MULTI_SOURCE);
  const scored = engine.score(input);
  if (scored.strategy !== "MULTI_SOURCE") {
    return null;
  }

  const payload = toStoredPayload(scored);

  await prisma.$transaction([
    prisma.assessmentResult.create({
      data: {
        assessmentId,
        competencyScores: payload as object,
      },
    }),
    prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "COMPLETED" },
    }),
  ]);

  await recordCompetencySnapshots({
    assessmentId,
    subjectUserId: assessment.subjectUserId,
    organizationId: assessment.organizationId,
    scores: payload,
  });
  await autoAssignActionsAfter360({
    assessmentId,
    subjectUserId: assessment.subjectUserId,
    organizationId: assessment.organizationId,
    scores: payload,
  });

  await onAssessment360FinalizedForTraining(assessmentId);

  try {
    const { onAssessment360CompletedForAi } = await import("@/lib/assessment/hooks");
    await onAssessment360CompletedForAi({
      assessmentId,
      subjectUserId: assessment.subjectUserId,
      organizationId: assessment.organizationId,
      scores: payload,
    });
  } catch (e) {
    console.error("[ai] post-360 insight pipeline failed", e);
  }

  return payload;
}
