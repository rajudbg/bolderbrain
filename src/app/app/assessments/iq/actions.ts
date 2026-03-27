"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  AssessmentTemplateType,
  IqAttemptStatus,
} from "@/generated/prisma/enums";
import type { AssessmentQuestionType } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { parseIqTemplateConfig } from "@/lib/iq-template-config";
import { computeIqScores, type IqCategoryKey } from "@/lib/iq-scoring";
import { z } from "zod";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

async function requireUserOrgIds(): Promise<{ userId: string; orgIds: string[] }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  const orgIds = (session.user.tenants ?? []).map((t) => t.organizationId);
  return { userId, orgIds };
}

export async function listIqTemplatesForUser() {
  const { orgIds } = await requireUserOrgIds();
  if (orgIds.length === 0) return [];

  const rows = await prisma.assessmentTemplate.findMany({
    where: {
      organizationId: { in: orgIds },
      type: AssessmentTemplateType.IQ_COGNITIVE,
      isActive: true,
    },
    orderBy: { name: "asc" },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      questions: {
        where: { isActive: true, correctOptionId: { not: null } },
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

export async function startIqAttempt(templateId: string) {
  const { userId, orgIds } = await requireUserOrgIds();
  const template = await prisma.assessmentTemplate.findFirst({
    where: {
      id: templateId,
      type: AssessmentTemplateType.IQ_COGNITIVE,
      isActive: true,
      organizationId: { in: orgIds },
    },
    include: {
      organization: { select: { id: true } },
    },
  });
  if (!template) throw new Error("Template not found or not available");

  const cfg = parseIqTemplateConfig(template.config);
  const pool = await prisma.question.findMany({
    where: {
      templateId: template.id,
      isActive: true,
      correctOptionId: { not: null },
    },
    select: {
      id: true,
      sortOrder: true,
    },
  });

  if (pool.length === 0) {
    throw new Error("No gradable questions in the bank yet. Add questions in Super Admin.");
  }

  const n = Math.min(cfg.questionsPerTest, pool.length);
  const picked = shuffle(pool).slice(0, n);
  const questionIds = picked.map((q) => q.id);

  const now = new Date();
  const endsAt = new Date(now.getTime() + cfg.totalTimeSeconds * 1000);

  const cooldownMs = cfg.retakeCooldownMonths * 30 * 24 * 60 * 60 * 1000;
  const since = new Date(now.getTime() - cooldownMs);
  const recent = await prisma.iqTestAttempt.findFirst({
    where: {
      userId,
      templateId: template.id,
      status: IqAttemptStatus.COMPLETED,
      submittedAt: { gte: since },
    },
  });
  if (recent) {
    throw new Error(
      `A completed attempt was submitted recently. Retakes are allowed after ${cfg.retakeCooldownMonths} month(s).`,
    );
  }

  const attempt = await prisma.iqTestAttempt.create({
    data: {
      userId,
      organizationId: template.organizationId,
      templateId: template.id,
      status: IqAttemptStatus.IN_PROGRESS,
      endsAt,
      questionIds,
    },
  });

  revalidatePath("/app/assessments/iq");
  return { attemptId: attempt.id };
}

const responsesSchema = z.record(z.string(), z.string());

export async function submitIqAttempt(input: {
  attemptId: string;
  responses: Record<string, string>;
  flaggedIds?: string[];
}) {
  const { userId } = await requireUserOrgIds();
  const data = z
    .object({
      attemptId: z.string().min(1),
      responses: responsesSchema,
      flaggedIds: z.array(z.string()).optional(),
    })
    .parse(input);

  const attempt = await prisma.iqTestAttempt.findFirst({
    where: { id: data.attemptId, userId },
    include: {
      template: true,
      result: true,
    },
  });

  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status === IqAttemptStatus.COMPLETED && attempt.result) {
    return { resultId: attempt.result.id };
  }
  if (attempt.status !== IqAttemptStatus.IN_PROGRESS) {
    throw new Error("This attempt is no longer active");
  }

  const questionIds = attempt.questionIds as unknown as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds }, templateId: attempt.templateId },
    select: {
      id: true,
      questionType: true,
      correctOptionId: true,
      weight: true,
    },
  });

  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = questionIds.map((id) => byId.get(id)).filter(Boolean) as typeof questions;

  const selected: Record<string, string | undefined> = { ...data.responses };
  const scored = computeIqScores(
    ordered.map((q) => ({
      id: q.id,
      questionType: q.questionType as AssessmentQuestionType,
      correctOptionId: q.correctOptionId,
      weight: Number(q.weight),
    })),
    selected,
  );

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    await tx.iqTestAttempt.update({
      where: { id: attempt.id },
      data: {
        status: IqAttemptStatus.COMPLETED,
        submittedAt: now,
        responses: data.responses as object,
        flaggedIds: data.flaggedIds?.length ? (data.flaggedIds as object) : undefined,
      },
    });

    return tx.iqTestResult.create({
      data: {
        attemptId: attempt.id,
        rawCorrectCount: scored.rawCorrectCount,
        weightedScore: scored.weightedScore,
        maxWeighted: scored.maxWeighted,
        standardScore: scored.standardScore,
        percentile: scored.percentile,
        ciLow: scored.ciLow,
        ciHigh: scored.ciHigh,
        categoryLabel: scored.categoryLabel,
        breakdownByCategory: scored.breakdownByCategory as object,
        interpretation: scored.interpretation,
      },
    });
  });

  revalidatePath("/app/assessments/iq");
  revalidatePath(`/app/assessments/iq/${attempt.id}/results`);
  return { resultId: result.id };
}

export type IqAttemptPayload = {
  attempt: {
    id: string;
    startedAt: string;
    endsAt: string;
    status: IqAttemptStatus;
    questionIds: string[];
  };
  template: { id: string; name: string; config: unknown };
  questions: Array<{
    id: string;
    questionType: AssessmentQuestionType;
    config: unknown;
    timeLimitSeconds: number | null;
    weight: unknown;
  }>;
  defaults: ReturnType<typeof parseIqTemplateConfig>;
};

export async function getIqAttemptPayload(attemptId: string): Promise<IqAttemptPayload | null> {
  const { userId, orgIds } = await requireUserOrgIds();
  const attempt = await prisma.iqTestAttempt.findFirst({
    where: { id: attemptId, userId, organizationId: { in: orgIds } },
    include: { template: true },
  });
  if (!attempt || attempt.status !== IqAttemptStatus.IN_PROGRESS) return null;

  const questionIds = attempt.questionIds as unknown as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const order = new Map(questionIds.map((id, i) => [id, i]));
  questions.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const cfg = parseIqTemplateConfig(attempt.template.config);

  return {
    attempt: {
      id: attempt.id,
      startedAt: attempt.startedAt.toISOString(),
      endsAt: attempt.endsAt.toISOString(),
      status: attempt.status,
      questionIds,
    },
    template: {
      id: attempt.template.id,
      name: attempt.template.name,
      config: attempt.template.config,
    },
    questions: questions.map((q) => ({
      id: q.id,
      questionType: q.questionType,
      config: q.config,
      timeLimitSeconds: q.timeLimitSeconds,
      weight: q.weight,
    })),
    defaults: cfg,
  };
}

export async function getIqResultPayload(attemptId: string) {
  const { userId, orgIds } = await requireUserOrgIds();
  const attempt = await prisma.iqTestAttempt.findFirst({
    where: { id: attemptId, userId, organizationId: { in: orgIds } },
    include: {
      template: { select: { id: true, name: true, config: true } },
      result: true,
    },
  });
  if (!attempt?.result) return null;

  const breakdown = attempt.result.breakdownByCategory as Record<
    IqCategoryKey,
    { percentile: number; correct: number; total: number }
  >;

  const cfg = parseIqTemplateConfig(attempt.template.config);

  return {
    templateName: attempt.template.name,
    passingStandardScore: cfg.passingStandardScore,
    result: {
      standardScore: attempt.result.standardScore,
      percentile: attempt.result.percentile,
      ciLow: attempt.result.ciLow,
      ciHigh: attempt.result.ciHigh,
      categoryLabel: attempt.result.categoryLabel,
      rawCorrectCount: attempt.result.rawCorrectCount,
      weightedScore: attempt.result.weightedScore,
      maxWeighted: attempt.result.maxWeighted,
      interpretation: attempt.result.interpretation,
      breakdownByCategory: breakdown,
    },
  };
}
