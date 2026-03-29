import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import prisma from "@/lib/prisma";
import { generateCacheKey } from "./cache";
import { generateSmartActions } from "./actions";
import { generateWithFallback } from "./resilient-generator";

const INSIGHT_SYSTEM_PROMPT = `You are a senior HR consultant writing 360 feedback insights. 

Guidelines:
- Write 2-3 sentences maximum
- First sentence: Observe the data pattern without judgment
- Second sentence: Explain why this matters for their growth  
- Third sentence (optional): One specific, actionable technique to try this week
- Tone: Empathetic but direct, supportive but honest
- Avoid: Corporate jargon, buzzwords, "leverage", "synergy"
- Use "you" not "the employee"

Example good insight:
"Your peers rated your Communication 3.1/5 while you rated yourself 4.5/5. This gap suggests others may experience you differently than you intend. Try asking 'What should I stop doing in meetings?' to surface blind spots."

Example bad insight:
"You should leverage your core competencies to maximize stakeholder alignment going forward."`;

export type Flat360Scores = {
  userId: string;
  assessmentId: string;
  self: number;
  peer: number;
  manager: number;
  overall: number;
  lowestCompetency: string;
  highestCompetency: string;
  gapSelfPeer: number;
  gapSelfManager: number;
};

export function flatten360Scores(
  userId: string,
  assessmentId: string,
  scores: Assessment360StoredResult,
): Flat360Scores {
  const rows = scores.byCompetency;
  const self = scores.summary.selfOverall;
  const overall = scores.summary.othersOverall;

  const peerVals = rows.map((r) => r.peerAvg).filter((x): x is number => x !== undefined && !Number.isNaN(x));
  const peer = peerVals.length ? peerVals.reduce((a, b) => a + b, 0) / peerVals.length : overall;

  const mgrVals = rows.map((r) => r.manager).filter((x): x is number => x !== undefined && !Number.isNaN(x));
  const manager = mgrVals.length ? mgrVals.reduce((a, b) => a + b, 0) / mgrVals.length : overall;

  const lowest = rows.reduce((a, b) => (a.othersAverage <= b.othersAverage ? a : b));
  const highest = rows.reduce((a, b) => (a.othersAverage >= b.othersAverage ? a : b));

  return {
    userId,
    assessmentId,
    self,
    peer,
    manager,
    overall,
    lowestCompetency: lowest.competencyKey,
    highestCompetency: highest.competencyKey,
    gapSelfPeer: self - peer,
    gapSelfManager: self - manager,
  };
}

function ruleBasedInsightText(scores: Flat360Scores): string {
  const gap = scores.gapSelfPeer;
  if (gap > 0.5) {
    return `You rated yourself ${scores.self.toFixed(1)}/5 overall, higher than your peers' average of ${scores.peer.toFixed(1)}/5. This suggests a blind spot in how you're perceived. Consider asking your manager for specific examples related to ${scores.lowestCompetency}.`;
  }
  if (gap < -0.3) {
    return `Your peers rated you ${scores.peer.toFixed(1)}/5 on average, higher than your self-rating of ${scores.self.toFixed(1)}. You may be underestimating your strengths, especially in ${scores.highestCompetency}.`;
  }
  return `Your self-assessment (${scores.self.toFixed(1)}) and peer feedback (${scores.peer.toFixed(1)}) are generally aligned. Continue developing your ${scores.lowestCompetency} skills.`;
}

export async function generate360Insight(scores: Flat360Scores) {
  const cacheKey = generateCacheKey({ ...scores, type: "360-insight" });

  const prompt = `Generate a personalized 360 feedback insight based on this data:

Self-rating (overall): ${scores.self}/5
Peer average: ${scores.peer}/5  
Manager average: ${scores.manager}/5
Others overall: ${scores.overall}/5
Lowest competency (by others): ${scores.lowestCompetency}
Highest competency (by others): ${scores.highestCompetency}
Self-peer gap: ${scores.gapSelfPeer > 0 ? "+" : ""}${scores.gapSelfPeer.toFixed(1)} (positive = you rated higher than peers on average)
Self-manager gap: ${scores.gapSelfManager > 0 ? "+" : ""}${scores.gapSelfManager.toFixed(1)}

Classify the pattern and write the insight.`;

  const fallback = () => ruleBasedInsightText(scores);

  const result = await generateWithFallback(prompt, INSIGHT_SYSTEM_PROMPT, fallback, cacheKey, 250);

  const finalText =
    result.success && result.content.trim().length > 0 ? result.content : fallback();

  const fromAi =
    result.success && (result.source === "AI_NEMOTRON" || result.source === "CACHED");

  return {
    finalText,
    aiGeneratedText: fromAi ? finalText : null,
    ruleBasedText: fromAi ? null : finalText,
    source: result.success ? result.source : "RULE_BASED",
    modelUsed: result.modelUsed,
    generationTimeMs: result.generationTimeMs,
    error: result.error,
  };
}

/**
 * After a 360 result is finalized: persist one AI insight row (upsert) and optional smart actions JSON.
 */
export async function generateAndPersist360AIInsight(input: {
  userId: string;
  assessmentId: string;
  organizationId: string;
  scores: Assessment360StoredResult;
}): Promise<void> {
  const flat = flatten360Scores(input.userId, input.assessmentId, input.scores);

  const insight = await generate360Insight(flat);

  const gapDesc = `Self vs others gap ${flat.gapSelfPeer.toFixed(2)} on ${flat.lowestCompetency}`;

  let smartActionsJson: { title: string; description: string; resource: string }[] | null = null;
  try {
    const smart = await generateSmartActions(
      {
        userId: input.userId,
        lowestCompetency: flat.lowestCompetency,
        specificGap: gapDesc,
        role: "professional",
        tenure: "experienced",
        organizationId: input.organizationId,
      },
      2,
    );
    smartActionsJson = smart.parsed;
  } catch (e) {
    console.warn("[ai] smart actions failed", e);
  }

  await prisma.aIInsight.upsert({
    where: {
      userId_assessmentId: {
        userId: input.userId,
        assessmentId: input.assessmentId,
      },
    },
    create: {
      userId: input.userId,
      assessmentId: input.assessmentId,
      assessmentType: "360",
      aiGeneratedText: insight.aiGeneratedText,
      ruleBasedText: insight.ruleBasedText,
      finalText: insight.finalText,
      source: insight.source,
      modelUsed: insight.modelUsed,
      generationTimeMs: insight.generationTimeMs,
      aiError: insight.error,
      smartActionsJson: smartActionsJson ?? undefined,
    },
    update: {
      aiGeneratedText: insight.aiGeneratedText,
      ruleBasedText: insight.ruleBasedText,
      finalText: insight.finalText,
      source: insight.source,
      modelUsed: insight.modelUsed,
      generationTimeMs: insight.generationTimeMs,
      aiError: insight.error,
      smartActionsJson: smartActionsJson ?? undefined,
    },
  });
}
