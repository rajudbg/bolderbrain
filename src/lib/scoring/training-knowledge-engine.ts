/**
 * Scoring for flexible Training Content templates (knowledge + behavioral).
 */

import { TrainingContentTemplateKind, type TrainingContentQuestionType } from "@/generated/prisma/enums";

export type KnowledgeScoreDetail = {
  questionId: string;
  pointsEarned: number;
  pointsPossible: number;
  correct: boolean;
};

export type BehavioralScoreDetail = {
  questionId: string;
  value: number;
};

export type TrainingAttemptScore =
  | {
      kind: "KNOWLEDGE_TEST";
      totalPoints: number;
      maxPoints: number;
      percent: number;
      byQuestion: KnowledgeScoreDetail[];
    }
  | {
      kind: "BEHAVIORAL_TEST";
      overall: number;
      byCompetency: Record<string, number>;
      byQuestion: BehavioralScoreDetail[];
    };

export function scoreKnowledgeQuestion(params: {
  type: TrainingContentQuestionType;
  correctOptionIds: string[];
  selectedOptionIds: string[];
  points: number;
  partialCredit: boolean;
}): number {
  const { type, correctOptionIds, selectedOptionIds, points, partialCredit } = params;
  const correct = new Set(correctOptionIds);
  const selected = new Set(selectedOptionIds);

  if (type === "SINGLE_CHOICE") {
    const ok = selected.size === 1 && correct.has([...selected][0]!);
    return ok ? points : 0;
  }

  if (type === "MULTIPLE_CHOICE") {
    if (!partialCredit) {
      const isCorrect =
        selected.size === correct.size &&
        [...selected].every((id) => correct.has(id)) &&
        [...correct].every((id) => selected.has(id));
      return isCorrect ? points : 0;
    }
    const correctSelected = [...selected].filter((id) => correct.has(id)).length;
    const incorrectSelected = [...selected].filter((id) => !correct.has(id)).length;
    if (correct.size === 0) return 0;
    const partial = correctSelected / correct.size - incorrectSelected * 0.25;
    return Math.max(0, partial * points);
  }

  return 0;
}

export function scoreBehavioralResponse(params: {
  type: TrainingContentQuestionType;
  selectedValue: number;
  reverseScored: boolean;
}): number {
  let v = params.selectedValue;
  if (params.reverseScored && params.type !== "SEMANTIC_DIFFERENTIAL") {
    v = 6 - v;
  }
  return v;
}

export type QuestionForScoring = {
  id: string;
  type: TrainingContentQuestionType;
  points: number;
  correctOptionIds: string[];
  competencyKey: string | null;
  reverseScored: boolean;
  options: { id: string; value: number }[];
};

/** Full attempt: knowledge → % ; behavioral → 1–5 overall + by competency. */
export function computeAttemptScore(
  kind: TrainingContentTemplateKind,
  partialCredit: boolean,
  questions: QuestionForScoring[],
  responses: Record<string, { selectedOptionIds?: string[]; numericValue?: number } | undefined>,
): TrainingAttemptScore {
  if (kind === TrainingContentTemplateKind.KNOWLEDGE_TEST) {
    const byQuestion: KnowledgeScoreDetail[] = [];
    let total = 0;
    let max = 0;
    for (const q of questions) {
      max += q.points;
      const sel = responses[q.id]?.selectedOptionIds ?? [];
      const pts = scoreKnowledgeQuestion({
        type: q.type,
        correctOptionIds: q.correctOptionIds,
        selectedOptionIds: sel,
        points: q.points,
        partialCredit,
      });
      total += pts;
      byQuestion.push({
        questionId: q.id,
        pointsEarned: pts,
        pointsPossible: q.points,
        correct: pts >= q.points,
      });
    }
    const percent = max > 0 ? Math.round((total / max) * 1000) / 10 : 0;
    return { kind: "KNOWLEDGE_TEST", totalPoints: total, maxPoints: max, percent, byQuestion };
  }

  const byQuestion: BehavioralScoreDetail[] = [];
  const byCompetency: Record<string, number[]> = {};
  for (const q of questions) {
    const sel = responses[q.id]?.selectedOptionIds;
    const optId = sel?.[0];
    const opt = q.options.find((o) => o.id === optId);
    let val = opt?.value ?? responses[q.id]?.numericValue ?? 0;
    if (q.type === "LIKERT_5_SCALE" || q.type === "LIKERT_FREQUENCY") {
      val = scoreBehavioralResponse({
        type: q.type,
        selectedValue: val,
        reverseScored: q.reverseScored,
      });
    }
    byQuestion.push({ questionId: q.id, value: val });
    const key = q.competencyKey ?? "_overall";
    if (!byCompetency[key]) byCompetency[key] = [];
    byCompetency[key]!.push(val);
  }
  const compAvg: Record<string, number> = {};
  for (const [k, arr] of Object.entries(byCompetency)) {
    compAvg[k] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
  const overall =
    byQuestion.length > 0 ? byQuestion.reduce((s, r) => s + r.value, 0) / byQuestion.length : 0;
  return { kind: "BEHAVIORAL_TEST", overall, byCompetency: compAvg, byQuestion };
}

export function trainingScoreToSnapshot(score: TrainingAttemptScore): {
  overall: number;
  percent?: number;
  byCompetency?: Record<string, number>;
} {
  if (score.kind === "KNOWLEDGE_TEST") {
    return { overall: score.percent, percent: score.percent };
  }
  return { overall: score.overall, byCompetency: score.byCompetency };
}
