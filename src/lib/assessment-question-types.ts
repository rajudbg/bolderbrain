import {
  AssessmentQuestionType,
  AssessmentTemplateType,
} from "@/generated/prisma/enums";

/** Question types allowed for each assessment template type in admin configuration. */
/** Likert-based flow shared by 360 feedback and TNA diagnostic self-audits. */
export function usesLikert360Flow(type: AssessmentTemplateType): boolean {
  return (
    type === AssessmentTemplateType.BEHAVIORAL_360 || type === AssessmentTemplateType.TNA_DIAGNOSTIC
  );
}

export function questionTypesForTemplate(type: AssessmentTemplateType): AssessmentQuestionType[] {
  switch (type) {
    case AssessmentTemplateType.BEHAVIORAL_360:
      return [AssessmentQuestionType.LIKERT_360, AssessmentQuestionType.TEXT_SHORT, AssessmentQuestionType.FREE_TEXT];
    case AssessmentTemplateType.IQ_COGNITIVE:
      return [
        AssessmentQuestionType.SINGLE_CHOICE_IQ,
        AssessmentQuestionType.MULTI_CHOICE_IQ,
        AssessmentQuestionType.NUMERICAL_SEQUENCE,
        AssessmentQuestionType.VERBAL_ANALOGY,
        AssessmentQuestionType.LOGICAL_PATTERN,
        AssessmentQuestionType.SPATIAL_REASONING,
        AssessmentQuestionType.TEXT_SHORT,
      ];
    case AssessmentTemplateType.TNA_DIAGNOSTIC:
      return [AssessmentQuestionType.LIKERT_360, AssessmentQuestionType.TEXT_SHORT, AssessmentQuestionType.FREE_TEXT];
    case AssessmentTemplateType.EQ_ASSESSMENT:
      return [
        AssessmentQuestionType.EQ_SCENARIO,
        AssessmentQuestionType.EQ_SELF_REPORT,
        AssessmentQuestionType.TEXT_SHORT,
        AssessmentQuestionType.FREE_TEXT,
      ];
    case AssessmentTemplateType.PSYCHOMETRIC:
      return [
        AssessmentQuestionType.FORCED_CHOICE_IPSATIVE,
        AssessmentQuestionType.SEMANTIC_DIFFERENTIAL,
        AssessmentQuestionType.PSYCHOMETRIC_LIKERT,
        AssessmentQuestionType.TEXT_SHORT,
      ];
  }
}

export function questionTypeLabel(t: AssessmentQuestionType): string {
  const labels: Record<AssessmentQuestionType, string> = {
    LIKERT_360: "Likert (360)",
    SINGLE_CHOICE_IQ: "Single choice (IQ)",
    MULTI_CHOICE_IQ: "Multi choice (IQ)",
    NUMERICAL_SEQUENCE: "Numerical sequence",
    VERBAL_ANALOGY: "Verbal analogy",
    LOGICAL_PATTERN: "Logical / matrix pattern",
    SPATIAL_REASONING: "Spatial reasoning",
    EQ_SCENARIO: "EQ scenario (situational judgment)",
    EQ_SELF_REPORT: "EQ self-report (1–7)",
    PSYCHOMETRIC_LIKERT: "Psychometric Likert",
    FORCED_CHOICE_IPSATIVE: "Forced choice (Most / Least — ipsative)",
    SEMANTIC_DIFFERENTIAL: "Semantic differential (between opposites)",
    TEXT_SHORT: "Short text",
    FREE_TEXT: "Free text",
  };
  return labels[t] ?? t;
}
