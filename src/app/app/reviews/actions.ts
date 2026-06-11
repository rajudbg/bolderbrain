'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ReviewStatus } from '@/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');
  return session.user.id;
}

export async function submitSelfReview(input: {
  cycleId: string;
  selfRating: number;
  selfSummary: string;
  selfGoals: { goal: string; achievement: string; rating: number }[];
}) {
  const userId = await getCurrentUserId();
  const review = await prisma.performanceReview.findUnique({
    where: { cycleId_employeeId: { cycleId: input.cycleId, employeeId: userId } },
  });
  if (!review) throw new Error('Review not found');
  if (review.status !== ReviewStatus.NOT_STARTED)
    throw new Error('Self-review already submitted');

  await prisma.performanceReview.update({
    where: { id: review.id },
    data: {
      selfRating: input.selfRating,
      selfSummary: input.selfSummary,
      selfGoals: input.selfGoals,
      selfSubmittedAt: new Date(),
      status: ReviewStatus.SELF_REVIEW,
    },
  });
  revalidatePath('/app/reviews');
  revalidatePath(`/app/reviews/${input.cycleId}`);
}

export async function submitManagerReview(input: {
  reviewId: string;
  managerRating: number;
  managerSummary: string;
}) {
  const userId = await getCurrentUserId();
  const review = await prisma.performanceReview.findFirst({
    where: { id: input.reviewId, managerId: userId },
  });
  if (!review) throw new Error('Review not found or not your direct report');

  await prisma.performanceReview.update({
    where: { id: review.id },
    data: {
      managerRating: input.managerRating,
      managerSummary: input.managerSummary,
      managerSubmittedAt: new Date(),
      status: ReviewStatus.MANAGER_REVIEW,
    },
  });
  revalidatePath('/app/reviews');
}
