/**
 * IQ / cognitive `AssessmentTemplate.config` shape (JSON).
 * Stored on `AssessmentTemplate.config` for IQ_COGNITIVE templates.
 */
export type IqTemplateConfig = {
  /** Questions drawn randomly from the bank per attempt (default 20). */
  questionsPerTest?: number;
  /** Total session time in seconds (default 1800 = 30 min). */
  totalTimeSeconds?: number;
  /** Default per-question time hint in seconds (used when `Question.timeLimitSeconds` is null). */
  defaultQuestionTimeSeconds?: number;
  /** Block new attempts within this many months after a completed attempt (default 6). */
  retakeCooldownMonths?: number;
  /** Optional screening cutoff on the standard score scale (μ=100, σ=15). */
  passingStandardScore?: number;
};

const defaults: Required<
  Pick<
    IqTemplateConfig,
    | "questionsPerTest"
    | "totalTimeSeconds"
    | "defaultQuestionTimeSeconds"
    | "retakeCooldownMonths"
  >
> = {
  questionsPerTest: 20,
  totalTimeSeconds: 1800,
  defaultQuestionTimeSeconds: 90,
  retakeCooldownMonths: 6,
};

export function parseIqTemplateConfig(raw: unknown): Required<
  Pick<
    IqTemplateConfig,
    | "questionsPerTest"
    | "totalTimeSeconds"
    | "defaultQuestionTimeSeconds"
    | "retakeCooldownMonths"
  >
> &
  IqTemplateConfig {
  const o = (raw && typeof raw === "object" ? raw : {}) as IqTemplateConfig;
  return {
    questionsPerTest:
      typeof o.questionsPerTest === "number" && o.questionsPerTest > 0
        ? Math.floor(o.questionsPerTest)
        : defaults.questionsPerTest,
    totalTimeSeconds:
      typeof o.totalTimeSeconds === "number" && o.totalTimeSeconds > 0
        ? Math.floor(o.totalTimeSeconds)
        : defaults.totalTimeSeconds,
    defaultQuestionTimeSeconds:
      typeof o.defaultQuestionTimeSeconds === "number" && o.defaultQuestionTimeSeconds > 0
        ? Math.floor(o.defaultQuestionTimeSeconds)
        : defaults.defaultQuestionTimeSeconds,
    retakeCooldownMonths:
      typeof o.retakeCooldownMonths === "number" && o.retakeCooldownMonths >= 0
        ? Math.floor(o.retakeCooldownMonths)
        : defaults.retakeCooldownMonths,
    passingStandardScore:
      typeof o.passingStandardScore === "number" && Number.isFinite(o.passingStandardScore)
        ? o.passingStandardScore
        : undefined,
  };
}
