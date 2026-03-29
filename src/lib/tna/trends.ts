import prisma from "@/lib/prisma";
import type { TrendPoint } from "@/lib/tna/ai";

const DEFAULT_TARGET = 4.0;

/**
 * Builds monthly trend points from competency score snapshots (360 / assessments).
 * Uses org-wide default targets (department null) when present; otherwise 4.0.
 */
export async function buildGapTrendPointsFromSnapshots(organizationId: string): Promise<TrendPoint[]> {
  const competencies = await prisma.competency.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, key: true },
  });
  const keyToId = new Map(competencies.map((c) => [c.key, c.id]));

  const targets = await prisma.competencyTarget.findMany({
    where: { organizationId, department: null, careerLevel: null },
    select: { competencyId: true, targetScore: true },
  });
  const targetByCompId = new Map(targets.map((t) => [t.competencyId, t.targetScore]));

  const points: TrendPoint[] = [];
  const now = new Date();

  for (let m = 5; m >= 0; m--) {
    const start = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59, 999);
    const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

    const snapshots = await prisma.competencyScoreSnapshot.findMany({
      where: {
        organizationId,
        recordedAt: { gte: start, lte: end },
      },
      select: { competencyKey: true, othersAverage: true },
    });

    if (snapshots.length === 0) continue;

    let sumGap = 0;
    let criticalCount = 0;
    for (const s of snapshots) {
      const cid = keyToId.get(s.competencyKey);
      const target = cid ? (targetByCompId.get(cid) ?? DEFAULT_TARGET) : DEFAULT_TARGET;
      const gap = target - s.othersAverage;
      sumGap += gap;
      if (gap > 1.5) criticalCount++;
    }

    points.push({
      period: label,
      avgGap: sumGap / snapshots.length,
      criticalCount,
    });
  }

  return points;
}
