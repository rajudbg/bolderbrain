"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { TrainingNeedSource, TrainingNeedStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { priorityFromGap } from "@/lib/tna/gaps";
import { resolveTargetForCompetency } from "@/lib/tna/targets";
import { generateDevPlan } from "@/lib/ai/eq-psych-narratives";
import { OCEAN_TRAITS, oceanDisplayName } from "@/lib/ocean-traits";

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

export async function generateMyDevPlan(): Promise<{ planText: string; source: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const member = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: { select: { name: true } } },
  });

  // Lowest-gap competency from skills inventory
  const topGapInventory = await prisma.skillsInventory.findFirst({
    where: { userId, gap: { gt: 0 } },
    include: { competency: { select: { name: true } } },
    orderBy: { gap: "desc" },
  });

  // Lowest EQ domain from most recent EQ result
  const latestEq = await prisma.eqTestAttempt.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { submittedAt: "desc" },
    include: { result: { select: { lowestDomain: true } } },
  });

  // Top OCEAN trait from most recent psych result
  const latestPsych = await prisma.psychTestAttempt.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { submittedAt: "desc" },
    include: { result: { select: { traitPercentiles: true } } },
  });

  const lowestCompetency = topGapInventory?.competency.name ?? "Communication";
  const lowestEqDomain = latestEq?.result?.lowestDomain ?? undefined;
  let topOceanTrait: string | undefined;
  if (latestPsych?.result?.traitPercentiles) {
    const pcts = latestPsych.result.traitPercentiles as Record<string, number>;
    const top = [...OCEAN_TRAITS].sort((a, b) => (pcts[b] ?? 0) - (pcts[a] ?? 0))[0];
    topOceanTrait = top ? oceanDisplayName(top) : undefined;
  }

  const result = await generateDevPlan({
    userId,
    lowestCompetency,
    lowestEqDomain,
    topOceanTrait,
    role: member?.organization.name ? `employee at ${member.organization.name}` : "professional",
  });

  return { planText: result.planText, source: result.source };
}
