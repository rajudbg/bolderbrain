"use server";

import { revalidatePath } from "next/cache";
import { ActionDifficulty } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { sanitizeRichText } from "@/lib/sanitize";
import { z } from "zod";

export async function listOrganizationsForDevelopment() {
  await requirePlatformSuperAdmin();
  return prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function listCompetenciesForOrg(organizationId: string) {
  await requirePlatformSuperAdmin();
  return prisma.competency.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { actions: true } } },
  });
}

export async function listActionsForCompetency(competencyId: string) {
  await requirePlatformSuperAdmin();
  return prisma.action.findMany({
    where: { competencyId },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
}

const competencySchema = z.object({
  organizationId: z.string().min(1),
  key: z.string().min(1).max(128),
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int(),
});

export async function createCompetency(input: z.infer<typeof competencySchema>) {
  await requirePlatformSuperAdmin();
  const data = competencySchema.parse(input);
  await prisma.competency.create({
    data: {
      organizationId: data.organizationId,
      key: data.key.trim(),
      name: data.name.trim(),
      description: data.description ? sanitizeRichText(data.description.trim()) || null : null,
      sortOrder: data.sortOrder,
    },
  });
  revalidatePath("/super-admin/development");
}

export async function deleteCompetency(id: string) {
  await requirePlatformSuperAdmin();
  await prisma.competency.delete({ where: { id } });
  revalidatePath("/super-admin/development");
}

const actionSchema = z.object({
  competencyId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.nativeEnum(ActionDifficulty),
  estimatedTime: z.coerce.number().int().min(1).max(24 * 60),
  sortOrder: z.coerce.number().int(),
});

export async function createAction(input: z.infer<typeof actionSchema>) {
  await requirePlatformSuperAdmin();
  const data = actionSchema.parse(input);
  await prisma.action.create({
    data: {
      competencyId: data.competencyId,
      title: data.title.trim(),
      description: sanitizeRichText(data.description.trim()),
      difficulty: data.difficulty,
      estimatedTime: data.estimatedTime,
      sortOrder: data.sortOrder,
    },
  });
  revalidatePath("/super-admin/development");
}

export async function deleteAction(id: string) {
  await requirePlatformSuperAdmin();
  await prisma.action.delete({ where: { id } });
  revalidatePath("/super-admin/development");
}
