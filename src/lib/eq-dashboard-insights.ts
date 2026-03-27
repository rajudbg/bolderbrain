import type { InsightSeverity } from "@/generated/prisma/enums";
import type { GeneratedInsight } from "@/lib/insights/types";
import { domainDisplayName, type EqDomainKey } from "@/lib/eq-domains";

export type EqResultInsightInput = {
  templateName: string;
  highestDomain: EqDomainKey;
  lowestDomain: EqDomainKey;
  percentileByDomain: Record<EqDomainKey, number>;
  compositePercentile: number;
  /** Optional: 360 othersAverage for Communication if present */
  communication360?: number | null;
  socialSkillsScore?: number;
};

export function buildEqDashboardInsights(input: EqResultInsightInput): GeneratedInsight[] {
  const out: GeneratedInsight[] = [];
  const hi = input.highestDomain;
  const hiPct = input.percentileByDomain[hi] ?? input.compositePercentile;

  out.push({
    id: "eq-strength",
    kind: "hidden_strength",
    title: "EQ strength",
    message: `On ${input.templateName}, your ${domainDisplayName(hi)} stands out — around the ${hiPct.toFixed(0)}th percentile compared to our reference group. This is a real asset in how you work with people.`,
    severity: "POSITIVE" as InsightSeverity,
    weight: 3,
    competencyKey: hi,
  });

  out.push({
    id: "eq-growth",
    kind: "development",
    title: "Growth area",
    message: `Relative to your other domains, ${domainDisplayName(input.lowestDomain)} is the clearest development thread right now. Small, consistent practice moves the needle — see your EQ results page for ideas.`,
    severity: "INFO" as InsightSeverity,
    weight: 2,
    competencyKey: input.lowestDomain,
  });

  if (
    input.communication360 != null &&
    input.socialSkillsScore != null &&
    input.socialSkillsScore >= 70 &&
    input.communication360 >= 3.5
  ) {
    out.push({
      id: "eq-360-align",
      kind: "rule",
      title: "360 alignment",
      message: `Your manager and peers rated Communication strongly in your latest 360, which aligns with your solid EQ score in Social Skills — a consistent pattern across perspectives.`,
      severity: "POSITIVE" as InsightSeverity,
      weight: 2,
    });
  }

  return out.slice(0, 3);
}
