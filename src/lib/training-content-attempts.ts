import { TrainingAttemptPhase, TrainingContentTemplateKind } from "@/generated/prisma/enums";
import { pickQuestionPool, shuffleWithSeed, shuffleOptionIds } from "@/lib/training-content-runtime";

export type QuestionRow = {
  id: string;
  sortOrder: number;
  options: { id: string }[];
};

type ProgramRuntimeConfig = {
  id: string;
  questionPoolCount: number | null;
  randomizePerParticipant: boolean;
  shufflePostQuestions: boolean;
  shufflePostOptions: boolean;
};

type TemplateRuntimeConfig = {
  defaultQuestionCount: number;
  maxQuestions: number;
};

/**
 * Builds ordered question ids and optional per-question option order for PRE/POST attempts.
 * PRE: no post-shuffle; POST: optional question + option shuffle per program settings.
 */
export function buildRuntimeForAttempt(
  program: ProgramRuntimeConfig,
  template: TemplateRuntimeConfig,
  questions: QuestionRow[],
  enrollmentId: string,
  phase: TrainingAttemptPhase,
): { questionOrder: string[]; optionShuffle: Record<string, string[]> | null } {
  const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
  const poolCount = Math.min(
    program.questionPoolCount ?? template.defaultQuestionCount,
    template.maxQuestions,
    sorted.length,
  );
  const seedBase = program.randomizePerParticipant ? `${enrollmentId}-${phase}` : `${program.id}-${phase}`;
  const picked = pickQuestionPool(sorted, poolCount, seedBase);
  let questionIds = picked.map((q) => q.id);

  if (phase === TrainingAttemptPhase.POST && program.shufflePostQuestions) {
    questionIds = shuffleWithSeed(questionIds, `${enrollmentId}-post-q`);
  }

  const optionShuffle: Record<string, string[]> = {};
  if (phase === TrainingAttemptPhase.POST && program.shufflePostOptions) {
    for (const q of picked) {
      const ids = q.options.map((o) => o.id);
      optionShuffle[q.id] = shuffleOptionIds(ids, `${enrollmentId}-${q.id}-opt`);
    }
  }

  return {
    questionOrder: questionIds,
    optionShuffle: Object.keys(optionShuffle).length ? optionShuffle : null,
  };
}

export function timerMinutesForAttempt(
  program: { timerOverrideMinutes: number | null },
  template: { hasTimer: boolean; timeLimitMinutes: number | null },
): number | null {
  if (program.timerOverrideMinutes != null) return program.timerOverrideMinutes;
  if (template.hasTimer && template.timeLimitMinutes != null) return template.timeLimitMinutes;
  return null;
}

export function isKnowledgeKind(kind: TrainingContentTemplateKind): boolean {
  return kind === TrainingContentTemplateKind.KNOWLEDGE_TEST;
}
