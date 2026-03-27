export type QuestionOption = {
  id: string;
  label: string;
  value?: string;
  /** EQ scenario: 0–100 points for this response option. */
  eqPoints?: number;
  /** EQ scenario: shown after the user selects this option. */
  rationale?: string;
};

export type QuestionConfigShape = {
  prompt?: string;
  /** Optional HTML stem (sanitized in UI — still treat as trusted admin content). */
  richHtml?: string;
  imageUrl?: string;
  type?: "single_choice" | "multi_choice" | "text" | "scale";
  options?: QuestionOption[];
};

export function parseQuestionConfig(raw: unknown): {
  prompt: string;
  richHtml: string;
  imageUrl: string;
  type: QuestionConfigShape["type"];
  options: { id: string; label: string; value: string; eqPoints?: number; rationale?: string }[];
} {
  const o = (raw && typeof raw === "object" ? raw : {}) as QuestionConfigShape;
  const prompt = typeof o.prompt === "string" ? o.prompt : "";
  const richHtml = typeof o.richHtml === "string" ? o.richHtml : "";
  const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl : "";
  const type = o.type ?? "single_choice";
  const options =
    Array.isArray(o.options) && o.options.length > 0
      ? o.options.map((x, i) => {
          const row = x as QuestionOption;
          const eqPoints =
            typeof row.eqPoints === "number" && Number.isFinite(row.eqPoints) ? row.eqPoints : undefined;
          const rationale = typeof row.rationale === "string" ? row.rationale : undefined;
          return {
            id: typeof row.id === "string" ? row.id : `opt_${i}`,
            label: typeof row.label === "string" ? row.label : "",
            value: typeof row.value === "string" ? row.value : String(row.label ?? ""),
            eqPoints,
            rationale,
          };
        })
      : [{ id: "opt_0", label: "", value: "" }];
  return { prompt, richHtml, imageUrl, type, options };
}

export function buildQuestionConfig(input: {
  prompt: string;
  richHtml?: string;
  imageUrl?: string;
  type: NonNullable<QuestionConfigShape["type"]>;
  options: Array<{
    label: string;
    value: string;
    eqPoints?: number;
    rationale?: string;
  }>;
}): QuestionConfigShape {
  const base: QuestionConfigShape = {
    prompt: input.prompt.trim() || undefined,
    richHtml: input.richHtml?.trim() || undefined,
    imageUrl: input.imageUrl?.trim() || undefined,
    type: input.type,
  };
  if (input.type === "single_choice" || input.type === "multi_choice") {
    const opts = input.options
      .filter((o) => o.label.trim())
      .map((o, i) => {
        const row: QuestionOption = {
          id: `opt_${i}`,
          label: o.label.trim(),
          value: (o.value || o.label).trim(),
        };
        if (typeof o.eqPoints === "number" && Number.isFinite(o.eqPoints)) {
          row.eqPoints = o.eqPoints;
        }
        if (o.rationale?.trim()) {
          row.rationale = o.rationale.trim();
        }
        return row;
      });
    base.options = opts.length ? opts : undefined;
  }
  return base;
}
