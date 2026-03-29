"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { TrainingNeedSource, TrainingNeedStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { priorityFromGap } from "@/lib/tna/gaps";
import { resolveTargetForCompetency } from "@/lib/tna/targets";

export async function getDevelopmentHubPayload() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });
  if (!member) return null;

  const orgId = member.organizationId;

  const [inventory, needs, competencies] = await Promise.all([
    prisma.skillsInventory.findMany({
      where: { userId: session.user.id, organizationId: orgId },
      include: { competency: { select: { id: true, key: true, name: true } } },
      orderBy: { gap: "desc" },
    }),
    prisma.trainingNeed.findMany({
      where: { userId: session.user.id, organizationId: orgId },
      include: { competency: true, assignedProgram: { select: { name: true, id: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.competency.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, key: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    organizationName: member.organization.name,
    organizationSlug: member.organization.slug,
    inventory,
    needs,
    competencies,
  };
}

const selfNeedSchema = z.object({
  competencyId: z.string().min(1),
  note: z.string().max(2000).optional(),
});

export async function createSelfIdentifiedTrainingNeed(input: z.infer<typeof selfNeedSchema>) {
  const data = selfNeedSchema.parse(input);
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!member) throw new Error("No organization");

  const orgId = member.organizationId;

  const comp = await prisma.competency.findFirst({
    where: { id: data.competencyId, organizationId: orgId, isActive: true },
  });
  if (!comp) throw new Error("Competency not found");

  const existingInv = await prisma.skillsInventory.findUnique({
    where: {
      userId_organizationId_competencyId: {
        userId: session.user.id,
        organizationId: orgId,
        competencyId: comp.id,
      },
    },
  });

  const targetRow = await resolveTargetForCompetency(orgId, comp.id, member.department ?? null);
  const targetScore = targetRow?.targetScore ?? 4.0;
  const currentScore = existingInv?.currentScore ?? 3.0;
  const gap = targetScore - currentScore;
  if (gap <= 0.1) {
    throw new Error("You are already at or above target for this competency.");
  }

  await prisma.trainingNeed.create({
    data: {
      organizationId: orgId,
      userId: session.user.id,
      competencyId: comp.id,
      currentScore,
      targetScore,
      gap,
      priority: priorityFromGap(gap),
      source: TrainingNeedSource.SELF_IDENTIFIED,
      status: TrainingNeedStatus.OPEN,
      notes: data.note?.trim() || null,
    },
  });

  revalidatePath("/app/development");
}
