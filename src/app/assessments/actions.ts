"use server";

import { auth } from "@/auth";
import {
  AssessmentQuestionType,
  AssessmentTemplateType,
  EvaluatorStatus,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { tryFinalizeAssessmentResult } from "@/lib/assessment-360-result";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function listAssessmentsWhereIamSubject() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.assessment.findMany({
    where: {
      subjectUserId: session.user.id,
      template: { type: AssessmentTemplateType.BEHAVIORAL_360 },
    },
    include: {
      organization: { select: { slug: true, name: true } },
      template: { select: { name: true } },
      result: { select: { id: true, computedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listMyEvaluatorAssignments() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.assessmentEvaluator.findMany({
    where: {
      userId: session.user.id,
      assessment: { template: { type: AssessmentTemplateType.BEHAVIORAL_360 } },
    },
    include: {
      assessment: {
        include: {
          organization: { select: { name: true, slug: true } },
          subject: { select: { name: true, email: true } },
          template: { select: { name: true, type: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export type TakingQuestion = {
  id: string;
  key: string;
  questionType: AssessmentQuestionType;
  competencyKey: string;
  prompt: string;
  scaleMax: number;
};

export type TakingPayload = {
  evaluatorId: string;
  assessmentId: string;
  title: string;
  orgName: string;
  orgSlug: string;
  templateName: string;
  subjectName: string | null;
  role: "SELF" | "PEER" | "MANAGER";
  status: EvaluatorStatus;
  submittedAt: Date | null;
  questions: TakingQuestion[];
  responses: Record<string, { numericValue: number | null; textValue: string | null }>;
  progress: { answered: number; total: number };
};

function groupCompetencyKey(traitCategory: string | null, fallback: string): string {
  const t = traitCategory?.trim();
  return t && t.length > 0 ? t : fallback;
}

export async function getTakingPayload(evaluatorId: string): Promise<TakingPayload | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const ev = await prisma.assessmentEvaluator.findFirst({
    where: { id: evaluatorId, userId: session.user.id },
    include: {
      assessment: {
        include: {
          organization: { select: { name: true, slug: true } },
          subject: { select: { name: true } },
          template: { select: { name: true, type: true } },
        },
      },
    },
  });

  if (!ev || ev.assessment.template.type !== AssessmentTemplateType.BEHAVIORAL_360) {
    return null;
  }

  const rawQuestions = await prisma.question.findMany({
    where: { templateId: ev.assessment.templateId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  const questions: TakingQuestion[] = rawQuestions.map((q) => {
    const cfg = (q.config && typeof q.config === "object" ? q.config : {}) as { prompt?: string };
    const prompt = typeof cfg.prompt === "string" ? cfg.prompt : q.key;
    return {
      id: q.id,
      key: q.key,
      questionType: q.questionType,
      competencyKey: groupCompetencyKey(q.traitCategory, "General"),
      prompt,
      scaleMax: 5,
    };
  });

  const resRows = await prisma.assessmentResponse.findMany({
    where: { evaluatorId: ev.id },
  });
  const responses: TakingPayload["responses"] = {};
  for (const r of resRows) {
    responses[r.questionId] = {
      numericValue: r.numericValue,
      textValue: r.textValue,
    };
  }

  const likertIds = questions.filter((q) => q.questionType === AssessmentQuestionType.LIKERT_360).map((q) => q.id);
  const answered = likertIds.filter((id) => {
    const n = responses[id]?.numericValue;
    return typeof n === "number" && !Number.isNaN(n);
  }).length;

  return {
    evaluatorId: ev.id,
    assessmentId: ev.assessmentId,
    title: ev.assessment.title ?? ev.assessment.template.name,
    orgName: ev.assessment.organization.name,
    orgSlug: ev.assessment.organization.slug,
    templateName: ev.assessment.template.name,
    subjectName: ev.assessment.subject.name,
    role: ev.role,
    status: ev.status,
    submittedAt: ev.submittedAt,
    questions,
    responses,
    progress: { answered, total: likertIds.length },
  };
}

const draftSchema = z.object({
  evaluatorId: z.string().min(1),
  answers: z.record(
    z.string(),
    z.object({
      numericValue: z.number().int().min(1).max(5).optional().nullable(),
      textValue: z.string().max(20000).optional().nullable(),
    }),
  ),
});

export async function saveDraft(input: z.infer<typeof draftSchema>) {
  const data = draftSchema.parse(input);
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const ev = await prisma.assessmentEvaluator.findFirst({
    where: { id: data.evaluatorId, userId: session.user.id },
    include: { assessment: { select: { templateId: true } } },
  });
  if (!ev) throw new Error("Not found");
  if (ev.status === EvaluatorStatus.COMPLETED) throw new Error("This assessment is already submitted");

  const qIds = Object.keys(data.answers);
  const valid = await prisma.question.findMany({
    where: {
      id: { in: qIds },
      templateId: ev.assessment.templateId,
    },
    select: { id: true },
  });
  const allowed = new Set(valid.map((q) => q.id));

  for (const [questionId, ans] of Object.entries(data.answers)) {
    if (!allowed.has(questionId)) continue;
    await prisma.assessmentResponse.upsert({
      where: {
        evaluatorId_questionId: { evaluatorId: ev.id, questionId },
      },
      create: {
        evaluatorId: ev.id,
        questionId,
        numericValue: ans.numericValue ?? null,
        textValue: ans.textValue?.trim() ? ans.textValue : null,
      },
      update: {
        numericValue: ans.numericValue ?? null,
        textValue: ans.textValue?.trim() ? ans.textValue : null,
      },
    });
  }

  await prisma.assessmentEvaluator.update({
    where: { id: ev.id },
    data: {
      status: EvaluatorStatus.IN_PROGRESS,
    },
  });

  revalidatePath(`/assessments/${ev.id}`);
  revalidatePath("/assessments");
}

export async function submitEvaluator(evaluatorId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const ev = await prisma.assessmentEvaluator.findFirst({
    where: { id: evaluatorId, userId: session.user.id },
    include: {
      assessment: {
        include: { organization: { select: { slug: true } } },
      },
    },
  });
  if (!ev) throw new Error("Not found");
  if (ev.status === EvaluatorStatus.COMPLETED) throw new Error("Already submitted");

  const questions = await prisma.question.findMany({
    where: {
      templateId: ev.assessment.templateId,
      isActive: true,
      questionType: AssessmentQuestionType.LIKERT_360,
    },
    select: { id: true },
  });

  const responses = await prisma.assessmentResponse.findMany({
    where: { evaluatorId: ev.id, questionId: { in: questions.map((q) => q.id) } },
  });
  const byQ = new Map(responses.map((r) => [r.questionId, r]));

  for (const q of questions) {
    const n = byQ.get(q.id)?.numericValue;
    if (typeof n !== "number" || Number.isNaN(n)) {
      throw new Error("Please answer all rating questions before submitting");
    }
  }

  await prisma.assessmentEvaluator.update({
    where: { id: ev.id },
    data: {
      status: EvaluatorStatus.COMPLETED,
      submittedAt: new Date(),
    },
  });

  await tryFinalizeAssessmentResult(ev.assessmentId);

  const slug = ev.assessment.organization.slug;
  revalidatePath(`/assessments/${ev.id}`);
  revalidatePath("/assessments");
  revalidatePath(`/org/${slug}/assessments`);
  revalidatePath(`/org/${slug}/assessments/${ev.assessmentId}`);
  revalidatePath(`/org/${slug}/assessments/${ev.assessmentId}/results`);
}
