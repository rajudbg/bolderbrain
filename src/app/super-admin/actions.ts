"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import {
  AssessmentQuestionType,
  AssessmentTemplateType,
  ScoringStrategy,
} from "@/generated/prisma/enums";
import { sanitizeJsonTextFields, sanitizeRichText } from "@/lib/sanitize";
import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens only");

const keySchema = z.string().min(1).max(128);

function parseConfigJson(raw: string | undefined): unknown | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeJsonTextFields(parsed);
  } catch {
    throw new Error("Config must be valid JSON");
  }
}

// --- Organizations ---

export async function createOrganization(input: { name: string; slug: string }) {
  await requirePlatformSuperAdmin();
  const data = z.object({ name: z.string().min(1), slug: slugSchema }).parse(input);
  await prisma.organization.create({
    data: { name: data.name.trim(), slug: data.slug.trim() },
  });
  revalidatePath("/super-admin/organizations");
  revalidatePath("/super-admin");
}

export async function updateOrganization(input: { id: string; name: string; slug: string }) {
  await requirePlatformSuperAdmin();
  const data = z
    .object({ id: z.string().min(1), name: z.string().min(1), slug: slugSchema })
    .parse(input);
  await prisma.organization.update({
    where: { id: data.id },
    data: { name: data.name.trim(), slug: data.slug.trim() },
  });
  revalidatePath("/super-admin/organizations");
  revalidatePath("/super-admin");
}

export async function deleteOrganization(id: string) {
  await requirePlatformSuperAdmin();
  await prisma.organization.delete({ where: { id } });
  revalidatePath("/super-admin/organizations");
  revalidatePath("/super-admin/templates");
  revalidatePath("/super-admin/questions");
  revalidatePath("/super-admin/development");
  revalidatePath("/super-admin");
}

// --- Assessment templates ---

const templateTypeSchema = z.nativeEnum(AssessmentTemplateType);
const scoringStrategySchema = z.nativeEnum(ScoringStrategy);

export async function createAssessmentTemplate(input: {
  organizationId: string;
  type: AssessmentTemplateType;
  scoringStrategy: ScoringStrategy;
  key: string;
  name: string;
  description?: string;
  configJson?: string;
  sortOrder: number;
  isActive: boolean;
}) {
  await requirePlatformSuperAdmin();
  const data = z
    .object({
      organizationId: z.string().min(1),
      type: templateTypeSchema,
      scoringStrategy: scoringStrategySchema,
      key: keySchema,
      name: z.string().min(1),
      description: z.string().optional(),
      configJson: z.string().optional(),
      sortOrder: z.coerce.number().int(),
      isActive: z.boolean(),
    })
    .parse(input);

  await prisma.assessmentTemplate.create({
    data: {
      organizationId: data.organizationId,
      type: data.type,
      scoringStrategy: data.scoringStrategy,
      key: data.key.trim(),
      name: data.name.trim(),
      description: data.description ? sanitizeRichText(data.description.trim()) || null : null,
      config: parseConfigJson(data.configJson) ?? undefined,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
  revalidatePath("/super-admin/templates");
  revalidatePath("/super-admin");
}

export async function updateAssessmentTemplate(input: {
  id: string;
  type: AssessmentTemplateType;
  scoringStrategy: ScoringStrategy;
  key: string;
  name: string;
  description?: string;
  configJson?: string;
  sortOrder: number;
  isActive: boolean;
}) {
  await requirePlatformSuperAdmin();
  const data = z
    .object({
      id: z.string().min(1),
      type: templateTypeSchema,
      scoringStrategy: scoringStrategySchema,
      key: keySchema,
      name: z.string().min(1),
      description: z.string().optional(),
      configJson: z.string().optional(),
      sortOrder: z.coerce.number().int(),
      isActive: z.boolean(),
    })
    .parse(input);

  await prisma.assessmentTemplate.update({
    where: { id: data.id },
    data: {
      type: data.type,
      scoringStrategy: data.scoringStrategy,
      key: data.key.trim(),
      name: data.name.trim(),
      description: data.description ? sanitizeRichText(data.description.trim()) || null : null,
      config: parseConfigJson(data.configJson) ?? undefined,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
  revalidatePath("/super-admin/templates");
  revalidatePath("/super-admin");
}

export async function deleteAssessmentTemplate(id: string) {
  await requirePlatformSuperAdmin();
  await prisma.assessmentTemplate.delete({ where: { id } });
  revalidatePath("/super-admin/templates");
  revalidatePath("/super-admin/questions");
  revalidatePath("/super-admin");
}

// --- Questions ---

const questionTypeSchema = z.nativeEnum(AssessmentQuestionType);

export async function createQuestion(input: {
  organizationId: string;
  templateId: string;
  key: string;
  questionType: AssessmentQuestionType;
  configJson?: string;
  correctOptionId?: string | null;
  traitCategory?: string | null;
  weight: number;
  timeLimitSeconds?: number | null;
  reverseScored?: boolean;
  sortOrder: number;
  isActive: boolean;
}) {
  await requirePlatformSuperAdmin();
  const data = z
    .object({
      organizationId: z.string().min(1),
      templateId: z.string().min(1),
      key: keySchema,
      questionType: questionTypeSchema,
      configJson: z.string().optional(),
      correctOptionId: z.string().nullable().optional(),
      traitCategory: z.string().nullable().optional(),
      weight: z.coerce.number(),
      timeLimitSeconds: z.number().int().nullable().optional(),
      reverseScored: z.boolean().optional(),
      sortOrder: z.coerce.number().int(),
      isActive: z.boolean(),
    })
    .parse(input);

  const tmpl = await prisma.assessmentTemplate.findUnique({
    where: { id: data.templateId },
    select: { organizationId: true },
  });
  if (!tmpl || tmpl.organizationId !== data.organizationId) {
    throw new Error("Template does not belong to the selected organization");
  }

  await prisma.question.create({
    data: {
      organizationId: data.organizationId,
      templateId: data.templateId,
      key: data.key.trim(),
      questionType: data.questionType,
      config: parseConfigJson(data.configJson) ?? undefined,
      correctOptionId: data.correctOptionId?.trim() || null,
      traitCategory: data.traitCategory?.trim() || null,
      weight: new Prisma.Decimal(String(data.weight)),
      timeLimitSeconds: data.timeLimitSeconds ?? null,
      reverseScored: data.reverseScored ?? false,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
  revalidatePath("/super-admin/questions");
  revalidatePath("/super-admin");
}

export async function updateQuestion(input: {
  id: string;
  organizationId: string;
  templateId: string;
  key: string;
  questionType: AssessmentQuestionType;
  configJson?: string;
  correctOptionId?: string | null;
  traitCategory?: string | null;
  weight: number;
  timeLimitSeconds?: number | null;
  reverseScored?: boolean;
  sortOrder: number;
  isActive: boolean;
}) {
  await requirePlatformSuperAdmin();
  const data = z
    .object({
      id: z.string().min(1),
      organizationId: z.string().min(1),
      templateId: z.string().min(1),
      key: keySchema,
      questionType: questionTypeSchema,
      configJson: z.string().optional(),
      correctOptionId: z.string().nullable().optional(),
      traitCategory: z.string().nullable().optional(),
      weight: z.coerce.number(),
      timeLimitSeconds: z.number().int().nullable().optional(),
      reverseScored: z.boolean().optional(),
      sortOrder: z.coerce.number().int(),
      isActive: z.boolean(),
    })
    .parse(input);

  const tmpl = await prisma.assessmentTemplate.findUnique({
    where: { id: data.templateId },
    select: { organizationId: true },
  });
  if (!tmpl || tmpl.organizationId !== data.organizationId) {
    throw new Error("Template does not belong to the selected organization");
  }

  await prisma.question.update({
    where: { id: data.id },
    data: {
      organizationId: data.organizationId,
      templateId: data.templateId,
      key: data.key.trim(),
      questionType: data.questionType,
      config: parseConfigJson(data.configJson) ?? undefined,
      correctOptionId: data.correctOptionId?.trim() || null,
      traitCategory: data.traitCategory?.trim() || null,
      weight: new Prisma.Decimal(String(data.weight)),
      timeLimitSeconds: data.timeLimitSeconds ?? null,
      reverseScored: data.reverseScored ?? false,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
  revalidatePath("/super-admin/questions");
  revalidatePath("/super-admin");
}

export async function deleteQuestion(id: string) {
  await requirePlatformSuperAdmin();
  await prisma.question.delete({ where: { id } });
  revalidatePath("/super-admin/questions");
  revalidatePath("/super-admin");
}
