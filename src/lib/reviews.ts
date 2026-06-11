import prisma from '@/lib/prisma';
import { ReviewCycleStatus, ReviewStatus } from '@/generated/prisma/enums';

export async function getReviewCycles(orgId: string) {
  const cycles = await prisma.reviewCycle.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { reviews: true } },
      reviews: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return cycles.map(c => {
    const total = c.reviews.length;
    const completed = c.reviews.filter(r =>
      r.status === ReviewStatus.SHARED || r.status === ReviewStatus.CLOSED
    ).length;
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      reviewPeriodStart: c.reviewPeriodStart,
      reviewPeriodEnd: c.reviewPeriodEnd,
      selfOpenAt: c.selfOpenAt,
      selfCloseAt: c.selfCloseAt,
      managerOpenAt: c.managerOpenAt,
      managerCloseAt: c.managerCloseAt,
      maxRating: c.maxRating,
      goals: c.goals as { title: string; description: string }[] | null,
      totalReviews: total,
      completedReviews: completed,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

export async function getReviewCycleDetail(orgId: string, cycleId: string) {
  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: cycleId, organizationId: orgId },
    include: {
      reviews: {
        include: {
          employee: { select: { name: true, email: true } },
          manager: { select: { name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });
  if (!cycle) return null;
  return cycle;
}

export async function getMyReviews(userId: string) {
  const reviews = await prisma.performanceReview.findMany({
    where: { employeeId: userId },
    include: {
      cycle: {
        select: {
          id: true, name: true, status: true,
          selfOpenAt: true, selfCloseAt: true,
          managerOpenAt: true, managerCloseAt: true,
          maxRating: true, goals: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return reviews;
}

export async function getReviewForSelf(userId: string, cycleId: string) {
  const review = await prisma.performanceReview.findUnique({
    where: { cycleId_employeeId: { cycleId, employeeId: userId } },
    include: {
      cycle: true,
    },
  });
  return review;
}

export async function getReviewForManager(managerId: string, reviewId: string) {
  return prisma.performanceReview.findFirst({
    where: { id: reviewId, managerId },
    include: { cycle: true, employee: { select: { name: true, email: true } } },
  });
}

export type ReviewCycleSummary = Awaited<ReturnType<typeof getReviewCycles>>[number];
export type ReviewCycleDetail = NonNullable<Awaited<ReturnType<typeof getReviewCycleDetail>>>;
