import type { AssessmentQuestionType } from "@/generated/prisma/enums";
import { cumulativeStdNormal } from "@/lib/iq-scoring";
import { OCEAN_TRAITS, type OceanTrait, oceanDisplayName } from "@/lib/ocean-traits";

export type PsychForcedResponse = {
  mostStatementId: string;
  leastStatementId: string;
};

export type PsychSemanticResponse = {
  value: number;
};

export type ForcedStatement = { id: string; text: string; trait: string };

export function parseForcedChoiceConfig(raw: unknown): {
  statements: ForcedStatement[];
  psychItemKind: "normal" | "consistency" | "social_desirability";
  consistencyPairKey?: string;
  refTrait?: string;
} {
  const o = (raw && typeof raw === "object" ? raw : {}) as {
    statements?: unknown;
    psychItemKind?: string;
    consistencyPairKey?: string;
    refTrait?: string;
  };
  const statements: ForcedStatement[] = Array.isArray(o.statements)
    ? o.statements.map((x, i) => {
        const r = x as Record<string, unknown>;
        return {
          id: typeof r.id === "string" ? r.id : `s${i}`,
          text: typeof r.text === "string" ? r.text : "",
          trait: typeof r.trait === "string" ? r.trait : "Openness",
        };
      })
    : [];
  const k = o.psychItemKind;
  const psychItemKind =
    k === "consistency" || k === "social_desirability" ? k : "normal";
  const consistencyPairKey =
    typeof o.consistencyPairKey === "string" && o.consistencyPairKey.trim()
      ? o.consistencyPairKey.trim()
      : undefined;
  const refTrait =
    typeof o.refTrait === "string" && o.refTrait.trim() ? o.refTrait.trim() : undefined;
  return { statements, psychItemKind, consistencyPairKey, refTrait };
}

function parsePsychLikertScale(raw: unknown): { min: number; max: number } {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const min = typeof o.scaleMin === "number" ? o.scaleMin : 1;
  const max = typeof o.scaleMax === "number" ? o.scaleMax : 5;
  return { min, max };
}

export function parseSemanticConfig(raw: unknown): {
  leftLabel: string;
  rightLabel: string;
  steps: number;
} {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    leftLabel: typeof o.leftLabel === "string" ? o.leftLabel : "Left",
    rightLabel: typeof o.rightLabel === "string" ? o.rightLabel : "Right",
    steps: typeof o.steps === "number" && o.steps >= 3 ? Math.floor(o.steps) : 5,
  };
}

function initSums(): Record<OceanTrait, number> {
  return {
    Openness: 0,
    Conscientiousness: 0,
    Extraversion: 0,
    Agreeableness: 0,
    Neuroticism: 0,
  };
}

function addTrait(sums: Record<OceanTrait, number>, trait: string, delta: number) {
  if (OCEAN_TRAITS.includes(trait as OceanTrait)) {
    sums[trait as OceanTrait] += delta;
  }
}

/** Map raw sum to 0–100 percentile (mock norms). */
function traitPercentile(raw: number): number {
  const mu = 0;
  const sd = 8;
  const z = (raw - mu) / sd;
  const p = cumulativeStdNormal(z) * 100;
  return Math.round(Math.min(99, Math.max(1, p)) * 10) / 10;
}

/** Within-person ipsative: center raw sums then re-map to percentiles. */
function ipsativePercentiles(raw: Record<OceanTrait, number>): Record<OceanTrait, number> {
  const vals = OCEAN_TRAITS.map((t) => raw[t]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const centered = {} as Record<OceanTrait, number>;
  for (const t of OCEAN_TRAITS) {
    centered[t] = raw[t] - mean;
  }
  const out = {} as Record<OceanTrait, number>;
  for (const t of OCEAN_TRAITS) {
    out[t] = traitPercentile(centered[t]);
  }
  return out;
}

export type ValidityFlags = {
  inconsistencyWarning: boolean;
  socialDesirabilityWarning: boolean;
  speedWarning: boolean;
  messages: string[];
};

export type PsychComputedResult = {
  traitPercentiles: Record<OceanTrait, number>;
  rawTraitSums: Record<OceanTrait, number>;
  validityFlags: ValidityFlags;
  roleMatches: Record<string, number>;
  teamDynamicsText: string;
  careerInsightsText: string;
  summaryLine: string;
  radarPayload: {
    traits: OceanTrait[];
    user: number[];
    population: number[];
    idealLeadership?: number[];
  };
};

function isForcedChoice(qt: AssessmentQuestionType): boolean {
  return qt === "FORCED_CHOICE_IPSATIVE";
}

function isSemantic(qt: AssessmentQuestionType): boolean {
  return qt === "SEMANTIC_DIFFERENTIAL";
}

function isPsychLikert(qt: AssessmentQuestionType): boolean {
  return qt === "PSYCHOMETRIC_LIKERT";
}

export function computePsychometricResult(
  questions: Array<{
    id: string;
    questionType: AssessmentQuestionType;
    traitCategory: string | null;
    reverseScored: boolean;
    config: unknown;
  }>,
  responses: Record<string, PsychForcedResponse | PsychSemanticResponse | unknown>,
  itemTimings: Record<string, number>,
  roleProfiles: Record<string, Partial<Record<string, number>>>,
): PsychComputedResult {
  const raw = initSums();
  let sdMostFirstCount = 0;
  let sdItems = 0;
  const pairVotes: Record<string, number[]> = {};

  for (const q of questions) {
    const r = responses[q.id];
    if (!r || typeof r !== "object") continue;

    if (isForcedChoice(q.questionType)) {
      const { statements, psychItemKind, consistencyPairKey, refTrait } = parseForcedChoiceConfig(q.config);
      const pr = r as PsychForcedResponse;
      if (!pr.mostStatementId || !pr.leastStatementId) continue;
      if (pr.mostStatementId === pr.leastStatementId) continue;

      const most = statements.find((s) => s.id === pr.mostStatementId);
      const least = statements.find((s) => s.id === pr.leastStatementId);
      if (most) addTrait(raw, most.trait, 2);
      if (least) addTrait(raw, least.trait, -2);

      if (psychItemKind === "social_desirability" && statements[0]) {
        sdItems += 1;
        if (pr.mostStatementId === statements[0].id) sdMostFirstCount += 1;
      }

      if (
        psychItemKind === "consistency" &&
        consistencyPairKey &&
        refTrait &&
        OCEAN_TRAITS.includes(refTrait as OceanTrait)
      ) {
        const refStmt = statements.find((s) => s.trait === refTrait);
        if (refStmt) {
          let vote = 0;
          if (pr.mostStatementId === refStmt.id) vote = 1;
          else if (pr.leastStatementId === refStmt.id) vote = -1;
          if (vote !== 0) {
            if (!pairVotes[consistencyPairKey]) pairVotes[consistencyPairKey] = [];
            pairVotes[consistencyPairKey].push(vote);
          }
        }
      }
    } else if (isSemantic(q.questionType)) {
      const pr = r as PsychSemanticResponse;
      if (pr.value === undefined || Number.isNaN(pr.value)) continue;
      const { steps } = parseSemanticConfig(q.config);
      const trait = q.traitCategory?.trim();
      if (!trait || !OCEAN_TRAITS.includes(trait as OceanTrait)) continue;
      const mid = (steps + 1) / 2;
      let dev = pr.value - mid;
      if (q.reverseScored) dev = -dev;
      addTrait(raw, trait, dev * 0.8);
    } else if (isPsychLikert(q.questionType)) {
      const pr = r as PsychSemanticResponse;
      if (pr.value === undefined || Number.isNaN(pr.value)) continue;
      const { min, max } = parsePsychLikertScale(q.config);
      const trait = q.traitCategory?.trim();
      if (!trait || !OCEAN_TRAITS.includes(trait as OceanTrait)) continue;
      const mid = (min + max) / 2;
      let dev = pr.value - mid;
      if (q.reverseScored) dev = -dev;
      addTrait(raw, trait, dev * 0.75);
    }
  }

  const traitPercentiles = ipsativePercentiles(raw);

  const timings = Object.values(itemTimings).filter((n) => n > 0);
  const avgMs = timings.length ? timings.reduce((a, b) => a + b, 0) / timings.length : 0;
  const speedWarning = avgMs > 0 && avgMs < 2000;
  const socialDesirabilityWarning = sdItems >= 2 && sdMostFirstCount / sdItems >= 0.8;

  let inconsistencyWarning = false;
  for (const votes of Object.values(pairVotes)) {
    if (votes.length >= 2 && new Set(votes).size > 1) {
      inconsistencyWarning = true;
      break;
    }
  }

  const messages: string[] = [];
  if (speedWarning) {
    messages.push(
      "Responses were very fast relative to typical reflection — consider retaking when you can go slowly.",
    );
  }
  if (socialDesirabilityWarning) {
    messages.push(
      "Several socially desirable patterns were detected — results are still shown, but candor improves accuracy.",
    );
  }
  if (inconsistencyWarning) {
    messages.push(
      "Some paired items pointed in different directions — there are no right answers; answer in line with your typical style.",
    );
  }

  const validityFlags: ValidityFlags = {
    inconsistencyWarning,
    socialDesirabilityWarning,
    speedWarning,
    messages,
  };

  const roleMatches: Record<string, number> = {};
  for (const [role, ideal] of Object.entries(roleProfiles)) {
    roleMatches[role] = roleFitPercent(traitPercentiles, ideal);
  }

  const population = OCEAN_TRAITS.map(() => 50);
  const user = OCEAN_TRAITS.map((t) => traitPercentiles[t]);
  const idealLeadership = OCEAN_TRAITS.map((t) =>
    Math.round(((roleProfiles.leadership?.[t] ?? 0.65) as number) * 100),
  );

  const radarPayload = {
    traits: [...OCEAN_TRAITS],
    user,
    population,
    idealLeadership,
  };

  const ex = traitPercentiles.Extraversion;
  const ag = traitPercentiles.Agreeableness;
  const neu = traitPercentiles.Neuroticism;

  let teamDynamicsText = "";
  if (ex >= 55 && ag >= 55) {
    teamDynamicsText =
      "You likely energize groups and build rapport — combine that with clear expectations so collaboration stays productive.";
  } else if (ex < 45 && ag >= 55) {
    teamDynamicsText =
      "You may prefer quieter collaboration and harmony — you often support others without needing the spotlight.";
  } else if (ex >= 55 && ag < 45) {
    teamDynamicsText =
      "Direct and energetic communication is a strength; pairing it with active listening helps others feel heard.";
  } else {
    teamDynamicsText =
      "Your social style is nuanced — leverage one-to-one depth and written follow-ups when groups feel draining.";
  }

  teamDynamicsText += ` Stress response: ${neu >= 55 ? "you may notice mood and tension more readily — structure and recovery habits help." : "you tend to stay steadier under pressure — still guard against bottling things up."}`;

  const top = [...OCEAN_TRAITS].sort((a, b) => traitPercentiles[b] - traitPercentiles[a]).slice(0, 2);
  const careerInsightsText = `Strengths in ${oceanDisplayName(top[0]!)} and ${oceanDisplayName(top[1]!)} suggest environments that reward ${top[0] === "Openness" ? "novelty and ideas" : "your profile mix"}. Watch-outs: ${
    traitPercentiles.Conscientiousness < 45
      ? "lower structure — external deadlines and checklists can help."
      : "keep an eye on perfectionism if pressure rises."
  }`;

  const summaryLine = `Profile: ${top.map((t) => oceanDisplayName(t)).join(" & ")} stand out — this describes tendencies, not fixed limits.`;

  return {
    traitPercentiles,
    rawTraitSums: raw,
    validityFlags,
    roleMatches,
    teamDynamicsText,
    careerInsightsText,
    summaryLine,
    radarPayload,
  };
}

function roleFitPercent(
  userPct: Record<OceanTrait, number>,
  ideal: Partial<Record<string, number>>,
): number {
  let num = 0;
  let den = 0;
  for (const t of OCEAN_TRAITS) {
    const i = ideal[t];
    if (i === undefined) continue;
    const u = userPct[t] / 100;
    num += 1 - Math.abs(u - i);
    den += 1;
  }
  return den > 0 ? Math.round((num / den) * 100) : 0;
}
