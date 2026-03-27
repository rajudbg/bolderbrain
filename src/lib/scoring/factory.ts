import { ScoringStrategy as PrismaScoringStrategy } from "@/generated/prisma/enums";
import type { ScoringStrategy } from "./scoring-strategy";
import { MultiSourceScoring, SumCorrectScoring, TraitAggregateScoring } from "./implementations";

/**
 * Returns the scoring implementation for a persisted template strategy.
 */
export function createScoringStrategy(kind: (typeof PrismaScoringStrategy)[keyof typeof PrismaScoringStrategy]): ScoringStrategy {
  switch (kind) {
    case PrismaScoringStrategy.MULTI_SOURCE:
      return new MultiSourceScoring();
    case PrismaScoringStrategy.SUM_CORRECT:
      return new SumCorrectScoring();
    case PrismaScoringStrategy.TRAIT_AGGREGATE:
      return new TraitAggregateScoring();
    default:
      throw new Error(`Unknown scoring strategy: ${String(kind)}`);
  }
}
