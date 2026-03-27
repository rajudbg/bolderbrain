"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  AssessmentTemplateType,
  EqAttemptStatus,
} from "@/generated/prisma/enums";
import type { AssessmentQuestionType } from "@/generated/prisma/enums";
import { autoAssignActionsAfterEq } from "@/lib/action-engine";
import { EQ_DOMAIN_KEYS, domainDisplayName, domainSortIndex, type EqDomainKey } from "@/lib/eq-domains";
import { computeEqAssessmentResult, type EqResponseEntry } from "@/lib/eq-scoring";
import prisma from "@/lib/prisma";
import { z } from "zod";

async function requireUserOrgIds(): Promise<{ userId: string; orgIds: string[] }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  const orgIds = (session.user.tenants ?? []).map((t) => t.organizationId);
  return { userId, orgIds };
}

export async function listEqTemplatesForUser() {
  const { orgIds } = await requireUserOrgIds();
  if (orgIds.length === 0) return [];

  const rows = await prisma.assessmentTemplate.findMany({
    where: {
      organizationId: { in: orgIds },
      type: AssessmentTemplateType.EQ_ASSESSMENT,
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

const responsesSchema = z.record(
  z.string(),
  z.object({
    scenarioOptionId: z.string().optional(),
    likert: z.number().optional(),
  }),
);

export async function startOrResumeEqAttempt(templateId: string) {
  const { userId, orgIds } = await requireUserOrgIds();

  const template = await prisma.assessmentTemplate.findFirst({
    where: {
      id: templateId,
      type: AssessmentTemplateType.EQ_ASSESSMENT,
      isActive: true,
      organizationId: { in: orgIds },
    },
  });
  if (!template) throw new Error("Template not found");

  const existing = await prisma.eqTestAttempt.findFirst({
    where: {
      userId,
      templateId: template.id,
      status: EqAttemptStatus.IN_PROGRESS,
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
      q.traitCategory?.trim() &&
      (q.questionType === "EQ_SCENARIO" || q.questionType === "EQ_SELF_REPORT"),
  );
  if (gradable.length === 0) {
    throw new Error("No EQ scenario or self-report questions in this template yet.");
  }

  gradable.sort((a, b) => {
    const d = domainSortIndex(a.traitCategory) - domainSortIndex(b.traitCategory);
    if (d !== 0) return d;
    return a.sortOrder - b.sortOrder;
  });

  const questionIds = gradable.map((q) => q.id);

  const attempt = await prisma.eqTestAttempt.create({
    data: {
      userId,
      organizationId: template.organizationId,
      templateId: template.id,
      status: EqAttemptStatus.IN_PROGRESS,
      questionIds,
      responses: {},
      currentSectionIndex: 0,
    },
  });

  revalidatePath("/app/assessments/eq");
  return { attemptId: attempt.id, resumed: false };
}

export async function saveEqProgress(input: {
  attemptId: string;
  responses: Record<string, EqResponseEntry>;
  currentSectionIndex: number;
}) {
  const { userId, orgIds } = await requireUserOrgIds();
  const data = z
    .object({
      attemptId: z.string().min(1),
      responses: responsesSchema,
      currentSectionIndex: z.number().int().min(0).max(20),
    })
    .parse(input);

  const attempt = await prisma.eqTestAttempt.findFirst({
    where: { id: data.attemptId, userId, organizationId: { in: orgIds } },
  });
  if (!attempt || attempt.status !== EqAttemptStatus.IN_PROGRESS) {
    throw new Error("Attempt not found or already submitted");
  }

  await prisma.eqTestAttempt.update({
    where: { id: attempt.id },
    data: {
      responses: data.responses as object,
      currentSectionIndex: data.currentSectionIndex,
      lastSavedAt: new Date(),
    },
  });

  revalidatePath(`/app/assessments/eq/${attempt.id}`);
}

export async function submitEqAttempt(attemptId: string) {
  const { userId, orgIds } = await requireUserOrgIds();

  const attempt = await prisma.eqTestAttempt.findFirst({
    where: { id: attemptId, userId, organizationId: { in: orgIds } },
    include: { template: true, result: true },
  });
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status === EqAttemptStatus.COMPLETED && attempt.result) {
    return { resultId: attempt.result.id };
  }
  if (attempt.status !== EqAttemptStatus.IN_PROGRESS) {
    throw new Error("Attempt is not active");
  }

  const questionIds = attempt.questionIds as unknown as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const order = new Map(questionIds.map((id, i) => [id, i]));
  questions.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const raw = (attempt.responses ?? {}) as Record<string, EqResponseEntry>;
  const scoredInput = questions.map((q) => ({
    id: q.id,
    questionType: q.questionType as AssessmentQuestionType,
    traitCategory: q.traitCategory,
    reverseScored: q.reverseScored,
    config: q.config,
  }));

  const computed = computeEqAssessmentResult(scoredInput, raw);

  const prev = await prisma.eqTestAttempt.findFirst({
    where: {
      userId,
      templateId: attempt.templateId,
      status: EqAttemptStatus.COMPLETED,
      id: { not: attempt.id },
      submittedAt: { not: null },
    },
    orderBy: { submittedAt: "desc" },
    include: { result: true },
  });

  const previousSnapshot =
    prev?.result != null
      ? {
          compositeScore: prev.result.compositeScore,
          domainScores: prev.result.domainScores as object,
          completedAt: prev.submittedAt?.toISOString() ?? null,
        }
      : null;

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.eqTestAttempt.update({
      where: { id: attempt.id },
      data: {
        status: EqAttemptStatus.COMPLETED,
        submittedAt: now,
        responses: raw as object,
      },
    });

    await tx.eqTestResult.create({
      data: {
        attemptId: attempt.id,
        domainScores: computed.domainScores as object,
        compositeScore: computed.compositeScore,
        percentileComposite: computed.percentileComposite,
        percentileByDomain: computed.percentileByDomain as object,
        highestDomain: computed.highestDomain,
        lowestDomain: computed.lowestDomain,
        consistencyFlags: computed.consistencyFlags as object,
        narrativeText: computed.narrativeText,
        quadrantLabel: computed.quadrantLabel,
        heatmapPosition: computed.heatmapPosition as object,
        previousSnapshot: previousSnapshot as object | undefined,
      },
    });
  });

  await autoAssignActionsAfterEq({
    attemptId: attempt.id,
    userId,
    organizationId: attempt.organizationId,
    lowestDomain: computed.lowestDomain,
  });

  revalidatePath("/app/assessments/eq");
  revalidatePath(`/app/assessments/eq/${attempt.id}/results`);
  revalidatePath("/app");

  return { ok: true as const };
}

export type EqSectionPayload = {
  domain: EqDomainKey;
  label: string;
  questions: Array<{
    id: string;
    questionType: AssessmentQuestionType;
    config: unknown;
    reverseScored: boolean;
    traitCategory: string | null;
  }>;
};

export async function getEqAttemptPayload(attemptId: string): Promise<{
  attempt: {
    id: string;
    templateName: string;
    currentSectionIndex: number;
    responses: Record<string, EqResponseEntry>;
  };
  sections: EqSectionPayload[];
} | null> {
  const { userId, orgIds } = await requireUserOrgIds();

  const attempt = await prisma.eqTestAttempt.findFirst({
    where: { id: attemptId, userId, organizationId: { in: orgIds } },
    include: { template: true },
  });
  if (!attempt || attempt.status !== EqAttemptStatus.IN_PROGRESS) return null;

  const questionIds = attempt.questionIds as unknown as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const order = new Map(questionIds.map((id, i) => [id, i]));
  questions.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const sections: EqSectionPayload[] = [];
  for (const domain of EQ_DOMAIN_KEYS) {
    const qs = questions.filter((q) => q.traitCategory?.trim() === domain);
    if (qs.length === 0) continue;
    sections.push({
      domain,
      label: domainDisplayName(domain),
      questions: qs.map((q) => ({
        id: q.id,
        questionType: q.questionType,
        config: q.config,
        reverseScored: q.reverseScored,
        traitCategory: q.traitCategory,
      })),
    });
  }

  const responses = (attempt.responses ?? {}) as Record<string, EqResponseEntry>;

  return {
    attempt: {
      id: attempt.id,
      templateName: attempt.template.name,
      currentSectionIndex: Math.min(attempt.currentSectionIndex, Math.max(0, sections.length - 1)),
      responses,
    },
    sections,
  };
}

export async function getEqResultPayload(attemptId: string) {
  const { userId, orgIds } = await requireUserOrgIds();

  const attempt = await prisma.eqTestAttempt.findFirst({
    where: { id: attemptId, userId, organizationId: { in: orgIds } },
    include: {
      template: { select: { name: true } },
      result: true,
    },
  });
  if (!attempt?.result) return null;

  const r = attempt.result;
  return {
    templateName: attempt.template.name,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    result: {
      domainScores: r.domainScores as Record<EqDomainKey, number>,
      compositeScore: r.compositeScore,
      percentileComposite: r.percentileComposite,
      percentileByDomain: r.percentileByDomain as Record<EqDomainKey, number>,
      highestDomain: r.highestDomain as EqDomainKey,
      lowestDomain: r.lowestDomain as EqDomainKey,
      consistencyFlags: r.consistencyFlags as string[],
      narrativeText: r.narrativeText,
      quadrantLabel: r.quadrantLabel,
      heatmapPosition: r.heatmapPosition as { x: number; y: number },
      previousSnapshot: r.previousSnapshot as {
        compositeScore: number;
        domainScores: Record<EqDomainKey, number>;
        completedAt: string | null;
      } | null,
    },
  };
}
