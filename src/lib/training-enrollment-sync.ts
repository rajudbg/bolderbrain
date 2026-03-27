import { EnrollmentStatus } from "@/generated/prisma/enums";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import prisma from "@/lib/prisma";
import {
  computeTrainingDelta,
  scoresFrom360Payload,
  type TrainingCompetencyScores,
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
  }
}
