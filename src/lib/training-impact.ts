import type { Assessment360StoredResult } from "@/lib/assessment-360-result";

export type TrainingCompetencyScores = {
  overall: number;
  byCompetency: Record<string, number>;
};

export type ImpactBand = "TRANSFORMATIVE" | "SIGNIFICANT" | "MODERATE" | "MAINTAINED" | "DECLINED";

export function scoresFrom360Payload(payload: Assessment360StoredResult): TrainingCompetencyScores {
  const byCompetency: Record<string, number> = {};
  let sum = 0;
  let n = 0;
  for (const c of payload.byCompetency) {
    const v = c.self ?? c.othersAverage;
    byCompetency[c.competencyKey] = v;
    sum += v;
    n++;
  }
  return { overall: n ? sum / n : 0, byCompetency };
}

export function classifyImpact(delta: number): ImpactBand {
  if (delta > 0.8) return "TRANSFORMATIVE";
  if (delta > 0.4) return "SIGNIFICANT";
  if (delta > 0.1) return "MODERATE";
  if (delta > -0.2) return "MAINTAINED";
  return "DECLINED";
}

export type CompetencyDeltaRow = {
  competencyKey: string;
  pre: number;
  post: number;
  delta: number;
  percentChange: number;
  impact: ImpactBand;
};

export type TrainingDeltaPayload = {
  overall: { pre: number; post: number; delta: number; percentChange: number; impact: ImpactBand };
  byCompetency: CompetencyDeltaRow[];
};

export function computeTrainingDelta(
  pre: TrainingCompetencyScores | null,
  post: TrainingCompetencyScores | null,
): TrainingDeltaPayload | null {
  if (!pre || !post) return null;
  const keys = new Set([...Object.keys(pre.byCompetency), ...Object.keys(post.byCompetency)]);
  const byCompetency: CompetencyDeltaRow[] = [];
  for (const competencyKey of keys) {
    const a = pre.byCompetency[competencyKey];
    const b = post.byCompetency[competencyKey];
    if (a == null || b == null) continue;
    const delta = b - a;
    const percentChange = a > 0 ? Math.round((delta / a) * 100) : 0;
    byCompetency.push({
      competencyKey,
      pre: a,
      post: b,
      delta,
      percentChange,
      impact: classifyImpact(delta),
    });
  }
  byCompetency.sort((x, y) => y.delta - x.delta);
  const overallDelta = post.overall - pre.overall;
  const overallPct = pre.overall > 0 ? Math.round((overallDelta / pre.overall) * 100) : 0;
  return {
    overall: {
      pre: pre.overall,
      post: post.overall,
      delta: overallDelta,
      percentChange: overallPct,
      impact: classifyImpact(overallDelta),
    },
    byCompetency,
  };
}

export function cohortMeanDelta(enrollments: { delta: unknown }[]): number | null {
  const vals: number[] = [];
  for (const e of enrollments) {
    const d = e.delta as TrainingDeltaPayload | null | undefined;
    if (d?.overall?.percentChange != null) vals.push(d.overall.percentChange);
  }
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
