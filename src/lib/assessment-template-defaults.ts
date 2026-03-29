import {
  AssessmentTemplateType,
  ScoringStrategy,
} from "@/generated/prisma/enums";

/** Suggested scoring strategy for a template type (can be overridden in admin). */
export function defaultScoringStrategyForTemplateType(type: AssessmentTemplateType): ScoringStrategy {
  switch (type) {
    case AssessmentTemplateType.BEHAVIORAL_360:
      return ScoringStrategy.MULTI_SOURCE;
    case AssessmentTemplateType.IQ_COGNITIVE:
      return ScoringStrategy.SUM_CORRECT;
    case AssessmentTemplateType.EQ_ASSESSMENT:
    case AssessmentTemplateType.PSYCHOMETRIC:
    case AssessmentTemplateType.TNA_DIAGNOSTIC:
      return ScoringStrategy.TRAIT_AGGREGATE;
    default:
      return ScoringStrategy.MULTI_SOURCE;
  }
}
