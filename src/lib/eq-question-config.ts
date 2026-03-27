import type { AssessmentQuestionType } from "@/generated/prisma/enums";

export type EqScenarioOption = {
  id: string;
  label: string;
  value: string;
  /** 0–100 EQ points for this response (higher = more emotionally intelligent). */
  eqPoints?: number;
  rationale?: string;
};

export function parseEqScenarioOptions(raw: unknown): EqScenarioOption[] {
  const o = (raw && typeof raw === "object" ? raw : {}) as { options?: unknown };
  if (!Array.isArray(o.options)) return [];
  return o.options.map((x, i) => {
    const row = x as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : `opt_${i}`;
    const label = typeof row.label === "string" ? row.label : "";
    const value = typeof row.value === "string" ? row.value : label;
    const eqPoints = typeof row.eqPoints === "number" && Number.isFinite(row.eqPoints) ? row.eqPoints : undefined;
    const rationale = typeof row.rationale === "string" ? row.rationale : undefined;
    return { id, label, value, eqPoints, rationale };
  });
}

/** Default EQ points when admin omits them (spread across four typical options). */
export function defaultEqPointsForIndex(index: number, total: number): number {
  if (total <= 1) return 75;
  const t = index / Math.max(1, total - 1);
  return Math.round(30 + t * 55);
}

export function scoreScenarioSelection(
  options: EqScenarioOption[],
  selectedId: string | undefined,
): number {
  if (!selectedId) return 0;
  const idx = options.findIndex((o) => o.id === selectedId);
  const opt = options[idx];
  if (!opt) return 0;
  if (typeof opt.eqPoints === "number" && Number.isFinite(opt.eqPoints)) {
    return Math.min(100, Math.max(0, opt.eqPoints));
  }
  return defaultEqPointsForIndex(Math.max(0, idx), options.length);
}

/** Map 1–7 Likert to 0–100; apply reverse for reverse-scored items. */
export function scoreSelfReportLikert(likert: number, reverseScored: boolean): number {
  const n = Math.min(7, Math.max(1, Math.round(likert)));
  let v = ((n - 1) / 6) * 100;
  if (reverseScored) v = 100 - v;
  return Math.round(v * 10) / 10;
}

export function isEqScenarioType(qt: AssessmentQuestionType): boolean {
  return qt === "EQ_SCENARIO";
}

export function isEqSelfReportType(qt: AssessmentQuestionType): boolean {
  return qt === "EQ_SELF_REPORT";
}
