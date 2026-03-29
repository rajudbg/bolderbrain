"use server";

import { auth } from "@/auth";
import {
  EnrollmentStatus,
  TrainingAttemptPhase,
  type TrainingContentTemplateKind,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import {
  computeAttemptScore,
  trainingScoreToSnapshot,
  type QuestionForScoring,
} from "@/lib/scoring/training-knowledge-engine";
import {
  markTrainingNeedsInProgressForEnrollment,
  resolveTrainingNeedsAfterPostAssessment,
} from "@/lib/training-enrollment-sync";
import { computeTrainingDelta, type TrainingCompetencyScores, type TrainingDeltaPayload } from "@/lib/training-impact";
import { isKnowledgeKind, timerMinutesForAttempt } from "@/lib/training-content-attempts";

export type AttemptResponseVal = { selectedOptionIds?: string[]; numericValue?: number };

export type TrainingAttemptView = {
  attemptId: string;
  programId: string;
  phase: TrainingAttemptPhase;
  programName: string;
  phaseLabel: string;
  kind: TrainingContentTemplateKind;
  partialCredit: boolean;
  questionOrder: string[];
  optionShuffle: Record<string, string[]> | null;
  questions: Array<{
    id: string;
    text: string;
    type: QuestionForScoring["type"];
    options: { id: string; text: string; value: number }[];
  }>;
  startedAt: string | null;
  endsAt: string | null;
  submittedAt: string | null;
  /** Saved drafts while in progress (resume). */
  draftResponses: Record<string, AttemptResponseVal>;
};

function parseQuestionOrder(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function parseOptionShuffle(raw: unknown): Record<string, string[]> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) out[k] = v as string[];
  }
  return Object.keys(out).length ? out : null;
}

function snapshotToStoredScores(s: ReturnType<typeof trainingScoreToSnapshot>): TrainingCompetencyScores {
  return {
    overall: s.percent ?? s.overall,
    byCompetency: s.byCompetency ?? {},
  };
}

function parseScores(json: unknown): TrainingCompetencyScores | null {
  if (!json || typeof json !== "object") return null;
  const o = json as TrainingCompetencyScores;
  if (typeof o.overall !== "number" || typeof o.byCompetency !== "object" || o.byCompetency === null) return null;
  return o;
}

function parseDraftResponses(raw: unknown): Record<string, AttemptResponseVal> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, AttemptResponseVal> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const o = v as AttemptResponseVal;
    if (Array.isArray(o.selectedOptionIds)) {
      out[k] = { selectedOptionIds: o.selectedOptionIds.filter((x): x is string => typeof x === "string") };
    } else if (typeof o.numericValue === "number") {
      out[k] = { numericValue: o.numericValue };
    }
  }
  return out;
}

export async function saveTrainingAttemptDraft(attemptId: string, responses: Record<string, AttemptResponseVal>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const res = await prisma.trainingAttempt.updateMany({
    where: { id: attemptId, userId: session.user.id, submittedAt: null },
    data: { responses: responses as object },
  });
  if (res.count === 0) throw new Error("Cannot save draft");
}

export async function getTrainingAttemptForUser(attemptId: string): Promise<TrainingAttemptView | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  let attempt = await prisma.trainingAttempt.findFirst({
    where: { id: attemptId, userId: session.user.id },
    include: {
      trainingProgram: {
        include: { trainingContentTemplate: true },
      },
    },
  });
  if (!attempt?.trainingProgram.trainingContentTemplate) return null;

  const contentTpl = attempt.trainingProgram.trainingContentTemplate;

  if (!attempt.submittedAt && !attempt.startedAt) {
    const minutes = timerMinutesForAttempt(attempt.trainingProgram, contentTpl);
    const useTimer = isKnowledgeKind(contentTpl.kind) && minutes != null;
    const now = new Date();
    const endsAt = useTimer ? new Date(now.getTime() + minutes * 60_000) : null;
    attempt = await prisma.trainingAttempt.update({
      where: { id: attempt.id },
      data: { startedAt: now, endsAt },
      include: {
        trainingProgram: {
          include: { trainingContentTemplate: true },
        },
      },
    });
  }

  const tpl = attempt.trainingProgram.trainingContentTemplate;
  if (!tpl) return null;
  const qOrder = parseQuestionOrder(attempt.questionOrder);
  const shuffle = parseOptionShuffle(attempt.optionShuffle);

  const dbQuestions = await prisma.trainingContentQuestion.findMany({
    where: { id: { in: qOrder }, templateId: tpl.id },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  const byId = new Map(dbQuestions.map((q) => [q.id, q]));

  const questions: TrainingAttemptView["questions"] = [];
  for (const qid of qOrder) {
    const q = byId.get(qid);
    if (!q) continue;
    let opts = q.options.map((o) => ({ id: o.id, text: o.text, value: o.value }));
    const order = shuffle?.[q.id];
    if (order?.length) {
      const m = new Map(opts.map((o) => [o.id, o]));
      opts = order.map((id) => m.get(id)).filter(Boolean) as typeof opts;
    }
    questions.push({
      id: q.id,
      text: q.text,
      type: q.type,
      options: opts,
    });
  }

  return {
    attemptId: attempt.id,
    programId: attempt.trainingProgram.id,
    phase: attempt.phase,
    programName: attempt.trainingProgram.name,
    phaseLabel: attempt.phase === TrainingAttemptPhase.PRE ? "Pre-training baseline" : "Post-training measure",
    kind: tpl.kind,
    partialCredit: attempt.trainingProgram.partialCredit,
    questionOrder: qOrder,
    optionShuffle: shuffle,
    questions,
    startedAt: attempt.startedAt?.toISOString() ?? null,
    endsAt: attempt.endsAt?.toISOString() ?? null,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    draftResponses: parseDraftResponses(attempt.responses),
  };
}

export async function submitTrainingAttempt(
  attemptId: string,
  responses: Record<string, AttemptResponseVal | undefined>,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const attempt = await prisma.trainingAttempt.findFirst({
    where: { id: attemptId, userId: session.user.id },
    include: {
      trainingEnrollment: true,
      trainingProgram: { include: { trainingContentTemplate: { include: { questions: { include: { options: true } } } } } },
    },
  });

  if (!attempt) throw new Error("Attempt not found");
  if (attempt.submittedAt) throw new Error("Already submitted");

  const tpl = attempt.trainingProgram.trainingContentTemplate;
  if (!tpl) throw new Error("No template");

  const qOrder = parseQuestionOrder(attempt.questionOrder);
  const qById = new Map(tpl.questions.map((q) => [q.id, q]));

  const forScoring: QuestionForScoring[] = [];
  for (const id of qOrder) {
    const q = qById.get(id);
    if (!q) continue;
    forScoring.push({
      id: q.id,
      type: q.type,
      points: q.points,
      correctOptionIds: q.correctOptionIds,
      competencyKey: q.competencyKey,
      reverseScored: q.reverseScored,
      options: q.options.map((o) => ({ id: o.id, value: o.value })),
    });
  }

  const score = computeAttemptScore(
    tpl.kind,
    attempt.trainingProgram.partialCredit,
    forScoring,
    responses,
  );

  const enrollmentId = attempt.trainingEnrollmentId;
  let deltaPayload: TrainingDeltaPayload | null = null;

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.trainingAttempt.update({
      where: { id: attempt.id },
      data: {
        responses: responses as object,
        scoreJson: score as object,
        submittedAt: now,
      },
    });

    const snap = trainingScoreToSnapshot(score);
    const scores = snapshotToStoredScores(snap);

    if (attempt.phase === TrainingAttemptPhase.PRE) {
      await tx.trainingEnrollment.update({
        where: { id: enrollmentId },
        data: {
          preScores: scores as object,
          status: EnrollmentStatus.PRE_COMPLETED,
        },
      });
    } else {
      const pre = parseScores(attempt.trainingEnrollment.preScores);
      deltaPayload = computeTrainingDelta(pre, scores);
      await tx.trainingEnrollment.update({
        where: { id: enrollmentId },
        data: {
          postScores: scores as object,
          delta: deltaPayload ? (deltaPayload as object) : undefined,
          status: EnrollmentStatus.POST_COMPLETED,
          completedAt: now,
        },
      });
    }
  });

  if (attempt.phase === TrainingAttemptPhase.PRE) {
    await markTrainingNeedsInProgressForEnrollment(enrollmentId);
  } else if (deltaPayload) {
    await resolveTrainingNeedsAfterPostAssessment(enrollmentId, deltaPayload);
  }
}
