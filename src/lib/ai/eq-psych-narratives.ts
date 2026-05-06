import { generateCacheKey } from "./cache";
import { generateWithFallback } from "./resilient-generator";

// ─── EQ AI Narrative ───────────────────────────────────────────────────────

const EQ_SYSTEM_PROMPT = `You are an empathetic EQ coach writing personalised emotional intelligence insights.

Guidelines:
- Write 3-4 sentences maximum
- First sentence: Acknowledge the standout strength domain by name and what it enables
- Second sentence: Name the development area and frame it as a growth opportunity (not a flaw)
- Third sentence: Offer one concrete micro-habit to try this week for that domain
- Optional fourth: If there is a notable consistency gap, address it gently
- Tone: Warm, direct, growth-oriented; avoid clinical or judgmental language
- Never use: "leverage", "synergy", "utilize", "paradigm"
- Use "you" throughout`;

export type EqNarrativeInput = {
  attemptId: string;
  compositeScore: number;
  percentileComposite: number;
  highestDomain: string;
  lowestDomain: string;
  quadrantLabel: string;
  consistencyFlags: string[];
};

function eqRuleBasedNarrative(input: EqNarrativeInput): string {
  const { highestDomain, lowestDomain, compositeScore, percentileComposite, quadrantLabel } = input;
  const pctText = `~${percentileComposite.toFixed(0)}th percentile`;
  const strengthLabel = highestDomain.replace(/([A-Z])/g, " $1").trim();
  const growthLabel = lowestDomain.replace(/([A-Z])/g, " $1").trim();

  if (compositeScore >= 70) {
    return `Your ${strengthLabel} is a genuine asset — it helps you read situations and connect with others effectively. ${growthLabel} sits at your relative edge, which is your richest development opportunity right now. Try one small experiment this week: notice a moment where you could apply ${growthLabel} differently, and write down what happened. Your overall profile (${pctText}) reflects solid emotional awareness across the board.`;
  }
  return `${strengthLabel} stands out as your anchor — lean on it as you build in other areas. ${growthLabel} is where small, consistent practice will have the biggest payoff. This week, try pausing for two seconds before reacting in a challenging conversation; this one habit builds ${growthLabel} faster than any course. Your composite of ${compositeScore.toFixed(0)} (${pctText}) shows real potential to grow with intentional effort.`;
}

export async function generateEqAiNarrative(input: EqNarrativeInput): Promise<{
  narrativeText: string;
  source: string;
  modelUsed?: string;
  generationTimeMs?: number;
}> {
  const cacheKey = generateCacheKey({ ...input, type: "eq-narrative-v1" });

  const flagText =
    input.consistencyFlags.length > 0
      ? `\nConsistency flags: ${input.consistencyFlags.join("; ")}`
      : "";

  const prompt = `Write a personalised EQ insight for this result:

Composite score: ${input.compositeScore.toFixed(1)} / 100 (~${input.percentileComposite.toFixed(0)}th percentile)
Highest domain (strength): ${input.highestDomain}
Lowest domain (growth area): ${input.lowestDomain}
Quadrant: ${input.quadrantLabel}${flagText}

3-4 sentence warm coaching insight.`;

  const fallback = () => eqRuleBasedNarrative(input);
  const result = await generateWithFallback(prompt, EQ_SYSTEM_PROMPT, fallback, cacheKey, 220);

  return {
    narrativeText: result.success && result.content.trim().length > 20 ? result.content : fallback(),
    source: result.source,
    modelUsed: result.modelUsed,
    generationTimeMs: result.generationTimeMs,
  };
}

// ─── Psychometric AI Narrative ─────────────────────────────────────────────

const PSYCH_SYSTEM_PROMPT = `You are an experienced occupational psychologist writing Big Five personality insights.

Guidelines:
- Write 3-4 sentences maximum
- First sentence: Name the top 1-2 traits and what they enable at work
- Second sentence: Frame the lowest trait(s) as a context-dependent watchout, not a flaw
- Third sentence: Offer one specific environmental or behavioural adaptation this week
- Tone: Confident, evidence-informed, non-judgmental
- Always include this caveat naturally: traits describe tendencies, not fixed limits
- Never make selection or clinical-level statements`;

export type PsychNarrativeInput = {
  attemptId: string;
  summaryLine: string;
  topTraits: Array<{ trait: string; percentile: number }>;
  lowestTrait: { trait: string; percentile: number };
  teamDynamicsText: string;
};

function psychRuleBasedNarrative(input: PsychNarrativeInput): string {
  const top = input.topTraits.map((t) => t.trait).join(" and ");
  const lowest = input.lowestTrait.trait;
  return `Your profile highlights ${top} as your most prominent tendencies — these often translate into effective collaboration and reliable execution at work. ${lowest} sits lower, which can show up as a preference for flexibility or independence rather than rigid structure. One practical adaptation: identify one task this week where adding a brief checklist or check-in might reduce friction for colleagues who prefer more structure. Remember that these are tendencies, not fixed limits — context shapes how traits play out.`;
}

export async function generatePsychAiNarrative(input: PsychNarrativeInput): Promise<{
  narrativeText: string;
  source: string;
  modelUsed?: string;
  generationTimeMs?: number;
}> {
  const cacheKey = generateCacheKey({ ...input, type: "psych-narrative-v1" });

  const traitList = input.topTraits
    .map((t) => `${t.trait}: ${t.percentile.toFixed(0)}th percentile`)
    .join(", ");

  const prompt = `Write a personalised Big Five personality insight for this profile:

Summary: ${input.summaryLine}
Top traits: ${traitList}
Lowest trait: ${input.lowestTrait.trait} (${input.lowestTrait.percentile.toFixed(0)}th percentile)
Team dynamics note: ${input.teamDynamicsText}

3-4 sentences, occupational context, growth-oriented.`;

  const fallback = () => psychRuleBasedNarrative(input);
  const result = await generateWithFallback(prompt, PSYCH_SYSTEM_PROMPT, fallback, cacheKey, 220);

  return {
    narrativeText: result.success && result.content.trim().length > 20 ? result.content : fallback(),
    source: result.source,
    modelUsed: result.modelUsed,
    generationTimeMs: result.generationTimeMs,
  };
}

// ─── 90-Day AI Development Plan ────────────────────────────────────────────

const DEV_PLAN_SYSTEM_PROMPT = `You are a senior executive coach creating a 90-day development plan.

Structure your response EXACTLY like this (use the exact headers):
**Month 1 — Foundation (Days 1–30)**
[2-3 bullet points with specific, observable actions]

**Month 2 — Practice (Days 31–60)**
[2-3 bullet points building on Month 1]

**Month 3 — Mastery (Days 61–90)**
[2-3 bullet points for embedding habits and measuring progress]

**Success Signals**
[2 concrete things others would notice if the plan is working]

Rules:
- Each bullet: one specific action, time estimate, and named resource
- Actions must be observable, not vague
- Do not use "leverage", "synergy", "paradigm"
- Tone: coaching, direct, encouraging`;

export type DevPlanInput = {
  userId: string;
  lowestCompetency: string;
  lowestEqDomain?: string;
  topOceanTrait?: string;
  role?: string;
};

function devPlanFallback(input: DevPlanInput): string {
  const comp = input.lowestCompetency;
  const eq = input.lowestEqDomain ? ` and ${input.lowestEqDomain} (EQ)` : "";
  return `**Month 1 — Foundation (Days 1–30)**\n- Identify 3 recent situations where ${comp} mattered most — write a one-line reflection on each (10 min/week)\n- Read chapters 1–3 of a recommended book on ${comp}; note one idea per chapter to experiment with\n- Ask your manager for one specific example of ${comp} in action on your team\n\n**Month 2 — Practice (Days 31–60)**\n- Run one deliberate experiment per week applying your Month 1 insight; log outcome (5 min/day)\n- Find a peer or mentor who is strong in ${comp}${eq}; schedule a 30-min conversation\n- Review feedback from your 360 or EQ results and update your experiment log\n\n**Month 3 — Mastery (Days 61–90)**\n- Teach one concept from ${comp} to a colleague — teaching is the best test of understanding\n- Request informal feedback from two people on whether they notice a difference\n- Write a 5-sentence reflection: what changed, what remains, what you will carry forward\n\n**Success Signals**\n- Colleagues proactively involve you in situations that require ${comp}\n- You can articulate two concrete examples of applying ${comp} effectively this quarter`;
}

export async function generateDevPlan(input: DevPlanInput): Promise<{
  planText: string;
  source: string;
  modelUsed?: string;
  generationTimeMs?: number;
}> {
  const cacheKey = generateCacheKey({ ...input, type: "dev-plan-v1" });

  const eqLine = input.lowestEqDomain ? `\nEQ growth area: ${input.lowestEqDomain}` : "";
  const oceanLine = input.topOceanTrait ? `\nTop personality trait: ${input.topOceanTrait}` : "";

  const prompt = `Create a 90-day development plan for a ${input.role ?? "professional"}.

Primary focus: ${input.lowestCompetency} (lowest competency from 360 feedback)${eqLine}${oceanLine}

Use the exact 4-section format specified. Make each action concrete, time-bounded, and include a named resource.`;

  const fallback = () => devPlanFallback(input);
  const result = await generateWithFallback(prompt, DEV_PLAN_SYSTEM_PROMPT, fallback, cacheKey, 500);

  return {
    planText: result.success && result.content.trim().length > 50 ? result.content : fallback(),
    source: result.source,
    modelUsed: result.modelUsed,
    generationTimeMs: result.generationTimeMs,
  };
}

// ─── Team Dynamics AI Narrative ────────────────────────────────────────────

const TEAM_DYNAMICS_SYSTEM_PROMPT = `You are an organizational psychologist writing team dynamics coaching notes for an HR leader.

Guidelines:
- Write 2-3 sentences per department
- Name the dominant personality pattern and what it means for collaboration
- Give one actionable facilitation tip the manager can use immediately
- Tone: Professional, evidence-informed, practical
- Do not make selection or clinical statements`;

export type TeamDynamicsInput = {
  department: string;
  n: number;
  avgOpenness: number;
  avgConscientiousness: number;
  avgExtraversion: number;
  avgAgreeableness: number;
  avgNeuroticism: number;
};

export async function generateTeamDynamicsNarrative(team: TeamDynamicsInput): Promise<string> {
  const cacheKey = generateCacheKey({ ...team, type: "team-dynamics-v1" });

  const fallback = () => {
    const { avgExtraversion: ex, avgAgreeableness: ag, avgConscientiousness: co, avgNeuroticism: neu } = team;
    if (ex >= 55 && ag >= 55) return `${team.department} tends toward energetic, harmonious collaboration — set clear decision rights to avoid endless consensus. Use structured brainstorms with assigned devil's advocates. (n=${team.n})`;
    if (co >= 55 && ex < 45) return `${team.department} is conscientious and quietly focused — they deliver reliably but may under-communicate. Schedule regular brief stand-ups to surface blockers early. (n=${team.n})`;
    if (neu >= 55) return `${team.department} shows higher stress sensitivity — predictable routines and clear expectations reduce friction. Debrief after high-pressure events to normalise reactions. (n=${team.n})`;
    return `${team.department} has a balanced profile across the Big Five — leverage this versatility by rotating facilitation roles to draw out quieter voices. (n=${team.n})`;
  };

  const prompt = `Write a 2-3 sentence team dynamics coaching note for the HR leader about this team.

Department: ${team.department} (n=${team.n})
Big Five averages (0–100 percentile scale):
- Openness: ${team.avgOpenness}
- Conscientiousness: ${team.avgConscientiousness}
- Extraversion: ${team.avgExtraversion}
- Agreeableness: ${team.avgAgreeableness}
- Neuroticism: ${team.avgNeuroticism}

Describe the dominant pattern, what it means for collaboration, and one facilitation tip.`;

  const result = await generateWithFallback(prompt, TEAM_DYNAMICS_SYSTEM_PROMPT, fallback, cacheKey, 160);

  return result.success && result.content.trim().length > 20 ? result.content : fallback();
}
