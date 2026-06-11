import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// 9-box cell labels by [performance][potential] (1=Low, 2=Med, 3=High)
const CELL_LABELS: Record<string, string> = {
  '3-3': 'Star',
  '2-3': 'Future Star',
  '1-3': 'High Potential',
  '3-2': 'Strong Performer',
  '2-2': 'Core Player',
  '1-2': 'Developing',
  '3-1': 'Effective',
  '2-1': 'Inconsistent',
  '1-1': 'Underperformer',
};

export function getCellLabel(perf: number, potential: number): string {
  const key = `${Math.round(perf)}-${Math.round(potential)}`;
  return CELL_LABELS[key] ?? 'Unknown';
}

export async function getTalentGridPlacements(orgId: string, cycleId?: string) {
  const where: Record<string, unknown> = { organizationId: orgId };
  if (cycleId) where.cycleId = cycleId;
  else where.cycleId = null;

  const placements = await prisma.talentGridPlacement.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, email: true } },
      placedBy: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return placements;
}

export type TalentGridPlacementWithUser = Awaited<ReturnType<typeof getTalentGridPlacements>>[number];

export async function upsertGridPlacement(
  orgId: string,
  placedById: string,
  employeeId: string,
  performanceScore: number,
  potentialScore: number,
  notes: string,
  cycleId?: string,
) {
  const cellLabel = getCellLabel(performanceScore, potentialScore);
  await prisma.talentGridPlacement.upsert({
    where: {
      organizationId_employeeId_cycleId: {
        organizationId: orgId,
        employeeId,
        cycleId: cycleId ?? null,
      },
    },
    create: {
      organizationId: orgId,
      employeeId,
      placedById,
      performanceScore,
      potentialScore,
      cellLabel,
      notes: notes || null,
      cycleId: cycleId ?? null,
      isAutoSuggested: false,
    },
    update: {
      performanceScore,
      potentialScore,
      cellLabel,
      notes: notes || null,
      placedById,
      isAutoSuggested: false,
    },
  });
  revalidatePath('/admin/talent');
}

// Auto-suggest placements from 360 + psychometric data
export async function autoSuggestPlacements(orgId: string, placedById: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true } } },
  });

  let count = 0;
  for (const m of members) {
    const uid = m.userId;
    // Performance proxy: average of 360 othersAverage scores
    const snapshots = await prisma.competencyScoreSnapshot.findMany({
      where: { organizationId: orgId, userId: uid },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });
    if (snapshots.length === 0) continue;
    const avgOthers = snapshots.reduce((s, x) => s + x.othersAverage, 0) / snapshots.length;
    // Map 1-5 score to 1-3 bucket
    const perfBucket = avgOthers >= 4 ? 3 : avgOthers >= 2.5 ? 2 : 1;

    // Potential proxy: Conscientiousness + Openness from psychometric
    const psychResult = await prisma.psychTestResult.findFirst({
      where: { attempt: { organizationId: orgId, userId: uid } },
      orderBy: { createdAt: 'desc' },
    });
    let potBucket = 2; // default medium
    if (psychResult) {
      const tp = psychResult.traitPercentiles as Record<string, number>;
      const c = tp['Conscientiousness'] ?? 50;
      const o = tp['Openness'] ?? 50;
      const potScore = (c + o) / 2;
      potBucket = potScore >= 65 ? 3 : potScore >= 35 ? 2 : 1;
    }

    const cellLabel = getCellLabel(perfBucket, potBucket);
    await prisma.talentGridPlacement.upsert({
      where: {
        organizationId_employeeId_cycleId: {
          organizationId: orgId,
          employeeId: uid,
          cycleId: null,
        },
      },
      create: {
        organizationId: orgId,
        employeeId: uid,
        placedById,
        performanceScore: perfBucket,
        potentialScore: potBucket,
        cellLabel,
        isAutoSuggested: true,
        cycleId: null,
      },
      update: {
        performanceScore: perfBucket,
        potentialScore: potBucket,
        cellLabel,
        isAutoSuggested: true,
      },
    });
    count++;
  }
  revalidatePath('/admin/talent');
  return count;
}
