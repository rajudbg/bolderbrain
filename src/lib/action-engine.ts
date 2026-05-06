import { Prisma } from "@/generated/prisma/client";
import { UserActionStatus, NotificationType } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import { getIsoWeekKey, previousWeekKey } from "@/lib/iso-week";
import { createNotification } from "@/lib/notifications";

export async function recordCompetencySnapshots(input: {
  assessmentId: string;
  subjectUserId: string;
  organizationId: string;
  scores: Assessment360StoredResult;
}) {
  await prisma.competencyScoreSnapshot.createMany({
    data: input.scores.byCompetency.map((c) => ({
      userId: input.subjectUserId,
      organizationId: input.organizationId,
      assessmentId: input.assessmentId,
      competencyKey: c.competencyKey,
      self: c.self ?? null,
      peerAvg: c.peerAvg ?? null,
      manager: c.manager ?? null,
      othersAverage: c.othersAverage,
    })),
  });
}

/**
 * After a 360 completes: assign up to 2 actions this week for the 2 lowest competency scores,
 * skipping competencies the user is already actively working on.
 */
export async function autoAssignActionsAfter360(input: {
  assessmentId: string;
  subjectUserId: string;
  organizationId: string;
  scores: Assessment360StoredResult;
}) {
  const existing = await prisma.userAction.findFirst({
    where: { sourceAssessmentId: input.assessmentId },
    select: { id: true },
  });
  if (existing) return;

  const weekKey = getIsoWeekKey();

  const countThisWeek = await prisma.userAction.count({
    where: {
      userId: input.subjectUserId,
      weekKey,
      status: { in: [UserActionStatus.ASSIGNED, UserActionStatus.IN_PROGRESS] },
    },
  });
  let slots = Math.max(0, 2 - countThisWeek);
  if (slots <= 0) return;

  const activeForUser = await prisma.userAction.findMany({
    where: {
      userId: input.subjectUserId,
      status: { in: [UserActionStatus.ASSIGNED, UserActionStatus.IN_PROGRESS] },
    },
    select: { action: { select: { competencyId: true } } },
  });
  const busyCompetencyIds = new Set(activeForUser.map((x) => x.action.competencyId));

  const sorted = [...input.scores.byCompetency].sort((a, b) => a.othersAverage - b.othersAverage);

  const keys = [...new Set(sorted.map((s) => s.competencyKey))];
  const competencies = await prisma.competency.findMany({
    where: {
      organizationId: input.organizationId,
      isActive: true,
      key: { in: keys },
    },
  });
  const compByKey = new Map(competencies.map((c) => [c.key, c]));

  for (const row of sorted) {
    if (slots <= 0) break;
    const comp = compByKey.get(row.competencyKey);
    if (!comp) continue;
    if (busyCompetencyIds.has(comp.id)) continue;

    const action = await prisma.action.findFirst({
      where: { competencyId: comp.id, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (!action) continue;

    try {
      await prisma.userAction.create({
        data: {
          userId: input.subjectUserId,
          actionId: action.id,
          organizationId: input.organizationId,
          weekKey,
          status: UserActionStatus.ASSIGNED,
          source: "AUTO",
          sourceAssessmentId: input.assessmentId,
        },
      });
      busyCompetencyIds.add(comp.id);
      slots -= 1;
      // Fire-and-forget notification
      void createNotification({
        userId: input.subjectUserId,
        type: NotificationType.ACTION_ASSIGNED,
        title: "New action assigned",
        body: `A new development action for ${comp.name} has been added to this week's focus.`,
        href: "/app/actions",
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        continue;
      }
      throw e;
    }
  }
}

/**
 * After an EQ assessment completes: assign one action for the lowest EQ domain (competency key must match domain name).
 */
export async function autoAssignActionsAfterEq(input: {
  attemptId: string;
  userId: string;
  organizationId: string;
  lowestDomain: string;
}) {
  const existing = await prisma.userAction.findFirst({
    where: { sourceEqAttemptId: input.attemptId },
    select: { id: true },
  });
  if (existing) return;

  const weekKey = getIsoWeekKey();

  const countThisWeek = await prisma.userAction.count({
    where: {
      userId: input.userId,
      weekKey,
      status: { in: [UserActionStatus.ASSIGNED, UserActionStatus.IN_PROGRESS] },
    },
  });
  const slots = Math.max(0, 2 - countThisWeek);
  if (slots <= 0) return;

  const competency = await prisma.competency.findFirst({
    where: {
      organizationId: input.organizationId,
      isActive: true,
      key: input.lowestDomain,
    },
  });
  if (!competency) return;

  const action = await prisma.action.findFirst({
    where: { competencyId: competency.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (!action) return;

  try {
    await prisma.userAction.create({
      data: {
        userId: input.userId,
        actionId: action.id,
        organizationId: input.organizationId,
        weekKey,
        status: UserActionStatus.ASSIGNED,
        source: "AUTO",
        sourceEqAttemptId: input.attemptId,
      },
    });
    void createNotification({
      userId: input.userId,
      type: NotificationType.ACTION_ASSIGNED,
      title: "New action assigned",
      body: `An EQ-based development action has been added to this week's focus.`,
      href: "/app/actions",
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return;
    }
    throw e;
  }
}

/**
 * After a psychometric (Big Five) assessment completes: assign one action for the lowest trait
 * when a competency exists whose `key` matches the trait name (e.g. Openness, Conscientiousness).
 */
export async function autoAssignActionsAfterPsych(input: {
  attemptId: string;
  userId: string;
  organizationId: string;
  lowestTrait: string;
}) {
  const existing = await prisma.userAction.findFirst({
    where: { sourcePsychAttemptId: input.attemptId },
    select: { id: true },
  });
  if (existing) return;

  const weekKey = getIsoWeekKey();

  const countThisWeek = await prisma.userAction.count({
    where: {
      userId: input.userId,
      weekKey,
      status: { in: [UserActionStatus.ASSIGNED, UserActionStatus.IN_PROGRESS] },
    },
  });
  const slots = Math.max(0, 2 - countThisWeek);
  if (slots <= 0) return;

  const competency = await prisma.competency.findFirst({
    where: {
      organizationId: input.organizationId,
      isActive: true,
      key: input.lowestTrait,
    },
  });
  if (!competency) return;

  const action = await prisma.action.findFirst({
    where: { competencyId: competency.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (!action) return;

  try {
    await prisma.userAction.create({
      data: {
        userId: input.userId,
        actionId: action.id,
        organizationId: input.organizationId,
        weekKey,
        status: UserActionStatus.ASSIGNED,
        source: "AUTO",
        sourcePsychAttemptId: input.attemptId,
      },
    });
    void createNotification({
      userId: input.userId,
      type: NotificationType.ACTION_ASSIGNED,
      title: "New action assigned",
      body: `A personality-based development action has been added to this week's focus.`,
      href: "/app/actions",
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return;
    }
    throw e;
  }
}

export async function maybeUpdateStreakAfterUserActionChange(userId: string, weekKey: string) {
  const rows = await prisma.userAction.findMany({
    where: { userId, weekKey },
  });
  if (rows.length === 0) return;

  const allDone = rows.every(
    (r) => r.status === UserActionStatus.COMPLETED || r.status === UserActionStatus.DISMISSED,
  );
  if (!allDone) return;

  const streak = await prisma.userDevelopmentStreak.findUnique({ where: { userId } });
  if (streak?.lastCountedWeekKey === weekKey) return;

  const prevWeek = previousWeekKey(weekKey);
  const nextCount =
    streak?.lastCountedWeekKey === prevWeek ? streak.consecutiveWeeksCompleted + 1 : 1;

  await prisma.userDevelopmentStreak.upsert({
    where: { userId },
    create: {
      userId,
      consecutiveWeeksCompleted: nextCount,
      lastCountedWeekKey: weekKey,
    },
    update: {
      consecutiveWeeksCompleted: nextCount,
      lastCountedWeekKey: weekKey,
    },
  });
}

export type CompetencyTrend = {
  competencyKey: string;
  othersAverage: number;
  deltaFromPrevious: number | null;
};

export async function getCompetencyTrendsForUser(
  userId: string,
  currentAssessmentId: string,
): Promise<CompetencyTrend[]> {
  const current = await prisma.competencyScoreSnapshot.findMany({
    where: { assessmentId: currentAssessmentId },
  });
  if (current.length === 0) return [];

  const previousSnaps = await prisma.competencyScoreSnapshot.findMany({
    where: {
      userId,
      assessmentId: { not: currentAssessmentId },
    },
    orderBy: { recordedAt: "desc" },
    take: 200,
  });

  const latestPrevByKey = new Map<string, number>();
  for (const p of previousSnaps) {
    if (!latestPrevByKey.has(p.competencyKey)) {
      latestPrevByKey.set(p.competencyKey, p.othersAverage);
    }
  }

  return current.map((c) => ({
    competencyKey: c.competencyKey,
    othersAverage: c.othersAverage,
    deltaFromPrevious: latestPrevByKey.has(c.competencyKey)
      ? c.othersAverage - latestPrevByKey.get(c.competencyKey)!
      : null,
  }));
}
