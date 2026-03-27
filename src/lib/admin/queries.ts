import {
  AssessmentInstanceStatus,
  AssessmentTemplateType,
  EqAttemptStatus,
  EvaluatorRole,
  EvaluatorStatus,
  IqAttemptStatus,
  OrganizationRole,
  PsychAttemptStatus,
  UserActionStatus,
} from "@/generated/prisma/enums";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import prisma from "@/lib/prisma";

export type DateRange = { from: Date; to: Date };

export function defaultDateRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 90);
  return { from, to };
}

export function previousPeriod(range: DateRange): DateRange {
  const ms = range.to.getTime() - range.from.getTime();
  const to = new Date(range.from.getTime());
  const from = new Date(range.from.getTime() - ms);
  return { from, to };
}

function departmentLabel(m: { department: string | null } | undefined): string {
  const d = m?.department?.trim();
  return d && d.length > 0 ? d : "Unassigned";
}

/** KPI strip + trends vs previous period (descriptive, not predictive). */
export async function getAdminOverviewKpis(orgId: string, range: DateRange, prevRange: DateRange) {
  const [
    totalEmployees,
    active360,
    assessmentsCreated,
    assessmentsCompleted,
    prevCompleted,
    avgComp,
    prevAvgComp,
    iqCompleted,
    eqCompleted,
    psychCompleted,
  ] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
    prisma.assessment.count({
      where: { organizationId: orgId, status: AssessmentInstanceStatus.ACTIVE },
    }),
    prisma.assessment.count({
      where: { organizationId: orgId, createdAt: { gte: range.from, lte: range.to } },
    }),
    prisma.assessment.count({
      where: {
        organizationId: orgId,
        status: AssessmentInstanceStatus.COMPLETED,
        updatedAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.assessment.count({
      where: {
        organizationId: orgId,
        status: AssessmentInstanceStatus.COMPLETED,
        updatedAt: { gte: prevRange.from, lte: prevRange.to },
      },
    }),
    prisma.competencyScoreSnapshot.aggregate({
      where: { organizationId: orgId, recordedAt: { gte: range.from, lte: range.to } },
      _avg: { othersAverage: true },
    }),
    prisma.competencyScoreSnapshot.aggregate({
      where: { organizationId: orgId, recordedAt: { gte: prevRange.from, lte: prevRange.to } },
      _avg: { othersAverage: true },
    }),
    prisma.iqTestAttempt.count({
      where: {
        organizationId: orgId,
        status: IqAttemptStatus.COMPLETED,
        submittedAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.eqTestAttempt.count({
      where: {
        organizationId: orgId,
        status: EqAttemptStatus.COMPLETED,
        submittedAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.psychTestAttempt.count({
      where: {
        organizationId: orgId,
        status: PsychAttemptStatus.COMPLETED,
        submittedAt: { gte: range.from, lte: range.to },
      },
    }),
  ]);

  const completionRatePct =
    assessmentsCreated > 0 ? Math.round((assessmentsCompleted / assessmentsCreated) * 1000) / 10 : 0;
  const prevCreated = await prisma.assessment.count({
    where: { organizationId: orgId, createdAt: { gte: prevRange.from, lte: prevRange.to } },
  });
  const prevCompletionPct =
    prevCreated > 0 ? Math.round((prevCompleted / prevCreated) * 1000) / 10 : 0;

  const avgCompScore = avgComp._avg.othersAverage ?? 0;
  const prevAvg = prevAvgComp._avg.othersAverage ?? 0;

  return {
    totalEmployees,
    activeAssessments: active360,
    completionRatePct,
    completionTrend: completionRatePct - prevCompletionPct,
    avgCompetencyScore: Math.round(avgCompScore * 100) / 100,
    avgCompetencyTrend: Math.round((avgCompScore - prevAvg) * 100) / 100,
    assessmentVolume: {
      iq: iqCompleted,
      eq: eqCompleted,
      psych: psychCompleted,
      feedback360: assessmentsCompleted,
    },
  };
}

export async function getAdminAlerts(orgId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const [pendingEvaluations, unassigned360, overdue360, stalled360] = await Promise.all([
    prisma.assessmentEvaluator.count({
      where: {
        status: { in: [EvaluatorStatus.PENDING, EvaluatorStatus.IN_PROGRESS] },
        assessment: { organizationId: orgId },
      },
    }),
    prisma.assessment.count({
      where: {
        organizationId: orgId,
        status: AssessmentInstanceStatus.ACTIVE,
        evaluators: { none: {} },
      },
    }),
    prisma.assessment.count({
      where: {
        organizationId: orgId,
        status: AssessmentInstanceStatus.ACTIVE,
        dueAt: { lt: now },
      },
    }),
    prisma.assessment.count({
      where: {
        organizationId: orgId,
        status: AssessmentInstanceStatus.ACTIVE,
        evaluators: {
          some: {
            status: { in: [EvaluatorStatus.PENDING, EvaluatorStatus.IN_PROGRESS] },
            updatedAt: { lt: sevenDaysAgo },
          },
        },
      },
    }),
  ]);

  return {
    pendingEvaluations,
    unassigned360,
    overdue360,
    stalled360,
  };
}

export type HeatmapCell = {
  competencyKey: string;
  department: string;
  avg: number | null;
  sampleSize: number;
};

/** Competency × department matrix from snapshots in range. */
export async function getCompetencyHeatmap(orgId: string, range: DateRange): Promise<{
  rows: string[];
  cols: string[];
  cells: HeatmapCell[];
  blindSpots: { competencyKey: string; avg: number }[];
}> {
  const competencies = await prisma.competency.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true },
  });
  const compKeys = competencies.map((c) => c.key);

  const snapshots = await prisma.competencyScoreSnapshot.findMany({
    where: {
      organizationId: orgId,
      recordedAt: { gte: range.from, lte: range.to },
    },
    include: {
      user: {
        include: {
          organizationMembers: {
            where: { organizationId: orgId },
            take: 1,
          },
        },
      },
    },
  });

  const bucket = new Map<string, { sum: number; n: number }>();
  const orgWide = new Map<string, { sum: number; n: number }>();

  for (const s of snapshots) {
    const member = s.user.organizationMembers[0];
    const dept = departmentLabel(member);
    const ck = s.competencyKey;
    const v = s.othersAverage;
    const key = `${ck}::${dept}`;
    const cur = bucket.get(key) ?? { sum: 0, n: 0 };
    cur.sum += v;
    cur.n += 1;
    bucket.set(key, cur);

    const ow = orgWide.get(ck) ?? { sum: 0, n: 0 };
    ow.sum += v;
    ow.n += 1;
    orgWide.set(ck, ow);
  }

  const deptSet = new Set<string>();
  for (const s of snapshots) {
    const member = s.user.organizationMembers[0];
    deptSet.add(departmentLabel(member));
  }
  if (deptSet.size === 0) deptSet.add("Unassigned");
  const cols = [...deptSet].sort();

  const cells: HeatmapCell[] = [];
  for (const ck of compKeys) {
    for (const dept of cols) {
      const k = `${ck}::${dept}`;
      const agg = bucket.get(k);
      cells.push({
        competencyKey: ck,
        department: dept,
        avg: agg && agg.n > 0 ? Math.round((agg.sum / agg.n) * 100) / 100 : null,
        sampleSize: agg?.n ?? 0,
      });
    }
  }

  const blindSpots = [...orgWide.entries()]
    .map(([competencyKey, v]) => ({
      competencyKey,
      avg: v.n > 0 ? Math.round((v.sum / v.n) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);

  return { rows: compKeys, cols, cells, blindSpots };
}

export type Feedback360Row = {
  id: string;
  title: string | null;
  subjectName: string | null;
  subjectEmail: string | null;
  templateName: string;
  status: AssessmentInstanceStatus;
  dueAt: string | null;
  progressPct: number;
  evaluatorDone: number;
  evaluatorTotal: number;
  selfComplete: boolean;
  peersComplete: boolean;
  managerComplete: boolean;
  stalled: boolean;
  updatedAt: string;
};

export async function getFeedback360Console(orgId: string): Promise<Feedback360Row[]> {
  const rows = await prisma.assessment.findMany({
    where: {
      organizationId: orgId,
      template: { type: AssessmentTemplateType.BEHAVIORAL_360 },
    },
    include: {
      subject: { select: { name: true, email: true } },
      template: { select: { name: true } },
      evaluators: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  return rows.map((a) => {
    const ev = a.evaluators;
    const total = ev.length || 1;
    const done = ev.filter((e) => e.status === EvaluatorStatus.COMPLETED).length;
    const self = ev.find((e) => e.role === EvaluatorRole.SELF);
    const peers = ev.filter((e) => e.role === EvaluatorRole.PEER);
    const mgr = ev.find((e) => e.role === EvaluatorRole.MANAGER);
    const peersComplete = peers.length === 0 ? true : peers.every((e) => e.status === EvaluatorStatus.COMPLETED);
    const stalled =
      a.status === AssessmentInstanceStatus.ACTIVE &&
      ev.some(
        (e) =>
          e.status !== EvaluatorStatus.COMPLETED &&
          e.updatedAt < sevenDaysAgo,
      );

    return {
      id: a.id,
      title: a.title,
      subjectName: a.subject.name,
      subjectEmail: a.subject.email,
      templateName: a.template.name,
      status: a.status,
      dueAt: a.dueAt?.toISOString() ?? null,
      progressPct: Math.round((done / total) * 100),
      evaluatorDone: done,
      evaluatorTotal: ev.length,
      selfComplete: self?.status === EvaluatorStatus.COMPLETED,
      peersComplete,
      managerComplete: mgr ? mgr.status === EvaluatorStatus.COMPLETED : true,
      stalled,
      updatedAt: a.updatedAt.toISOString(),
    };
  });
}

export type RiskEmployee = {
  userId: string;
  name: string | null;
  email: string | null;
  reason: string;
};

export type PotentialEmployee = {
  userId: string;
  name: string | null;
  email: string | null;
  reason: string;
};

/** Rule-based flags from 360 gaps and snapshot history (descriptive). */
export async function getTalentLists(orgId: string): Promise<{
  highRisk: RiskEmployee[];
  highPotential: PotentialEmployee[];
}> {
  const results = await prisma.assessmentResult.findMany({
    where: { assessment: { organizationId: orgId } },
    include: {
      assessment: {
        include: { subject: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  const highRisk: RiskEmployee[] = [];
  const seenRisk = new Set<string>();

  for (const r of results) {
    const raw = r.competencyScores as unknown as Assessment360StoredResult;
    if (!raw || raw.strategy !== "MULTI_SOURCE") continue;
    const uid = r.assessment.subjectUserId;
    for (const c of raw.byCompetency) {
      if (Math.abs(c.gapSelfVsOthers) > 1.5) {
        const key = `${uid}::gap`;
        if (!seenRisk.has(key)) {
          seenRisk.add(key);
          highRisk.push({
            userId: uid,
            name: r.assessment.subject.name,
            email: r.assessment.subject.email,
            reason: `Large self vs others gap on ${c.competencyKey} (${c.gapSelfVsOthers.toFixed(2)})`,
          });
        }
      }
    }
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  for (const m of members) {
    const uid = m.userId;
    const [last360, lastIq, lastEq, lastPsych] = await Promise.all([
      prisma.assessment.findFirst({
        where: { organizationId: orgId, subjectUserId: uid, status: AssessmentInstanceStatus.COMPLETED },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.iqTestAttempt.findFirst({
        where: { organizationId: orgId, userId: uid, status: IqAttemptStatus.COMPLETED },
        orderBy: { submittedAt: "desc" },
        select: { submittedAt: true },
      }),
      prisma.eqTestAttempt.findFirst({
        where: { organizationId: orgId, userId: uid, status: EqAttemptStatus.COMPLETED },
        orderBy: { submittedAt: "desc" },
        select: { submittedAt: true },
      }),
      prisma.psychTestAttempt.findFirst({
        where: { organizationId: orgId, userId: uid, status: PsychAttemptStatus.COMPLETED },
        orderBy: { submittedAt: "desc" },
        select: { submittedAt: true },
      }),
    ]);

    const dates = [
      last360?.updatedAt,
      lastIq?.submittedAt ?? undefined,
      lastEq?.submittedAt ?? undefined,
      lastPsych?.submittedAt ?? undefined,
    ].filter(Boolean) as Date[];

    const latest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
    if (!latest || latest < sixMonthsAgo) {
      const key = `${uid}::stale`;
      if (!seenRisk.has(key)) {
        seenRisk.add(key);
        highRisk.push({
          userId: uid,
          name: m.user.name,
          email: m.user.email,
          reason: "No completed assessment activity in the last 6 months",
        });
      }
    }
  }

  const mgrSnaps = await prisma.competencyScoreSnapshot.findMany({
    where: { organizationId: orgId, manager: { not: null } },
    select: { userId: true, manager: true },
  });
  const mgrAvgByUser = new Map<string, { sum: number; n: number }>();
  for (const s of mgrSnaps) {
    if (s.manager == null) continue;
    const cur = mgrAvgByUser.get(s.userId) ?? { sum: 0, n: 0 };
    cur.sum += s.manager;
    cur.n += 1;
    mgrAvgByUser.set(s.userId, cur);
  }
  for (const [uid, agg] of mgrAvgByUser) {
    const avg = agg.n > 0 ? agg.sum / agg.n : 0;
    if (avg >= 2.5) continue;
    const u = await prisma.user.findUnique({ where: { id: uid }, select: { name: true, email: true } });
    const key = `${uid}::mgr`;
    if (!seenRisk.has(key)) {
      seenRisk.add(key);
      highRisk.push({
        userId: uid,
        name: u?.name ?? null,
        email: u?.email ?? null,
        reason: "Average manager rating across snapshots is below 2.5 (1–5 scale)",
      });
    }
  }

  const highPotential: PotentialEmployee[] = [];
  const seenPot = new Set<string>();

  for (const r of results) {
    const raw = r.competencyScores as unknown as Assessment360StoredResult;
    if (!raw || raw.strategy !== "MULTI_SOURCE") continue;
    const uid = r.assessment.subjectUserId;
    for (const c of raw.byCompetency) {
      const self = c.self ?? 0;
      const oth = c.othersAverage;
      if (oth >= 4 && self < oth - 0.5) {
        const key = `${uid}::humility`;
        if (!seenPot.has(key)) {
          seenPot.add(key);
          highPotential.push({
            userId: uid,
            name: r.assessment.subject.name,
            email: r.assessment.subject.email,
            reason: `Strong others’ ratings on ${c.competencyKey} with lower self score — coaching opportunity`,
          });
        }
      }
    }
  }

  return { highRisk, highPotential };
}

export async function getTeamPsychSummary(orgId: string): Promise<{
  department: string;
  avgOpenness: number;
  avgExtraversion: number;
  avgConscientiousness: number;
  avgAgreeableness: number;
  avgNeuroticism: number;
  n: number;
}[]> {
  const results = await prisma.psychTestResult.findMany({
    where: {
      attempt: {
        organizationId: orgId,
        status: PsychAttemptStatus.COMPLETED,
      },
    },
    include: {
      attempt: {
        include: {
          user: {
            include: {
              organizationMembers: {
                where: { organizationId: orgId },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const byDept = new Map<string, { sums: number[]; n: number }>();
  const traits = ["Openness", "Extraversion", "Conscientiousness", "Agreeableness", "Neuroticism"] as const;

  for (const r of results) {
    const member = r.attempt.user.organizationMembers[0];
    const dept = departmentLabel(member);
    const tp = r.traitPercentiles as Record<string, number>;
    const cur = byDept.get(dept) ?? { sums: [0, 0, 0, 0, 0], n: 0 };
    for (let i = 0; i < traits.length; i++) {
      cur.sums[i] += tp[traits[i]!] ?? 0;
    }
    cur.n += 1;
    byDept.set(dept, cur);
  }

  return [...byDept.entries()].map(([department, v]) => ({
    department,
    avgOpenness: v.n ? Math.round((v.sums[0]! / v.n) * 10) / 10 : 0,
    avgExtraversion: v.n ? Math.round((v.sums[1]! / v.n) * 10) / 10 : 0,
    avgConscientiousness: v.n ? Math.round((v.sums[2]! / v.n) * 10) / 10 : 0,
    avgAgreeableness: v.n ? Math.round((v.sums[3]! / v.n) * 10) / 10 : 0,
    avgNeuroticism: v.n ? Math.round((v.sums[4]! / v.n) * 10) / 10 : 0,
    n: v.n,
  }));
}

export async function getAssessmentDistribution(orgId: string, range: DateRange) {
  const [c360, iq, eq, psych] = await Promise.all([
    prisma.assessment.count({
      where: {
        organizationId: orgId,
        status: AssessmentInstanceStatus.COMPLETED,
        updatedAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.iqTestAttempt.count({
      where: {
        organizationId: orgId,
        status: IqAttemptStatus.COMPLETED,
        submittedAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.eqTestAttempt.count({
      where: {
        organizationId: orgId,
        status: EqAttemptStatus.COMPLETED,
        submittedAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.psychTestAttempt.count({
      where: {
        organizationId: orgId,
        status: PsychAttemptStatus.COMPLETED,
        submittedAt: { gte: range.from, lte: range.to },
      },
    }),
  ]);

  return {
    feedback360: c360,
    iq,
    eq,
    psych,
    total: c360 + iq + eq + psych,
  };
}

export async function getActionOversight(orgId: string) {
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);

  const [completionRates, bottlenecks] = await Promise.all([
    prisma.userAction.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { _all: true },
    }),
    prisma.userAction.findMany({
      where: {
        organizationId: orgId,
        status: { in: [UserActionStatus.ASSIGNED, UserActionStatus.IN_PROGRESS] },
        assignedAt: { lt: twoWeeksAgo },
      },
      include: {
        user: { select: { name: true, email: true } },
        action: { select: { title: true } },
      },
      orderBy: { assignedAt: "asc" },
      take: 50,
    }),
  ]);

  const total = completionRates.reduce((s, x) => s + x._count._all, 0);
  const done = completionRates.find((x) => x.status === UserActionStatus.COMPLETED)?._count._all ?? 0;
  const ratePct = total > 0 ? Math.round((done / total) * 1000) / 10 : 0;

  return {
    completionRatePct: ratePct,
    byStatus: completionRates.map((x) => ({ status: x.status, count: x._count._all })),
    bottlenecks: bottlenecks.map((b) => ({
      id: b.id,
      userName: b.user.name,
      userEmail: b.user.email,
      actionTitle: b.action.title,
      status: b.status,
      assignedAt: b.assignedAt.toISOString(),
    })),
  };
}

export type PeopleRow = {
  userId: string;
  name: string | null;
  email: string | null;
  department: string | null;
  role: OrganizationRole;
  isActive: boolean;
};

export async function getPeopleDirectory(orgId: string): Promise<PeopleRow[]> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
    orderBy: { user: { email: "asc" } },
  });
  return members.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    department: m.department,
    role: m.role,
    isActive: m.user.isActive,
  }));
}
