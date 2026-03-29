"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TrainingNeedStatus } from "@/generated/prisma/enums";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import prisma from "@/lib/prisma";
import {
  aiRecommendProgram,
  analyzeOrganizationalGaps,
  predictTrainingNeeds,
  type OrgGapStat,
} from "@/lib/tna/ai";
import { buildGapTrendPointsFromSnapshots } from "@/lib/tna/trends";

function buildOrgGapStats(
  inventory: { competencyId: string; gap: number; severity: string }[],
  competencies: { id: string; name: string }[],
): OrgGapStat[] {
  const byComp = new Map<string, { sum: number; n: number; critical: number }>();
  for (const row of inventory) {
    const cur = byComp.get(row.competencyId) ?? { sum: 0, n: 0, critical: 0 };
    cur.sum += row.gap;
    cur.n += 1;
    if (row.severity === "CRITICAL") cur.critical += 1;
    byComp.set(row.competencyId, cur);
  }
  return competencies.map((c) => {
    const agg = byComp.get(c.id);
    const avgGap = agg && agg.n ? agg.sum / agg.n : 0;
    const criticalShare = agg && agg.n ? agg.critical / agg.n : 0;
    return {
      competencyName: c.name,
      avgGap,
      peopleAffected: agg?.n ?? 0,
      criticalShare,
    };
  });
}

export async function getTnaDashboardSnapshot() {
  const orgId = await requireAdminOrganizationId();

  const [needs, inventory, competencies, programs, members] = await Promise.all([
    prisma.trainingNeed.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        competency: { select: { id: true, key: true, name: true } },
        assignedProgram: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 400,
    }),
    prisma.skillsInventory.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        competency: { select: { id: true, key: true, name: true } },
      },
    }),
    prisma.competency.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, key: true, name: true },
    }),
    prisma.trainingProgram.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      select: { userId: true },
    }),
  ]);

  const criticalQueue = needs.filter((n) => n.gap > 1.5 && n.status !== "RESOLVED").slice(0, 50);

  let met = 0;
  let gap = 0;
  let exceeds = 0;
  for (const row of inventory) {
    if (row.severity === "EXCEEDS") exceeds++;
    else if (row.severity === "MET") met++;
    else gap++;
  }
  const totalCells = inventory.length || 1;
  const summaryPct = {
    atStandard: Math.round((met / totalCells) * 100),
    withGaps: Math.round((gap / totalCells) * 100),
    exceeding: Math.round((exceeds / totalCells) * 100),
  };

  const orgGapStats = buildOrgGapStats(inventory, competencies);

  return {
    needs,
    inventory,
    competencies,
    programs,
    memberCount: members.length,
    criticalQueue,
    summaryPct,
    orgGapStats,
  };
}

export async function runStrategicGapBrief(): Promise<string> {
  const snap = await getTnaDashboardSnapshot();
  const stats = snap.orgGapStats.filter((s) => s.peopleAffected > 0);
  return analyzeOrganizationalGaps(stats);
}

export async function runTrendForecastBrief(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const trendData = await buildGapTrendPointsFromSnapshots(orgId);
  return predictTrainingNeeds(trendData);
}

const bulkAssignSchema = z.object({
  needIds: z.array(z.string().min(1)).min(1),
  programId: z.string().min(1),
});

export async function bulkAssignNeedsToProgram(input: z.infer<typeof bulkAssignSchema>) {
  const data = bulkAssignSchema.parse(input);
  const orgId = await requireAdminOrganizationId();

  const program = await prisma.trainingProgram.findFirst({
    where: { id: data.programId, organizationId: orgId },
    select: { id: true },
  });
  if (!program) throw new Error("Training program not found");

  await prisma.trainingNeed.updateMany({
    where: { id: { in: data.needIds }, organizationId: orgId },
    data: {
      assignedProgramId: program.id,
      status: TrainingNeedStatus.ASSIGNED,
    },
  });

  revalidatePath("/admin/tna");
}

const recommendSchema = z.object({
  competencyName: z.string().min(1),
  gap: z.number(),
  roleHint: z.string().optional(),
});

export async function runAiRecommendProgram(input: z.infer<typeof recommendSchema>) {
  const data = recommendSchema.parse(input);
  return aiRecommendProgram(data.competencyName, data.gap, data.roleHint ?? "");
}
