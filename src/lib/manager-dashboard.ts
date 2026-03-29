import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AssessmentTemplateType, UserActionStatus } from "@/generated/prisma/enums";

export type TeamMemberRow = {
  id: string;
  name: string | null;
  email: string | null;
  department: string | null;
  role: string;
  lastActiveAt: Date | null;
  competencySnapshot: {
    othersAverage: number | null;
    gapSelfVsOthers: number | null;
  } | null;
  pendingActions: number;
  recent360Status: "completed" | "in_progress" | "none";
  recent360Id: string | null;
};

export type CompetencyHeatmapRow = {
  competencyKey: string;
  competencyName: string;
  avgScore: number;
  sampleSize: number;
  gapDirection: "positive" | "negative" | "neutral";
};

export type TeamDashboardPayload = {
  managerName: string | null;
  department: string | null;
  organizationId: string;
  organizationName: string;
  teamSize: number;
  teamMembers: TeamMemberRow[];
  aggregatedStats: {
    avgCompetencyScore: number;
    avgGap: number;
    actionCompletionRate: number;
    pending360s: number;
  };
  competencyHeatmap: CompetencyHeatmapRow[];
};

export async function getManagerTeamPayload(): Promise<TeamDashboardPayload | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Get user's organization membership with department
  const myMembership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: { select: { id: true, name: true } } },
  });

  if (!myMembership) return null;

  const { department, organizationId } = myMembership;
  const orgName = myMembership.organization.name;

  // Find team members (same department, or if no department set, all org members)
  const whereClause = department
    ? { organizationId, department, userId: { not: userId } }
    : { organizationId, userId: { not: userId } };

  const teamMembersData = await prisma.organizationMember.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          competencySnapshots: {
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: {
              othersAverage: true,
              self: true,
            },
          },
          userActions: {
            where: {
              status: { in: [UserActionStatus.ASSIGNED, UserActionStatus.IN_PROGRESS] },
            },
            select: { id: true },
          },
          assessmentsAsSubject: {
            where: {
              template: { type: AssessmentTemplateType.BEHAVIORAL_360 },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              result: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  // Build team member rows
  const teamMembers: TeamMemberRow[] = teamMembersData.map((member) => {
    const user = member.user;
    const latestSnapshot = user.competencySnapshots?.[0];
    const recent360 = user.assessmentsAsSubject?.[0];

    let recent360Status: "completed" | "in_progress" | "none" = "none";
    if (recent360) {
      recent360Status = recent360.result ? "completed" : "in_progress";
    }

    const selfScore = latestSnapshot?.self;
    const othersAvg = latestSnapshot?.othersAverage;
    let gapSelfVsOthers: number | null = null;
    if (selfScore != null && othersAvg != null) {
      const s = Number(selfScore);
      const o = Number(othersAvg);
      if (Number.isFinite(s) && Number.isFinite(o)) {
        gapSelfVsOthers = s - o;
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      department: member.department,
      role: member.role,
      lastActiveAt: null,
      competencySnapshot: latestSnapshot
        ? {
            othersAverage: latestSnapshot.othersAverage,
            gapSelfVsOthers,
          }
        : null,
      pendingActions: user.userActions.length,
      recent360Status,
      recent360Id: recent360?.id || null,
    };
  });

  // Calculate aggregated stats
  const membersWithScores = teamMembers.filter((m) => m.competencySnapshot?.othersAverage !== null);
  const avgCompetencyScore =
    membersWithScores.length > 0
      ? membersWithScores.reduce((sum, m) => sum + (m.competencySnapshot?.othersAverage || 0), 0) /
        membersWithScores.length
      : 0;

  const membersWithGaps = teamMembers.filter((m) => m.competencySnapshot?.gapSelfVsOthers !== null);
  const avgGap =
    membersWithGaps.length > 0
      ? membersWithGaps.reduce((sum, m) => sum + (m.competencySnapshot?.gapSelfVsOthers || 0), 0) /
        membersWithGaps.length
      : 0;

  const totalPendingActions = teamMembers.reduce((sum, m) => sum + m.pendingActions, 0);
  const actionCompletionRate = totalPendingActions > 0 ? 0 : 100;

  const pending360s = teamMembers.filter((m) => m.recent360Status === "in_progress").length;

  const teamUserIds = teamMembersData.map((m) => m.user.id);

  const competencyDefinitions = await prisma.competency.findMany({
    where: { organizationId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true, name: true },
    take: 16,
  });

  let competencyHeatmap: CompetencyHeatmapRow[] = [];

  if (teamUserIds.length > 0 && competencyDefinitions.length > 0) {
    const compKeys = competencyDefinitions.map((c) => c.key);
    const snapshots = await prisma.competencyScoreSnapshot.findMany({
      where: {
        organizationId,
        userId: { in: teamUserIds },
        competencyKey: { in: compKeys },
      },
      orderBy: { recordedAt: "desc" },
      select: {
        userId: true,
        competencyKey: true,
        othersAverage: true,
        self: true,
      },
    });

    const seen = new Set<string>();
    const latestPerUserComp = snapshots.filter((s) => {
      const k = `${s.userId}:${s.competencyKey}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const buckets = new Map<string, { others: number[]; gaps: number[] }>();
    for (const c of competencyDefinitions) {
      buckets.set(c.key, { others: [], gaps: [] });
    }
    for (const s of latestPerUserComp) {
      if (!s) continue;
      const b = buckets.get(s.competencyKey);
      if (!b) continue;
      b.others.push(s.othersAverage);
      const selfVal = s.self;
      if (selfVal != null) {
        const sv = Number(selfVal);
        const ov = Number(s.othersAverage);
        if (Number.isFinite(sv) && Number.isFinite(ov)) {
          b.gaps.push(sv - ov);
        }
      }
    }

    competencyHeatmap = competencyDefinitions
      .map((c) => {
        const b = buckets.get(c.key)!;
        const n = b.others.length;
        if (n === 0) return null;
        const avgScore = b.others.reduce((a, x) => a + x, 0) / n;
        const avgGapComp =
          b.gaps.length > 0 ? b.gaps.reduce((a, x) => a + x, 0) / b.gaps.length : 0;
        const gapDirection: "positive" | "negative" | "neutral" =
          avgGapComp > 0.1 ? "negative" : avgGapComp < -0.1 ? "positive" : "neutral";
        return {
          competencyKey: c.key,
          competencyName: c.name,
          avgScore: Number(avgScore.toFixed(2)),
          sampleSize: n,
          gapDirection,
        };
      })
      .filter((row): row is CompetencyHeatmapRow => row != null);
  }

  return {
    managerName: session.user.name ?? null,
    department,
    organizationId,
    organizationName: orgName,
    teamSize: teamMembers.length,
    teamMembers,
    aggregatedStats: {
      avgCompetencyScore: Number(avgCompetencyScore.toFixed(2)),
      avgGap: Number(avgGap.toFixed(2)),
      actionCompletionRate,
      pending360s,
    },
    competencyHeatmap,
  };
}
