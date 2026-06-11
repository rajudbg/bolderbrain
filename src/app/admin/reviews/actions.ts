'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdminOrganizationId } from '@/lib/admin/context';
import { ReviewCycleStatus, ReviewStatus } from '@/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const createCycleSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  reviewPeriodStart: z.string().transform(s => new Date(s)),
  reviewPeriodEnd: z.string().transform(s => new Date(s)),
  selfOpenAt: z.string().transform(s => new Date(s)),
  selfCloseAt: z.string().transform(s => new Date(s)),
  managerOpenAt: z.string().transform(s => new Date(s)),
  managerCloseAt: z.string().transform(s => new Date(s)),
  maxRating: z.coerce.number().min(3).max(10).default(5),
  goals: z.array(z.object({ title: z.string(), description: z.string().optional() })).default([]),
});

export async function createReviewCycle(input: z.infer<typeof createCycleSchema>) {
  const orgId = await requireAdminOrganizationId();
  const data = createCycleSchema.parse(input);
  const cycle = await prisma.reviewCycle.create({
    data: {
      organizationId: orgId,
      name: data.name,
      description: data.description,
      reviewPeriodStart: data.reviewPeriodStart,
      reviewPeriodEnd: data.reviewPeriodEnd,
      selfOpenAt: data.selfOpenAt,
      selfCloseAt: data.selfCloseAt,
      managerOpenAt: data.managerOpenAt,
      managerCloseAt: data.managerCloseAt,
      maxRating: data.maxRating,
      goals: data.goals,
      status: ReviewCycleStatus.DRAFT,
    },
  });
  revalidatePath('/admin/reviews');
  return cycle.id;
}

export async function activateReviewCycle(cycleId: string) {
  const orgId = await requireAdminOrganizationId();
  // Create PerformanceReview records for all active org members
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true } } },
  });
  await prisma.reviewCycle.update({
    where: { id: cycleId, organizationId: orgId },
    data: { status: ReviewCycleStatus.ACTIVE },
  });
  for (const m of members) {
    await prisma.performanceReview.upsert({
      where: { cycleId_employeeId: { cycleId, employeeId: m.userId } },
      create: {
        cycleId,
        organizationId: orgId,
        employeeId: m.userId,
        managerId: m.managerId,
        status: ReviewStatus.NOT_STARTED,
      },
      update: {},
    });
  }
  revalidatePath('/admin/reviews');
  revalidatePath(`/admin/reviews/${cycleId}`);
}

export async function updateCycleStatus(cycleId: string, status: ReviewCycleStatus) {
  const orgId = await requireAdminOrganizationId();
  await prisma.reviewCycle.update({
    where: { id: cycleId, organizationId: orgId },
    data: { status },
  });
  revalidatePath('/admin/reviews');
  revalidatePath(`/admin/reviews/${cycleId}`);
}

export async function saveCalibration(reviewId: string, finalRating: number, calibrationNotes: string) {
  const orgId = await requireAdminOrganizationId();
  await prisma.performanceReview.updateMany({
    where: { id: reviewId, organizationId: orgId },
    data: { finalRating, calibrationNotes, status: ReviewStatus.CALIBRATION },
  });
  revalidatePath('/admin/reviews');
}

export async function shareReviewResults(cycleId: string) {
  const orgId = await requireAdminOrganizationId();
  const now = new Date();
  await prisma.performanceReview.updateMany({
    where: { organizationId: orgId, cycleId, status: ReviewStatus.CALIBRATION },
    data: { status: ReviewStatus.SHARED, sharedAt: now },
  });
  revalidatePath('/admin/reviews');
  revalidatePath(`/admin/reviews/${cycleId}`);
}
