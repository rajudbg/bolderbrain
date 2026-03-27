import { ScoringStrategy as PrismaScoringStrategy } from "@/generated/prisma/enums";
import type { ScoringStrategy } from "./scoring-strategy";
import type {
  CompetencyMultiSourceBreakdown,
  GapExtremes,
  MultiSourceSummary,
  ScoringInput,
  ScoringResult,
} from "./types";

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** 360 / behavioral: averages per competency by source; gap self vs others. */
export class MultiSourceScoring implements ScoringStrategy {
  readonly kind = PrismaScoringStrategy.MULTI_SOURCE;

  score(input: ScoringInput): ScoringResult {
    const qMap = new Map(input.questions.map((q) => [q.id, q]));

    type Bucket = {
      bySource: Record<string, number[]>;
    };
    const byCompetency: Record<string, Bucket> = {};
    const flat: number[] = [];
    const bySourceFlat: Record<string, number[]> = {};

    for (const r of input.responses) {
      const q = qMap.get(r.questionId);
      const competency = q?.traitCategory?.trim() || "General";
      const n = r.numericValue;
      if (n === undefined || Number.isNaN(n)) continue;
      flat.push(n);
      const src = r.source ?? "unknown";
      if (!byCompetency[competency]) byCompetency[competency] = { bySource: {} };
      if (!byCompetency[competency].bySource[src]) byCompetency[competency].bySource[src] = [];
      byCompetency[competency].bySource[src].push(n);
      if (!bySourceFlat[src]) bySourceFlat[src] = [];
      bySourceFlat[src].push(n);
    }

    const averagesBySource: Record<string, number> = {};
    for (const [k, vals] of Object.entries(bySourceFlat)) {
      averagesBySource[k] = mean(vals);
    }

    const overallAverage = mean(flat);

    const breakdown: CompetencyMultiSourceBreakdown[] = [];
    for (const [competencyKey, bucket] of Object.entries(byCompetency)) {
      const av: Record<string, number> = {};
      for (const [src, vals] of Object.entries(bucket.bySource)) {
        av[src] = mean(vals);
      }

      const othersValues: number[] = [];
      for (const [src, vals] of Object.entries(bucket.bySource)) {
        if (src === "self") continue;
        othersValues.push(...vals);
      }
      const othersAverage = mean(othersValues);
      const selfAvg = av.self ?? 0;
      const gapSelfVsOthers =
        av.self !== undefined && othersValues.length > 0 ? selfAvg - othersAverage : 0;

      breakdown.push({
        competencyKey,
        averagesBySource: av,
        othersAverage,
        gapSelfVsOthers,
      });
    }

    breakdown.sort((a, b) => a.competencyKey.localeCompare(b.competencyKey));

    const selfScores: number[] = [];
    const othersScores: number[] = [];
    for (const r of input.responses) {
      const n = r.numericValue;
      if (n === undefined || Number.isNaN(n)) continue;
      const src = r.source ?? "unknown";
      if (src === "self") selfScores.push(n);
      else othersScores.push(n);
    }

    const selfOverall = mean(selfScores);
    const othersOverall = mean(othersScores);
    const summary: MultiSourceSummary = {
      selfOverall,
      othersOverall,
      gapSelfVsOthers:
        selfScores.length > 0 && othersScores.length > 0 ? selfOverall - othersOverall : 0,
    };

    const withGap = breakdown.filter(
      (c) =>
        c.averagesBySource.self !== undefined &&
        Object.keys(c.averagesBySource).some((k) => k !== "self"),
    );
    let gaps: GapExtremes;
    if (withGap.length === 0) {
      gaps = {
        highest: { competencyKey: breakdown[0]?.competencyKey ?? "—", gap: 0 },
        lowest: { competencyKey: breakdown[0]?.competencyKey ?? "—", gap: 0 },
      };
    } else {
      const sorted = [...withGap].sort((a, b) => b.gapSelfVsOthers - a.gapSelfVsOthers);
      gaps = {
        highest: { competencyKey: sorted[0].competencyKey, gap: sorted[0].gapSelfVsOthers },
        lowest: {
          competencyKey: sorted[sorted.length - 1].competencyKey,
          gap: sorted[sorted.length - 1].gapSelfVsOthers,
        },
      };
    }

    return {
      strategy: "MULTI_SOURCE",
      byCompetency: breakdown,
      summary,
      gaps,
      averagesBySource,
      overallAverage,
    };
  }
}

/**
 * IQ / cognitive: count responses where selected option matches `correctOptionId`, weighted.
 * For standard scores, percentiles, and category bands on IQ templates, see `@/lib/iq-scoring` (`computeIqScores`).
 */
export class SumCorrectScoring implements ScoringStrategy {
  readonly kind = PrismaScoringStrategy.SUM_CORRECT;

  score(input: ScoringInput): ScoringResult {
    const qMap = new Map(input.questions.map((q) => [q.id, q]));
    let correctCount = 0;
    let totalGraded = 0;
    let weightedScore = 0;

    for (const r of input.responses) {
      const q = qMap.get(r.questionId);
      if (!q?.correctOptionId) continue;
      totalGraded += 1;
      const selected = r.selectedOptionIds?.[0];
      const ok = selected === q.correctOptionId;
      if (ok) {
        correctCount += 1;
        weightedScore += q.weight;
      }
    }

    return {
      strategy: "SUM_CORRECT",
      correctCount,
      totalGraded,
      weightedScore,
    };
  }
}

/**
 * EQ / psychometric: aggregate numeric scores by `traitCategory` on questions.
 * EQ assessments use `computeEqAssessmentResult` in `@/lib/eq-scoring` for domain 0–100 scores and reporting.
 * Psychometric (Big Five) self-tests use `computePsychometricResult` in `@/lib/psychometric-scoring` for OCEAN
 * percentiles, validity flags, and radar payloads — not this generic mean-by-trait path.
 */
export class TraitAggregateScoring implements ScoringStrategy {
  readonly kind = PrismaScoringStrategy.TRAIT_AGGREGATE;

  score(input: ScoringInput): ScoringResult {
    const qMap = new Map(input.questions.map((q) => [q.id, q]));
    const byTrait: Record<string, number[]> = {};
    const all: number[] = [];

    for (const r of input.responses) {
      const q = qMap.get(r.questionId);
      const trait = q?.traitCategory?.trim() || "General";
      const n = r.numericValue;
      if (n === undefined || Number.isNaN(n)) continue;
      all.push(n);
      if (!byTrait[trait]) byTrait[trait] = [];
      byTrait[trait].push(n);
    }

    const out: Record<string, number> = {};
    for (const [t, vals] of Object.entries(byTrait)) {
      out[t] = mean(vals);
    }

    return {
      strategy: "TRAIT_AGGREGATE",
      byTrait: out,
      overall: mean(all),
    };
  }
}
