/**
 * Inputs for scoring engines (assessment-taking will populate this later).
 * Questions carry weights, correct keys, and trait metadata from the DB.
 */
export type ScoringQuestionMeta = {
  id: string;
  key: string;
  weight: number;
  correctOptionId?: string | null;
  traitCategory?: string | null;
};

export type ScoringResponse = {
  questionId: string;
  selectedOptionIds?: string[];
  numericValue?: number;
  textValue?: string;
  /** For 360-style multi-rater data. */
  source?: "self" | "peer" | "manager" | "direct_report" | string;
};

export type ScoringInput = {
  templateId: string;
  questions: ScoringQuestionMeta[];
  responses: ScoringResponse[];
};

export type CompetencyMultiSourceBreakdown = {
  competencyKey: string;
  averagesBySource: Record<string, number>;
  /** Mean of all non-self ratings (peers + manager combined). */
  othersAverage: number;
  /** self - othersAverage (positive = self higher). */
  gapSelfVsOthers: number;
};

export type MultiSourceSummary = {
  selfOverall: number;
  othersOverall: number;
  gapSelfVsOthers: number;
};

export type GapExtremes = {
  highest: { competencyKey: string; gap: number };
  lowest: { competencyKey: string; gap: number };
};

export type ScoringResult =
  | {
      strategy: "MULTI_SOURCE";
      /** Per-competency averages by rater role (self, peer, manager). */
      byCompetency: CompetencyMultiSourceBreakdown[];
      summary: MultiSourceSummary;
      gaps: GapExtremes;
      /** Flat averages across all scored items (legacy). */
      averagesBySource: Record<string, number>;
      overallAverage: number;
    }
  | {
      strategy: "SUM_CORRECT";
      correctCount: number;
      totalGraded: number;
      weightedScore: number;
    }
  | {
      strategy: "TRAIT_AGGREGATE";
      byTrait: Record<string, number>;
      overall: number;
    };
