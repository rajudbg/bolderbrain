import type { ScoringStrategy as ScoringStrategyKind } from "@/generated/prisma/enums";
import type { ScoringInput, ScoringResult } from "./types";

/**
 * Pluggable scoring strategy (aligned with Prisma `ScoringStrategy` enum).
 */
export interface ScoringStrategy {
  readonly kind: ScoringStrategyKind;
  score(input: ScoringInput): ScoringResult;
}
