import type { InsightSeverity } from "@/generated/prisma/enums";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import type { GeneratedInsight } from "./types";

/** Subset of persisted rules passed from the dashboard loader. */
export type InsightRuleSlice = {
  id: string;
  competencyKey: string | null;
  minGap: { toString(): string } | number;
  maxGap: { toString(): string } | number;
  messageTemplate: string;
  severity: InsightSeverity;
  sortOrder: number;
};

function substituteTemplate(template: string, vars: Record<string, string>): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{{${k}}}`, v);
  }
  return s;
}

/**
 * Rule-based 360 insights: built-in heuristics + optional `InsightRule` rows.
 * Returns up to `limit` insights, highest priority first.
 */
export function generate360Insights(
  scores: Assessment360StoredResult,
  dbRules: InsightRuleSlice[],
  options?: { limit?: number },
): GeneratedInsight[] {
  const limit = options?.limit ?? 3;
  const out: GeneratedInsight[] = [];

  for (const row of scores.byCompetency) {
    const name = row.competencyKey;
    const self = row.self;
    const peer = row.peerAvg;
    const mgr = row.manager;

    if (self !== undefined && peer !== undefined) {
      const gapSelfPeer = self - peer;
      if (gapSelfPeer > 0.5) {
        out.push({
          id: `blind-${name}`,
          kind: "blind_spot",
          title: "Blind spot",
          message: `You rated yourself higher in ${name} than peers did (${self.toFixed(1)} vs ${peer.toFixed(1)}). Consider asking for specific examples to calibrate.`,
          severity: "WARNING",
          competencyKey: name,
          weight: 100 + gapSelfPeer * 10,
        });
      }
    }

    if (self !== undefined && mgr !== undefined) {
      const gapSelfManager = self - mgr;
      if (gapSelfManager < -0.3) {
        out.push({
          id: `hidden-${name}`,
          kind: "hidden_strength",
          title: "Hidden strength",
          message: `Your manager sees stronger ${name} skills than you recognize (${mgr.toFixed(1)} vs your ${self.toFixed(1)}).`,
          severity: "POSITIVE",
          competencyKey: name,
          weight: 90 + Math.abs(gapSelfManager) * 10,
        });
      }
    }
  }

  const withOthers = scores.byCompetency
    .filter((c) => c.othersAverage !== undefined && !Number.isNaN(c.othersAverage))
    .map((c) => ({ ...c, others: c.othersAverage }));
  if (withOthers.length > 0) {
    const lowest = withOthers.reduce((a, b) => (a.others <= b.others ? a : b));
    out.push({
      id: `dev-${lowest.competencyKey}`,
      kind: "development",
      title: "Development opportunity",
      message: `Others rated ${lowest.competencyKey} lowest on average (${lowest.others.toFixed(1)}). A good focus area for growth.`,
      severity: "INFO",
      competencyKey: lowest.competencyKey,
      weight: 70,
    });
  }

  for (const rule of dbRules) {
    const key = rule.competencyKey?.trim() || null;
    const rows = key ? scores.byCompetency.filter((c) => c.competencyKey === key) : scores.byCompetency;
    for (const c of rows) {
      const gap = c.gapSelfVsOthers;
      const min = Number(rule.minGap);
      const max = Number(rule.maxGap);
      if (gap >= min && gap <= max) {
        const msg = substituteTemplate(rule.messageTemplate, {
          competency: c.competencyKey,
          self: c.self?.toFixed(1) ?? "—",
          peer: c.peerAvg?.toFixed(1) ?? "—",
          manager: c.manager?.toFixed(1) ?? "—",
          gap: c.gapSelfVsOthers.toFixed(2),
        });
        out.push({
          id: `rule-${rule.id}-${c.competencyKey}`,
          kind: "rule",
          title: "Insight",
          message: msg,
          severity: rule.severity as InsightSeverity,
          competencyKey: c.competencyKey,
          weight: 50 + rule.sortOrder,
        });
      }
    }
  }

  out.sort((a, b) => b.weight - a.weight);

  const seen = new Set<string>();
  const deduped: GeneratedInsight[] = [];
  for (const i of out) {
    const k = `${i.kind}-${i.competencyKey ?? ""}-${i.title}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(i);
    if (deduped.length >= limit) break;
  }

  return deduped.slice(0, limit);
}
