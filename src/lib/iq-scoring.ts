import type { AssessmentQuestionType } from "@/generated/prisma/enums";

/** Mock population parameters on weighted proportion correct (0–1). Tunable for demo norms. */
const MOCK_P_MEAN = 0.66;
const MOCK_P_SD = 0.13;

export type IqCategoryKey = "verbal" | "numerical" | "logical" | "spatial" | "general";

export function questionTypeToCategory(qt: AssessmentQuestionType): IqCategoryKey {
  switch (qt) {
    case "NUMERICAL_SEQUENCE":
      return "numerical";
    case "VERBAL_ANALOGY":
      return "verbal";
    case "LOGICAL_PATTERN":
      return "logical";
    case "SPATIAL_REASONING":
      return "spatial";
    case "SINGLE_CHOICE_IQ":
    case "MULTI_CHOICE_IQ":
    default:
      return "general";
  }
}

/** Standard normal CDF (approximation). */
export function cumulativeStdNormal(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * x);
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const cdf = 1 - p;
  return sign < 0 ? 1 - cdf : cdf;
}

function proportionZ(p: number): number {
  const clamped = Math.min(1, Math.max(0, p));
  const z = (clamped - MOCK_P_MEAN) / MOCK_P_SD;
  return Math.min(3, Math.max(-3, z));
}

/** Convert weighted proportion to standard score (μ=100, σ=15). */
export function standardScoreFromProportion(p: number): number {
  const iq = 100 + 15 * proportionZ(p);
  return Math.round(Math.min(145, Math.max(55, iq)));
}

export function percentileFromStandardScore(standardScore: number): number {
  const z = (standardScore - 100) / 15;
  return Math.round(cumulativeStdNormal(z) * 1000) / 10;
}

export function iqCategoryLabel(standardScore: number): string {
  if (standardScore >= 130) return "Very Superior";
  if (standardScore >= 120) return "Superior";
  if (standardScore >= 110) return "High Average";
  if (standardScore >= 90) return "Average";
  if (standardScore >= 80) return "Low Average";
  if (standardScore >= 70) return "Borderline";
  return "Extremely Low";
}

export function workplaceInterpretation(standardScore: number, categoryLabel: string): string {
  if (standardScore >= 120) {
    return `${categoryLabel} results typically align with strong abstract reasoning and rapid learning in complex roles. You likely process novel problems quickly; consider stretch assignments that require pattern recognition and structured analysis.`;
  }
  if (standardScore >= 110) {
    return `${categoryLabel} performance suggests solid analytical ability for most professional tasks. You should handle structured problem-solving and verbal reasoning demands in typical workplace settings with consistency.`;
  }
  if (standardScore >= 90) {
    return `${categoryLabel} is within the average range for working adults—adequate for a broad range of roles. Pair this snapshot with job samples and collaboration data for hiring or development decisions.`;
  }
  if (standardScore >= 80) {
    return `Scores in this band may benefit from clear instructions, checklists, and time to practice unfamiliar task formats. Consider strengths in experience and domain knowledge alongside this cognitive snapshot.`;
  }
  return `Very low scores on short cognitive screens can reflect anxiety, time pressure, or lack of familiarity with item formats. Retakes after a cooldown may show a different pattern; avoid over-interpreting a single session.`;
}

export type IqQuestionForScoring = {
  id: string;
  questionType: AssessmentQuestionType;
  correctOptionId: string | null;
  weight: number;
};

/**
 * Sum of (weight) for correct answers; max weighted is sum of all weights in the attempt.
 */
export function computeIqScores(
  questions: IqQuestionForScoring[],
  selectedByQuestionId: Record<string, string | undefined>,
): {
  rawCorrectCount: number;
  weightedScore: number;
  maxWeighted: number;
  standardScore: number;
  percentile: number;
  ciLow: number;
  ciHigh: number;
  categoryLabel: string;
  breakdownByCategory: Record<
    IqCategoryKey,
    { percentile: number; correct: number; total: number; weightedEarned: number; weightedMax: number }
  >;
  interpretation: string;
} {
  const cats: IqCategoryKey[] = ["verbal", "numerical", "logical", "spatial", "general"];
  const breakdown: Record<
    IqCategoryKey,
    { correct: number; total: number; weightedEarned: number; weightedMax: number }
  > = {
    verbal: { correct: 0, total: 0, weightedEarned: 0, weightedMax: 0 },
    numerical: { correct: 0, total: 0, weightedEarned: 0, weightedMax: 0 },
    logical: { correct: 0, total: 0, weightedEarned: 0, weightedMax: 0 },
    spatial: { correct: 0, total: 0, weightedEarned: 0, weightedMax: 0 },
    general: { correct: 0, total: 0, weightedEarned: 0, weightedMax: 0 },
  };

  let rawCorrectCount = 0;
  let weightedScore = 0;
  let maxWeighted = 0;

  for (const q of questions) {
    if (!q.correctOptionId) continue;
    maxWeighted += q.weight;
    const cat = questionTypeToCategory(q.questionType);
    breakdown[cat].total += 1;
    breakdown[cat].weightedMax += q.weight;

    const selected = selectedByQuestionId[q.id];
    const ok = Boolean(selected && selected === q.correctOptionId);
    if (ok) {
      rawCorrectCount += 1;
      weightedScore += q.weight;
      breakdown[cat].correct += 1;
      breakdown[cat].weightedEarned += q.weight;
    }
  }

  const p = maxWeighted > 0 ? weightedScore / maxWeighted : 0;
  const standardScore = standardScoreFromProportion(p);
  const percentile = percentileFromStandardScore(standardScore);
  const categoryLabel = iqCategoryLabel(standardScore);
  const interpretation = workplaceInterpretation(standardScore, categoryLabel);
  const ciLow = Math.max(55, standardScore - 5);
  const ciHigh = Math.min(145, standardScore + 5);

  const breakdownByCategory = {} as Record<
    IqCategoryKey,
    { percentile: number; correct: number; total: number; weightedEarned: number; weightedMax: number }
  >;

  for (const k of cats) {
    const b = breakdown[k];
    const subP = b.weightedMax > 0 ? b.weightedEarned / b.weightedMax : 0;
    const subSs = standardScoreFromProportion(subP);
    const subPct = b.total > 0 ? percentileFromStandardScore(subSs) : 0;
    breakdownByCategory[k] = {
      percentile: subPct,
      correct: b.correct,
      total: b.total,
      weightedEarned: b.weightedEarned,
      weightedMax: b.weightedMax,
    };
  }

  return {
    rawCorrectCount,
    weightedScore,
    maxWeighted,
    standardScore,
    percentile,
    ciLow,
    ciHigh,
    categoryLabel,
    breakdownByCategory,
    interpretation,
  };
}
