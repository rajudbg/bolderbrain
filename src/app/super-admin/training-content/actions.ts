"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  TrainingContentQuestionType,
  TrainingContentTemplateKind,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";

const optionSchema = z.object({
  text: z.string().min(1),
  value: z.coerce.number().int(),
});

const questionSchema = z.object({
  text: z.string().min(1),
  type: z.nativeEnum(TrainingContentQuestionType),
  points: z.coerce.number().int().min(0).default(1),
  competencyKey: z.string().optional(),
  reverseScored: z.boolean().default(false),
  explanation: z.string().optional(),
  minOptions: z.coerce.number().int().min(3).max(6).default(3),
  maxOptions: z.coerce.number().int().min(3).max(6).default(6),
  options: z.array(optionSchema).min(3).max(6),
  /// 0-based indices into options for correct answers (knowledge tests only)
  correctOptionIndexes: z.array(z.coerce.number().int().min(0)).default([]),
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  kind: z.nativeEnum(TrainingContentTemplateKind),
  organizationId: z.string().optional().nullable(),
  minQuestions: z.coerce.number().int().min(5).max(50).default(5),
  maxQuestions: z.coerce.number().int().min(5).max(50).default(50),
  defaultQuestionCount: z.coerce.number().int().min(5).max(50).default(20),
  hasTimer: z.boolean().default(false),
  timeLimitMinutes: z.coerce.number().int().min(5).max(180).optional().nullable(),
  defaultOptionCount: z.coerce.number().int().min(3).max(6).default(4),
  questions: z
    .array(questionSchema)
    .min(5, { message: "Minimum 5 questions required" })
    .max(50, { message: "Maximum 50 questions allowed" }),
});

export async function createTrainingContentTemplate(input: z.infer<typeof createSchema>) {
  await requirePlatformSuperAdmin();
  const data = createSchema.parse(input);

  if (data.maxQuestions < data.minQuestions) throw new Error("maxQuestions must be ≥ minQuestions");
  if (data.questions.length < data.minQuestions) throw new Error(`At least ${data.minQuestions} questions required`);

  for (const q of data.questions) {
    if (q.options.length < q.minOptions || q.options.length > q.maxOptions) {
      throw new Error("Each question must have 3–6 options");
    }
    const isKnowledge =
      q.type === TrainingContentQuestionType.SINGLE_CHOICE ||
      q.type === TrainingContentQuestionType.MULTIPLE_CHOICE;
    if (isKnowledge) {
      if (q.correctOptionIndexes.length < 1) throw new Error("Knowledge questions need at least one correct option");
      for (const i of q.correctOptionIndexes) {
        if (i < 0 || i >= q.options.length) throw new Error("Invalid correct option index");
      }
      if (q.type === TrainingContentQuestionType.SINGLE_CHOICE && q.correctOptionIndexes.length !== 1) {
        throw new Error("Single choice must have exactly one correct answer");
      }
    }
  }

  const templateId = await prisma.$transaction(async (tx) => {
    const tpl = await tx.trainingContentTemplate.create({
      data: {
        organizationId: data.organizationId ?? null,
        kind: data.kind,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        minQuestions: data.minQuestions,
        maxQuestions: data.maxQuestions,
        defaultQuestionCount: data.defaultQuestionCount,
        hasTimer: data.hasTimer,
        timeLimitMinutes: data.timeLimitMinutes ?? null,
        defaultOptionCount: data.defaultOptionCount,
        isPublished: true,
      },
    });

    for (let qi = 0; qi < data.questions.length; qi++) {
      const q = data.questions[qi]!;
      const optionRows = q.options.map((o, oi) => ({
        id: randomUUID(),
        text: o.text.trim(),
        sortOrder: oi,
        value: o.value,
      }));
      const correctIds = q.correctOptionIndexes.map((i) => optionRows[i]!.id);

      await tx.trainingContentQuestion.create({
        data: {
          templateId: tpl.id,
          text: q.text.trim(),
          type: q.type,
          sortOrder: qi,
          correctOptionIds: correctIds,
          points: q.points,
          competencyKey: q.competencyKey?.trim() || null,
          reverseScored: q.reverseScored,
          minOptions: q.minOptions,
          maxOptions: q.maxOptions,
          explanation: q.explanation?.trim() || null,
          options: {
            create: optionRows.map((o) => ({
              id: o.id,
              text: o.text,
              sortOrder: o.sortOrder,
              value: o.value,
            })),
          },
        },
      });
    }

    return tpl.id;
  });

  revalidatePath("/super-admin/templates/content/new");
  return templateId;
}

export async function listGlobalTrainingContentTemplates() {
  await requirePlatformSuperAdmin();
  return prisma.trainingContentTemplate.findMany({
    where: { organizationId: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, kind: true, _count: { select: { questions: true } } },
  });
}
