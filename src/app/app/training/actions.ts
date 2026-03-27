"use server";

import { auth } from "@/auth";
import { EvaluatorRole, EvaluatorStatus, TrainingAttemptPhase } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import type { TrainingDeltaPayload } from "@/lib/training-impact";

export type MyTrainingRow = {
  enrollmentId: string;
  programId: string;
  programName: string;
  trainingDate: string;
  preOpensAt: string;
  preClosesAt: string;
  postOpensAt: string;
  postClosesAt: string;
  status: string;
  assessmentKind: "behavioral_360" | "content";
  preEvaluatorId: string | null;
  postEvaluatorId: string | null;
  preAttemptId: string | null;
  postAttemptId: string | null;
  preComplete: boolean;
  postComplete: boolean;
  enrollmentStatus: string;
};

export async function listMyTrainingEnrollments(): Promise<MyTrainingRow[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const orgIds = session.user.tenants.map((t) => t.organizationId);

  const rows = await prisma.trainingEnrollment.findMany({
    where: {
      userId: session.user.id,
      trainingProgram: { organizationId: { in: orgIds } },
    },
    include: {
      attempts: { select: { id: true, phase: true, submittedAt: true } },
      trainingProgram: {
        select: {
          id: true,
          name: true,
          trainingDate: true,
          preOpensAt: true,
          preClosesAt: true,
          postOpensAt: true,
          postClosesAt: true,
          status: true,
          trainingContentTemplateId: true,
        },
      },
    },
    orderBy: { trainingProgram: { trainingDate: "desc" } },
  });

  const out: MyTrainingRow[] = [];
  for (const e of rows) {
    let preEvaluatorId: string | null = null;
    let postEvaluatorId: string | null = null;
    let preAttemptId: string | null = null;
    let postAttemptId: string | null = null;
    let preComplete = false;
    let postComplete = false;
    const isContent = !!e.trainingProgram.trainingContentTemplateId;

    if (isContent) {
      const preA = e.attempts.find((a) => a.phase === TrainingAttemptPhase.PRE);
      const postA = e.attempts.find((a) => a.phase === TrainingAttemptPhase.POST);
      preAttemptId = preA?.id ?? null;
      postAttemptId = postA?.id ?? null;
      preComplete = !!preA?.submittedAt;
      postComplete = !!postA?.submittedAt;
    } else {
      if (e.preAssignmentId) {
        const ev = await prisma.assessmentEvaluator.findFirst({
          where: {
            assessmentId: e.preAssignmentId,
            userId: session.user.id,
            role: EvaluatorRole.SELF,
          },
        });
        preEvaluatorId = ev?.id ?? null;
        preComplete = ev?.status === EvaluatorStatus.COMPLETED;
      }
      if (e.postAssignmentId) {
        const ev = await prisma.assessmentEvaluator.findFirst({
          where: {
            assessmentId: e.postAssignmentId,
            userId: session.user.id,
            role: EvaluatorRole.SELF,
          },
        });
        postEvaluatorId = ev?.id ?? null;
        postComplete = ev?.status === EvaluatorStatus.COMPLETED;
      }
    }

    const p = e.trainingProgram;
    out.push({
      enrollmentId: e.id,
      programId: p.id,
      programName: p.name,
      trainingDate: p.trainingDate.toISOString(),
      preOpensAt: p.preOpensAt.toISOString(),
      preClosesAt: p.preClosesAt.toISOString(),
      postOpensAt: p.postOpensAt.toISOString(),
      postClosesAt: p.postClosesAt.toISOString(),
      status: p.status,
      assessmentKind: isContent ? "content" : "behavioral_360",
      preEvaluatorId,
      postEvaluatorId,
      preAttemptId,
      postAttemptId,
      preComplete,
      postComplete,
      enrollmentStatus: e.status,
    });
  }
  return out;
}

export async function getMyTrainingResults(enrollmentId: string): Promise<{
  programName: string;
  delta: TrainingDeltaPayload | null;
  enrollmentStatus: string;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const orgIds = session.user.tenants.map((t) => t.organizationId);

  const e = await prisma.trainingEnrollment.findFirst({
    where: {
      id: enrollmentId,
      userId: session.user.id,
      trainingProgram: { organizationId: { in: orgIds } },
    },
    include: { trainingProgram: { select: { name: true } } },
  });
  if (!e) return null;

  const delta = e.delta as TrainingDeltaPayload | null;
  return {
    programName: e.trainingProgram.name,
    delta,
    enrollmentStatus: e.status,
  };
}
