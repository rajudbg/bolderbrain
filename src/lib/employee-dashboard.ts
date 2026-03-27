import { auth } from "@/auth";
import { AssessmentTemplateType } from "@/generated/prisma/enums";
import { getCompetencyTrendsForUser } from "@/lib/action-engine";
import type { EqDomainKey } from "@/lib/eq-domains";
import { buildEqDashboardInsights } from "@/lib/eq-dashboard-insights";
import prisma from "@/lib/prisma";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import { generate360Insights } from "@/lib/insights";
import type { GeneratedInsight } from "@/lib/insights/types";
import { getIsoWeekKey } from "@/lib/iso-week";

export type DashboardAssessmentRow = {
  id: string;
  title: string;
  orgName: string;
  orgSlug: string;
  role: "subject" | "evaluator";
  statusLabel: "Completed" | "Pending" | "In progress";
  resultUrl: string | null;
  takeUrl: string | null;
  updatedAt: string;
};

function evaluatorStatusLabel(s: string): "Completed" | "Pending" | "In progress" {
  if (s === "COMPLETED") return "Completed";
  if (s === "IN_PROGRESS") return "In progress";
  return "Pending";
}

export async function getEmployeeDashboardPayload() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const tenantClaims = session.user.tenants ?? [];
  const orgIds = tenantClaims.map((t) => t.organizationId);
  const orgRows =
    orgIds.length > 0
      ? await prisma.organization.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, slug: true, name: true },
        })
      : [];
  const tenants = tenantClaims.map((t) => {
    const o = orgRows.find((x) => x.id === t.organizationId);
    return { slug: t.slug, name: o?.name ?? t.slug };
  });
  const isOrgAdmin = tenantClaims.some((t) => t.role === "ADMIN" || t.role === "SUPER_ADMIN");

  const latestResult = await prisma.assessmentResult.findFirst({
    where: {
      assessment: {
        subjectUserId: userId,
        template: { type: AssessmentTemplateType.BEHAVIORAL_360 },
      },
    },
    orderBy: { computedAt: "desc" },
    include: {
      assessment: {
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          template: { select: { name: true } },
        },
      },
    },
  });

  let scores: Assessment360StoredResult | null = null;
  let profileTitle = "";
  let orgName = "";
  let orgSlug = "";
  let assessmentId: string | null = null;

  if (latestResult) {
    scores = latestResult.competencyScores as unknown as Assessment360StoredResult;
    profileTitle = latestResult.assessment.title ?? latestResult.assessment.template.name;
    orgName = latestResult.assessment.organization.name;
    orgSlug = latestResult.assessment.organization.slug;
    assessmentId = latestResult.assessment.id;
  }

  const orgIdForRules = latestResult?.assessment.organizationId ?? null;

  const dbRules =
    orgIdForRules !== null
      ? await prisma.insightRule.findMany({
          where: {
            isActive: true,
            OR: [{ organizationId: null }, { organizationId: orgIdForRules }],
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            competencyKey: true,
            minGap: true,
            maxGap: true,
            messageTemplate: true,
            severity: true,
            sortOrder: true,
          },
        })
      : [];

  const insights =
    scores && scores.version === 1
      ? generate360Insights(scores, dbRules, { limit: 3 })
      : [];

  const latestEq = await prisma.eqTestResult.findFirst({
    where: {
      attempt: {
        userId,
        organizationId: { in: orgIds },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      attempt: { include: { template: true } },
    },
  });

  let eqInsights: GeneratedInsight[] = [];
  if (latestEq) {
    const ds = latestEq.domainScores as Record<EqDomainKey, number>;
    const pd = latestEq.percentileByDomain as Record<EqDomainKey, number>;
    let communication360: number | null = null;
    if (scores?.version === 1) {
      const row = scores.byCompetency.find((c) => c.competencyKey === "Communication");
      if (row) communication360 = row.othersAverage;
    }
    eqInsights = buildEqDashboardInsights({
      templateName: latestEq.attempt.template.name,
      highestDomain: latestEq.highestDomain as EqDomainKey,
      lowestDomain: latestEq.lowestDomain as EqDomainKey,
      percentileByDomain: pd,
      compositePercentile: latestEq.percentileComposite,
      communication360,
      socialSkillsScore: ds.SocialSkills,
    });
  }

  const [asSubject, asEvaluator] = await Promise.all([
    prisma.assessment.findMany({
      where: {
        subjectUserId: userId,
        template: { type: AssessmentTemplateType.BEHAVIORAL_360 },
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        template: { select: { name: true } },
        result: { select: { id: true } },
        evaluators: { select: { status: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.assessmentEvaluator.findMany({
      where: {
        userId,
        assessment: { template: { type: AssessmentTemplateType.BEHAVIORAL_360 } },
      },
      include: {
        assessment: {
          include: {
            organization: { select: { name: true, slug: true } },
            subject: { select: { name: true } },
            template: { select: { name: true } },
            result: { select: { id: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  const recent: DashboardAssessmentRow[] = [];

  for (const a of asSubject) {
    const hasResult = Boolean(a.result);
    const allDone = a.evaluators.length > 0 && a.evaluators.every((e) => e.status === "COMPLETED");
    let statusLabel: DashboardAssessmentRow["statusLabel"];
    if (hasResult && allDone) statusLabel = "Completed";
    else if (a.evaluators.some((e) => e.status === "IN_PROGRESS" || e.status === "COMPLETED"))
      statusLabel = "In progress";
    else statusLabel = "Pending";

    recent.push({
      id: a.id,
      title: a.title ?? a.template.name,
      orgName: a.organization.name,
      orgSlug: a.organization.slug,
      role: "subject",
      statusLabel,
      resultUrl: hasResult ? `/org/${a.organization.slug}/assessments/${a.id}/results` : null,
      takeUrl: null,
      updatedAt: a.updatedAt.toISOString(),
    });
  }

  for (const ev of asEvaluator) {
    const a = ev.assessment;
    const hasResult = Boolean(a.result);
    recent.push({
      id: ev.id,
      title: a.title ?? a.template.name,
      orgName: a.organization.name,
      orgSlug: a.organization.slug,
      role: "evaluator",
      statusLabel: evaluatorStatusLabel(ev.status),
      resultUrl: hasResult && a.subjectUserId === userId ? `/org/${a.organization.slug}/assessments/${a.id}/results` : null,
      takeUrl: `/assessments/${ev.id}`,
      updatedAt: ev.updatedAt.toISOString(),
    });
  }

  recent.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const recentAssessments = recent.slice(0, 8);

  const weekKey = getIsoWeekKey();
  const [weeklyActions, streakRow, competencyTrends] = await Promise.all([
    prisma.userAction.findMany({
      where: { userId, weekKey },
      include: {
        action: {
          include: {
            competency: { select: { key: true, name: true } },
          },
        },
      },
      orderBy: { assignedAt: "asc" },
    }),
    prisma.userDevelopmentStreak.findUnique({ where: { userId } }),
    assessmentId
      ? getCompetencyTrendsForUser(userId, assessmentId)
      : Promise.resolve([]),
  ]);

  const weeklyFocus = {
    weekKey,
    items: weeklyActions.map((ua) => ({
      id: ua.id,
      title: ua.action.title,
      description: ua.action.description,
      difficulty: ua.action.difficulty,
      estimatedTime: ua.action.estimatedTime,
      competencyName: ua.action.competency.name,
      competencyKey: ua.action.competency.key,
      status: ua.status,
    })),
    completed: weeklyActions.filter((u) => u.status === "COMPLETED").length,
    total: weeklyActions.filter((u) => u.status !== "DISMISSED").length,
  };

  return {
    user: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    },
    tenants,
    isOrgAdmin,
    profile: scores
      ? {
          title: profileTitle,
          orgName,
          orgSlug,
          assessmentId: assessmentId!,
          scores,
        }
      : null,
    insights,
    eqInsights,
    recentAssessments,
    weeklyFocus,
    streak: streakRow?.consecutiveWeeksCompleted ?? 0,
    competencyTrends,
  };
}
