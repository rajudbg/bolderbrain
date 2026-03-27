"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  AssessmentTemplateType,
  PsychAttemptStatus,
} from "@/generated/prisma/enums";
import type { AssessmentQuestionType } from "@/generated/prisma/enums";
import { autoAssignActionsAfterPsych } from "@/lib/action-engine";
import { computePsychometricResult, type PsychForcedResponse, type PsychSemanticResponse } from "@/lib/psychometric-scoring";
import { parsePsychometricTemplateConfig } from "@/lib/psychometric-template-config";
import { OCEAN_TRAITS } from "@/lib/ocean-traits";
import prisma from "@/lib/prisma";
import { z } from "zod";

async function requireUserOrgIds(): Promise<{ userId: string; orgIds: string[] }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  const orgIds = (session.user.tenants ?? []).map((t) => t.organizationId);
  return { userId, orgIds };
}

export async function listPsychTemplatesForUser() {
  const { orgIds } = await requireUserOrgIds();
  if (orgIds.length === 0) return [];

  const rows = await prisma.assessmentTemplate.findMany({
    where: {
      organizationId: { in: orgIds },
      type: AssessmentTemplateType.PSYCHOMETRIC,
      isActive: true,
    },
    orderBy: { name: "asc" },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      questions: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    key: t.key,
    description: t.description,
    organization: t.organization,
    _count: { questions: t.questions.length },
  }));
}

const responseEntrySchema = z.union([
  z.object({
    mostStatementId: z.string(),
    leastStatementId: z.string(),
  }),
  z.object({ value: z.number() }),
]);

const responsesSchema = z.record(z.string(), responseEntrySchema);

export async function startOrResumePsychAttempt(templateId: string) {
  const { userId, orgIds } = await requireUserOrgIds();

  const template = await prisma.assessmentTemplate.findFirst({
    where: {
      id: templateId,
      type: AssessmentTemplateType.PSYCHOMETRIC,
      isActive: true,
      organizationId: { in: orgIds },
    },
  });
  if (!template) throw new Error("Template not found");

  const cfg = parsePsychometricTemplateConfig(template.config);
  const cooldownMs = cfg.retakeCooldownMonths * 30 * 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - cooldownMs);
  const recent = await prisma.psychTestAttempt.findFirst({
    where: {
      userId,
      templateId: template.id,
      status: PsychAttemptStatus.COMPLETED,
      submittedAt: { gte: since },
    },
  });
  if (recent) {
    throw new Error(
      `A completed personality assessment exists within the last ${cfg.retakeCooldownMonths} months. Retakes are limited to reduce practice effects.`,
    );
  }

  const existing = await prisma.psychTestAttempt.findFirst({
    where: {
      userId,
      templateId: template.id,
      status: PsychAttemptStatus.IN_PROGRESS,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    return { attemptId: existing.id, resumed: true };
  }

  const questions = await prisma.question.findMany({
    where: { templateId: template.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  const gradable = questions.filter(
    (q) =>
      q.questionType === "FORCED_CHOICE_IPSATIVE" ||
      q.questionType === "SEMANTIC_DIFFERENTIAL" ||
      q.questionType === "PSYCHOMETRIC_LIKERT",
  );
  if (gradable.length === 0) {
    throw new Error("No psychometric items in this template yet.");
  }

  const questionIds = gradable.map((q) => q.id);

  const attempt = await prisma.psychTestAttempt.create({
    data: {
      userId,
      organizationId: template.organizationId,
      templateId: template.id,
      status: PsychAttemptStatus.IN_PROGRESS,
      questionIds,
      responses: {},
      currentPageIndex: 0,
      itemTimings: {},
    },
  });

  revalidatePath("/app/assessments/psychometric");
  return { attemptId: attempt.id, resumed: false };
}

export async function savePsychProgress(input: {
  attemptId: string;
  responses: Record<string, PsychForcedResponse | PsychSemanticResponse | { value: number }>;
  /** 0-based index of the current question (stored in `PsychTestAttempt.currentPageIndex`). */
  currentQuestionIndex: number;
  itemTimings: Record<string, number>;
}) {
  const { userId, orgIds } = await requireUserOrgIds();
  const data = z
    .object({
      attemptId: z.string().min(1),
      responses: responsesSchema,
      currentQuestionIndex: z.number().int().min(0),
      itemTimings: z.record(z.string(), z.number()),
    })
    .parse(input);

  const attempt = await prisma.psychTestAttempt.findFirst({
    where: { id: data.attemptId, userId, organizationId: { in: orgIds } },
  });
  if (!attempt || attempt.status !== PsychAttemptStatus.IN_PROGRESS) {
    throw new Error("Attempt not found or already submitted");
  }

  await prisma.psychTestAttempt.update({
    where: { id: attempt.id },
    data: {
      responses: data.responses as object,
      currentPageIndex: data.currentQuestionIndex,
      itemTimings: data.itemTimings as object,
      lastSavedAt: new Date(),
    },
  });

  revalidatePath(`/app/assessments/psychometric/${attempt.id}`);
}

export async function submitPsychAttempt(attemptId: string) {
  const { userId, orgIds } = await requireUserOrgIds();

  const attempt = await prisma.psychTestAttempt.findFirst({
    where: { id: attemptId, userId, organizationId: { in: orgIds } },
    include: { template: true, result: true },
  });
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status === PsychAttemptStatus.COMPLETED && attempt.result) {
    return { ok: true as const };
  }
  if (attempt.status !== PsychAttemptStatus.IN_PROGRESS) {
    throw new Error("Attempt is not active");
  }

  const questionIds = attempt.questionIds as unknown as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const order = new Map(questionIds.map((id, i) => [id, i]));
  questions.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const rawResponses = (attempt.responses ?? {}) as Record<string, unknown>;
  const itemTimings = (attempt.itemTimings ?? {}) as Record<string, number>;

  const cfg = parsePsychometricTemplateConfig(attempt.template.config);
  const scored = computePsychometricResult(
    questions.map((q) => ({
      id: q.id,
      questionType: q.questionType as AssessmentQuestionType,
      traitCategory: q.traitCategory,
      reverseScored: q.reverseScored,
      config: q.config,
    })),
    rawResponses,
    itemTimings,
    cfg.roleProfiles,
  );

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.psychTestAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PsychAttemptStatus.COMPLETED,
        submittedAt: now,
        responses: rawResponses as object,
        itemTimings: attempt.itemTimings ?? undefined,
      },
    });

    await tx.psychTestResult.create({
      data: {
        attemptId: attempt.id,
        traitPercentiles: scored.traitPercentiles as object,
        rawTraitSums: scored.rawTraitSums as object,
        validityFlags: scored.validityFlags as object,
        roleMatches: scored.roleMatches as object,
        teamDynamicsText: scored.teamDynamicsText,
        careerInsightsText: scored.careerInsightsText,
        summaryLine: scored.summaryLine,
        radarPayload: scored.radarPayload as object,
      },
    });
  });

  const lowestTrait = [...OCEAN_TRAITS].sort(
    (a, b) => scored.traitPercentiles[a] - scored.traitPercentiles[b],
  )[0];
  if (lowestTrait) {
    await autoAssignActionsAfterPsych({
      attemptId: attempt.id,
      userId,
      organizationId: attempt.organizationId,
      lowestTrait,
    });
  }

  revalidatePath("/app/assessments/psychometric");
  revalidatePath(`/app/assessments/psychometric/${attempt.id}/results`);
  revalidatePath("/app");

  return { ok: true as const };
}

export async function getPsychAttemptPayload(attemptId: string) {
  const { userId, orgIds } = await requireUserOrgIds();

  const attempt = await prisma.psychTestAttempt.findFirst({
    where: { id: attemptId, userId, organizationId: { in: orgIds } },
    include: { template: true },
  });
  if (!attempt || attempt.status !== PsychAttemptStatus.IN_PROGRESS) return null;

  const cfg = parsePsychometricTemplateConfig(attempt.template.config);
  const questionIds = attempt.questionIds as unknown as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const order = new Map(questionIds.map((id, i) => [id, i]));
  questions.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const responses = (attempt.responses ?? {}) as Record<string, PsychForcedResponse | PsychSemanticResponse>;
  const itemTimings = (attempt.itemTimings ?? {}) as Record<string, number>;

  const n = questions.length;
  const qIdx = Math.min(Math.max(0, attempt.currentPageIndex), Math.max(0, n - 1));
  const ipp = cfg.itemsPerPage;
  const displayPage = Math.floor(qIdx / ipp) + 1;
  const totalDisplayPages = Math.max(1, Math.ceil(n / ipp));

  return {
    attempt: {
      id: attempt.id,
      templateName: attempt.template.name,
      itemsPerPage: ipp,
      currentQuestionIndex: qIdx,
      displayPage,
      totalDisplayPages,
      questionCount: n,
      responses,
      itemTimings,
    },
    questions: questions.map((q) => ({
      id: q.id,
      questionType: q.questionType,
      config: q.config,
      traitCategory: q.traitCategory,
      reverseScored: q.reverseScored,
    })),
  };
}

export async function getPsychResultPayload(attemptId: string) {
  const { userId, orgIds } = await requireUserOrgIds();

  const attempt = await prisma.psychTestAttempt.findFirst({
    where: { id: attemptId, userId, organizationId: { in: orgIds } },
    include: {
      template: { select: { name: true, config: true } },
      result: true,
    },
  });
  if (!attempt?.result) return null;

  const r = attempt.result;
  const cfg = parsePsychometricTemplateConfig(attempt.template.config);

  return {
    templateName: attempt.template.name,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    privacyNote: true as const,
    result: {
      traitPercentiles: r.traitPercentiles as Record<string, number>,
      rawTraitSums: r.rawTraitSums as Record<string, number>,
      validityFlags: r.validityFlags as {
        inconsistencyWarning: boolean;
        socialDesirabilityWarning: boolean;
        speedWarning: boolean;
        messages: string[];
      },
      roleMatches: r.roleMatches as Record<string, number>,
      teamDynamicsText: r.teamDynamicsText,
      careerInsightsText: r.careerInsightsText,
      summaryLine: r.summaryLine,
      radarPayload: r.radarPayload as {
        traits: string[];
        user: number[];
        population: number[];
        idealLeadership?: number[];
      },
    },
    roleProfileKeys: Object.keys(cfg.roleProfiles),
  };
}
