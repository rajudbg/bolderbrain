import { generateWithFallback } from "@/lib/ai/resilient-generator";
import { requireAdminOrganizationId } from "@/lib/admin/context";

export type TrendPoint = { period: string; avgGap: number; criticalCount: number };

export type OrgGapStat = {
  competencyName: string;
  avgGap: number;
  peopleAffected: number;
  criticalShare: number;
};

/**
 * Suggest a detailed training intervention for a competency gap.
 * Returns structured recommendation with training type, delivery method, duration,
 * prerequisites, and suggested assessments.
 */
export async function aiRecommendProgram(competencyName: string, gap: number, roleHint: string): Promise<string> {
  await requireAdminOrganizationId();
  const severity = gap > 1.5 ? "critical" : gap > 0.8 ? "significant" : "moderate";
  
  const prompt = `As a senior L&D strategist, recommend a comprehensive training intervention for:

COMPETENCY: "${competencyName}"
GAP SEVERITY: ${gap.toFixed(2)} on 1-5 scale (${severity})
ROLE CONTEXT: ${roleHint || "general professional"}

Provide a structured recommendation including:

1. TRAINING PROGRAM (specific name/theme)
   - Program title (creative but professional)
   - Brief description (2-3 sentences on what it covers)

2. TRAINING TYPE
   - Behavioral competency workshop OR functional/skill-based training
   - Format: in-person, virtual, self-paced, or blended

3. DELIVERY & DURATION
   - Recommended duration (hours/days)
   - Delivery method
   - Suggested cohort size

4. PREREQUISITES (if any)
   - Required knowledge or experience

5. ASSESSMENT & MEASUREMENT
   - Pre-training: 360 assessment, EQ test, cognitive test, or knowledge check needed?
   - Post-training: How to measure improvement (practical exercise, follow-up 360, project, etc.)

6. FOLLOW-UP ACTIVITIES
   - Reinforcement methods (coaching, practice sessions, peer learning)

Format with clear headers. Be specific and actionable. Avoid generic advice.`,
    systemPrompt = `You are an expert L&D consultant with 20+ years experience designing corporate training programs. 
You specialize in behavioral competencies (leadership, communication, collaboration) and functional skills.
You understand when assessments are needed and how to measure training effectiveness.
Be thorough but concise. Use professional business language.`;
  
  const res = await generateWithFallback(
    prompt,
    systemPrompt,
    () => `TRAINING PROGRAM: ${competencyName} Development Workshop

This structured program addresses the ${severity} gap (${gap.toFixed(2)}) through practical skill-building and real-world application exercises.

TRAINING TYPE: ${gap > 1.0 ? "Behavioral competency intensive" : "Targeted skill workshop"}
Format: Blended (virtual sessions + self-paced modules)

DELIVERY & DURATION: 2 full days or 4 half-day sessions over 2 weeks
Cohort size: 8-12 participants for optimal interaction

PREREQUISITES: None required; suitable for all levels

ASSESSMENT & MEASUREMENT:
- Pre-training: ${gap > 1.2 ? "360-degree feedback assessment recommended" : "Self-assessment checklist"}
- Post-training: Practical application project + 30-day follow-up survey

FOLLOW-UP ACTIVITIES:
- Peer coaching circles (monthly, 3 months)
- Manager check-ins to reinforce learning
- Optional: Advanced module for high performers`,
    `tna:recommend:${competencyName}:${gap.toFixed(1)}`,
    800,
  );
  return res.content;
}

/**
 * Placeholder-friendly forecast: turns recent gap trends into short narrative (AI when keys exist).
 */
export async function predictTrainingNeeds(trendData: TrendPoint[]): Promise<string> {
  await requireAdminOrganizationId();
  if (trendData.length === 0) {
    return "No monthly competency snapshots in the last six months. Complete 360 or TNA assessments so scores are recorded, then run this again.";
  }
  const summary = trendData.map((t) => `${t.period}: avg gap ${t.avgGap.toFixed(2)}, critical ${t.criticalCount}`).join("\n");
  const prompt = `Trend lines for organizational skill gaps:\n${summary}\nIn 2–3 sentences, which competencies are likely to cross critical thresholds next?`;
  const res = await generateWithFallback(
    prompt,
    "You workforce-plan for L&D. Be cautious; this is indicative only.",
    () =>
      "Trend summary: monitor competencies where average gap and critical counts rise together quarter over quarter.",
    `tna:predict:${trendData.length}`,
    400,
  );
  return res.content;
}

/**
 * Strategic narrative for budget / program planning from aggregate gap stats.
 */
export async function analyzeOrganizationalGaps(stats: OrgGapStat[]): Promise<string> {
  await requireAdminOrganizationId();
  if (stats.length === 0) {
    return "No gap data yet. Run a TNA diagnostic or import competency targets.";
  }
  const top = [...stats].sort((a, b) => b.avgGap - a.avgGap).slice(0, 8);
  const lines = top.map(
    (s) =>
      `${s.competencyName}: avg gap ${s.avgGap.toFixed(2)}, ~${s.peopleAffected} people, ${Math.round(s.criticalShare * 100)}% critical-heavy`,
  );
  const prompt = `Organization competency gaps (sample):\n${lines.join("\n")}\nGive 3 concise L&D investment recommendations (budget allocation, not generic advice).`;
  const res = await generateWithFallback(
    prompt,
    "You advise CHROs on learning spend. Be direct.",
    () =>
      "Prioritize the largest avg-gap competencies with the widest headcount impact; fund cohort workshops before one-off seats.",
    `tna:org:${top.map((s) => s.competencyName).join(",")}`,
    500,
  );
  return res.content;
}
