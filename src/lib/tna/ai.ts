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
 * Suggest a training template or program focus for a single gap (used from admin TNA UI).
 */
export async function aiRecommendProgram(competencyName: string, gap: number, roleHint: string): Promise<string> {
  await requireAdminOrganizationId();
  const prompt = `Competency: "${competencyName}". Gap below target: ${gap.toFixed(2)} on a typical 1–5 scale. Role context: ${roleHint || "general"}.
Recommend one concrete training intervention (workshop title or module theme) in under 280 characters. No bullet list.`;
  const res = await generateWithFallback(
    prompt,
    "You are a senior L&D strategist. Be specific and practical.",
    () => `Recommended focus: ${competencyName} — structured practice and feedback (gap ${gap.toFixed(2)}).`,
    `tna:recommend:${competencyName}:${gap.toFixed(1)}`,
    320,
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
