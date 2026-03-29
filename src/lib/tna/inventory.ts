import type { GapSeverity } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { gapSeverityFromGap, priorityFromGap } from "./gaps";
import { resolveTargetForCompetency } from "./targets";

/**
 * Rebuild SkillsInventory rows for one user from latest competency snapshots + targets.
 */
export async function rebuildSkillsInventoryForUser(organizationId: string, userId: string): Promise<void> {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { department: true },
  });

  const competencies = await prisma.competency.findMany({
    where: { organizationId, isActive: true },
  });

  const snapshots = await prisma.competencyScoreSnapshot.findMany({
    where: { userId, organizationId },
    orderBy: { recordedAt: "desc" },
  });
  const latestByKey = new Map<string, number>();
  for (const s of snapshots) {
    if (!latestByKey.has(s.competencyKey)) {
      latestByKey.set(s.competencyKey, s.othersAverage);
    }
  }

  for (const c of competencies) {
    const current = latestByKey.get(c.key);
    if (current === undefined) continue;

    const targetRow = await resolveTargetForCompetency(organizationId, c.id, member?.department ?? null);
    const targetScore = targetRow?.targetScore ?? 4.0;
    const gap = targetScore - current;
    const severity: GapSeverity = gap < 0 ? "EXCEEDS" : gapSeverityFromGap(gap);

    await prisma.skillsInventory.upsert({
      where: {
        userId_organizationId_competencyId: {
          userId,
          organizationId,
          competencyId: c.id,
        },
      },
      create: {
        organizationId,
        userId,
        competencyId: c.id,
        currentScore: current,
        targetScore,
        gap,
        severity,
        gapCountHint: gap > 0.5 ? 1 : 0,
      },
      update: {
        currentScore: current,
        targetScore,
        gap,
        severity,
        gapCountHint: gap > 0.5 ? 1 : 0,
      },
    });
  }
}

export async function rebuildSkillsInventoryForOrganization(organizationId: string): Promise<void> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    select: { userId: true },
  });
  for (const m of members) {
    await rebuildSkillsInventoryForUser(organizationId, m.userId);
  }
}

export { priorityFromGap };
