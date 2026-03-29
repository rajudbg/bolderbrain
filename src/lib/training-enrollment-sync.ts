import { EnrollmentStatus, TrainingNeedStatus } from "@/generated/prisma/enums";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import prisma from "@/lib/prisma";
import {
  computeTrainingDelta,
  scoresFrom360Payload,
  type TrainingCompetencyScores,
  type TrainingDeltaPayload,
} from "@/lib/training-impact";

function parseScores(json: unknown): TrainingCompetencyScores | null {
  if (!json || typeof json !== "object") return null;
  const o = json as TrainingCompetencyScores;
  if (typeof o.overall !== "number" || typeof o.byCompetency !== "object" || o.byCompetency === null) return null;
  return o;
}

/**
 * After a 360 result is finalized, update linked training enrollment pre/post snapshots and deltas.
 */
export async function onAssessment360FinalizedForTraining(assessmentId: string): Promise<void> {
  const enrollment = await prisma.trainingEnrollment.findFirst({
    where: {
      OR: [{ preAssignmentId: assessmentId }, { postAssignmentId: assessmentId }],
    },
  });
  if (!enrollment) return;

  const resultRow = await prisma.assessmentResult.findUnique({
    where: { assessmentId },
  });
  if (!resultRow) return;

  const payload = resultRow.competencyScores as unknown as Assessment360StoredResult;
  const scores = scoresFrom360Payload(payload);

  if (enrollment.preAssignmentId === assessmentId) {
    await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: {
        preScores: scores as object,
        status: EnrollmentStatus.PRE_COMPLETED,
      },
    });
    await markTrainingNeedsInProgressForEnrollment(enrollment.id);
    return;
  }

  if (enrollment.postAssignmentId === assessmentId) {
    const pre = parseScores(enrollment.preScores);
    const deltaPayload = computeTrainingDelta(pre, scores);
    await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: {
        postScores: scores as object,
        delta: deltaPayload ? (deltaPayload as object) : undefined,
        status: EnrollmentStatus.POST_COMPLETED,
        completedAt: new Date(),
      },
    });
    if (deltaPayload) {
      await resolveTrainingNeedsAfterPostAssessment(enrollment.id, deltaPayload);
    }
  }
}

/**
 * When a learner completes pre-training (path started), move linked needs from ASSIGNED → IN_PROGRESS.
 */
export async function markTrainingNeedsInProgressForEnrollment(enrollmentId: string): Promise<void> {
  const enrollment = await prisma.trainingEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { trainingProgram: { select: { organizationId: true, id: true } } },
  });
  if (!enrollment) return;

  await prisma.trainingNeed.updateMany({
    where: {
      organizationId: enrollment.trainingProgram.organizationId,
      userId: enrollment.userId,
      assignedProgramId: enrollment.trainingProgram.id,
      status: TrainingNeedStatus.ASSIGNED,
    },
    data: { status: TrainingNeedStatus.IN_PROGRESS },
  });
}

/**
 * Close the loop: linked training needs move to RESOLVED when post-assessment shows overall improvement.
 */
export async function resolveTrainingNeedsAfterPostAssessment(
  enrollmentId: string,
  deltaPayload: TrainingDeltaPayload,
): Promise<void> {
  const enrollment = await prisma.trainingEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { trainingProgram: { select: { id: true, organizationId: true } } },
  });
  if (!enrollment) return;

  const overallDelta = deltaPayload.overall.delta;
  if (typeof overallDelta !== "number") return;

  const orgId = enrollment.trainingProgram.organizationId;
  const programId = enrollment.trainingProgram.id;

  if (overallDelta > 0.5) {
    await prisma.trainingNeed.updateMany({
      where: {
        organizationId: orgId,
        userId: enrollment.userId,
        assignedProgramId: programId,
        status: { in: [TrainingNeedStatus.ASSIGNED, TrainingNeedStatus.IN_PROGRESS] },
      },
      data: {
        status: TrainingNeedStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
    return;
  }

  await prisma.trainingNeed.updateMany({
    where: {
      organizationId: orgId,
      userId: enrollment.userId,
      assignedProgramId: programId,
      status: { in: [TrainingNeedStatus.ASSIGNED, TrainingNeedStatus.IN_PROGRESS] },
    },
    data: {
      notes: `Post-training: overall delta ${overallDelta.toFixed(2)} (≤0.5) — review for follow-up or advanced training.`,
    },
  });
}
