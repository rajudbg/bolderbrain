import type { AssessmentQuestionType } from "@/generated/prisma/enums";
import { cumulativeStdNormal } from "@/lib/iq-scoring";
import {
  EQ_DOMAIN_KEYS,
  type EqDomainKey,
  domainDisplayName,
  isEqDomainKey,
} from "@/lib/eq-domains";
import {
  parseEqScenarioOptions,
  scoreScenarioSelection,
  scoreSelfReportLikert,
  isEqScenarioType,
  isEqSelfReportType,
} from "@/lib/eq-question-config";

export type EqResponseEntry = {
  scenarioOptionId?: string;
  likert?: number;
};

export type EqQuestionForScoring = {
  id: string;
  questionType: AssessmentQuestionType;
  traitCategory: string | null;
  reverseScored: boolean;
  config: unknown;
};

function percentileOfScore(score: number, mean = 50, sd = 15): number {
  const z = (score - mean) / sd;
  return Math.round(cumulativeStdNormal(z) * 1000) / 10;
}

function labelForQuadrant(selfAware: number, selfReg: number): string {
  const hi = (v: number) => v >= 50;
  if (hi(selfAware) && hi(selfReg)) return "Emotionally Balanced";
  if (hi(selfAware) && !hi(selfReg)) return "Self-Reflective";
  if (!hi(selfAware) && hi(selfReg)) return "Action-Oriented";
  return "Developing";
}

function scoreItem(q: EqQuestionForScoring, r: EqResponseEntry | undefined): number | null {
  if (!r) return null;
  if (isEqScenarioType(q.questionType)) {
    const opts = parseEqScenarioOptions(q.config);
    return scoreScenarioSelection(opts, r.scenarioOptionId);
  }
  if (isEqSelfReportType(q.questionType)) {
    if (r.likert === undefined || Number.isNaN(r.likert)) return null;
    return scoreSelfReportLikert(r.likert, q.reverseScored);
  }
  return null;
}

export type EqComputedResult = {
  domainScores: Record<EqDomainKey, number>;
  compositeScore: number;
  percentileComposite: number;
  percentileByDomain: Record<EqDomainKey, number>;
  highestDomain: EqDomainKey;
  lowestDomain: EqDomainKey;
  strengths: [EqDomainKey, EqDomainKey];
  consistencyFlags: string[];
  narrativeText: string;
  quadrantLabel: string;
  heatmapPosition: { x: number; y: number };
};

export function computeEqAssessmentResult(
  questions: EqQuestionForScoring[],
  responses: Record<string, EqResponseEntry>,
): EqComputedResult {
  const byDomain: Record<EqDomainKey, number[]> = {
    SelfAwareness: [],
    SelfRegulation: [],
    Motivation: [],
    Empathy: [],
    SocialSkills: [],
  };
  const byDomainScenario: Record<EqDomainKey, number[]> = {
    SelfAwareness: [],
    SelfRegulation: [],
    Motivation: [],
    Empathy: [],
    SocialSkills: [],
  };
  const byDomainSelfReport: Record<EqDomainKey, number[]> = {
    SelfAwareness: [],
    SelfRegulation: [],
    Motivation: [],
    Empathy: [],
    SocialSkills: [],
  };

  for (const q of questions) {
    const trait = q.traitCategory?.trim() ?? "";
    if (!isEqDomainKey(trait)) continue;
    const domain = trait as EqDomainKey;
    const s = scoreItem(q, responses[q.id]);
    if (s === null) continue;
    byDomain[domain].push(s);
    if (isEqScenarioType(q.questionType)) byDomainScenario[domain].push(s);
    if (isEqSelfReportType(q.questionType)) byDomainSelfReport[domain].push(s);
  }

  const domainScores = {} as Record<EqDomainKey, number>;
  for (const k of EQ_DOMAIN_KEYS) {
    const vals = byDomain[k];
    domainScores[k] =
      vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  }

  const nonZero = EQ_DOMAIN_KEYS.filter((k) => byDomain[k].length > 0);
  const compositeScore =
    nonZero.length > 0
      ? Math.round(
          (nonZero.reduce((sum, k) => sum + domainScores[k], 0) / nonZero.length) * 10,
        ) / 10
      : 0;

  const percentileComposite = percentileOfScore(compositeScore);
  const percentileByDomain = {} as Record<EqDomainKey, number>;
  for (const k of EQ_DOMAIN_KEYS) {
    percentileByDomain[k] = percentileOfScore(domainScores[k]);
  }

  const sorted = [...EQ_DOMAIN_KEYS].sort((a, b) => domainScores[b] - domainScores[a]);
  const highestDomain = sorted[0]!;
  const lowestDomain = sorted[sorted.length - 1]!;
  const strengths: [EqDomainKey, EqDomainKey] = [sorted[0]!, sorted[1]!];

  const consistencyFlags: string[] = [];
  for (const k of EQ_DOMAIN_KEYS) {
    const sc = byDomainScenario[k];
    const sr = byDomainSelfReport[k];
    if (sc.length === 0 || sr.length === 0) continue;
    const mSc = sc.reduce((a, b) => a + b, 0) / sc.length;
    const mSr = sr.reduce((a, b) => a + b, 0) / sr.length;
    if (Math.abs(mSc - mSr) > 25) {
      consistencyFlags.push(
        `${domainDisplayName(k)}: situational responses and self-report statements differ (${Math.round(mSc)} vs ${Math.round(mSr)}). Reflect on what feels most true for you.`,
      );
    }
  }

  const sa = domainScores.SelfAwareness;
  const sr = domainScores.SelfRegulation;
  const quadrantLabel = labelForQuadrant(sa, sr);
  const heatmapPosition = { x: sr, y: sa };

  const narrativeText = buildNarrative(strengths, lowestDomain, domainScores);

  return {
    domainScores,
    compositeScore,
    percentileComposite,
    percentileByDomain,
    highestDomain,
    lowestDomain,
    strengths,
    consistencyFlags,
    narrativeText,
    quadrantLabel,
    heatmapPosition,
  };
}

function buildNarrative(
  strengths: [EqDomainKey, EqDomainKey],
  lowest: EqDomainKey,
  scores: Record<EqDomainKey, number>,
): string {
  const a = domainDisplayName(strengths[0]);
  const b = domainDisplayName(strengths[1]);
  const low = domainDisplayName(lowest);
  const lowScore = scores[lowest];
  if (lowScore >= 70) {
    return `You show strong ${a} and ${b} — all domains are in a growth-positive range. ${low} is still a relative focus area for continued development; small habits compound over time.`;
  }
  return `You show particular strength in ${a} and ${b}, which supports collaboration and relationships at work. ${low} is a natural development area: EQ can be developed with practice — consider the exercises in your results and one small weekly habit.`;
}
