import prisma from "@/lib/prisma";
import { generateCacheKey } from "./cache";
import { generateWithFallback } from "./resilient-generator";

const ACTION_SYSTEM_PROMPT = `You are an executive coach creating specific, achievable development actions.

Each action must:
- Take 15-30 minutes to complete this week
- Be observable (someone could see the person doing it)
- Include a specific resource: book chapter, video title, or exercise name
- Format: Title (5 words max) | Description (2 sentences) | Resource (specific, named)

Example:
"Practice the Pause | In your next 3 meetings, wait 3 seconds before responding. Notice how others engage differently. | Watch 'Conversational Turn-Taking' on LinkedIn Learning (Chapter 3, 8 min)."`;

export type ParsedSmartAction = {
  title: string;
  description: string;
  resource: string;
};

export function parseActions(content: string): ParsedSmartAction[] {
  return content
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const parts = block.split(" | ").map((p) => p.trim());
      return {
        title: parts[0] || "Development Action",
        description: parts[1] || "Practice this skill in your next team interaction.",
        resource: parts[2] || "Ask your manager for guidance.",
      };
    });
}

export async function generateSmartActions(
  profile: {
    userId: string;
    lowestCompetency: string;
    specificGap: string;
    role: string;
    tenure: string;
    organizationId: string;
  },
  count: number = 2,
): Promise<{ parsed: ParsedSmartAction[]; raw: string; source: string; error?: string }> {
  const cacheKey = generateCacheKey({ ...profile, count, type: "smart-actions" });

  const prompt = `Generate ${count} development actions for a ${profile.tenure} ${profile.role}.

Focus area: ${profile.lowestCompetency}
Specific gap: ${profile.specificGap}

Make each action concrete, time-bounded, and include a named resource.`;

  const fallback = async () => {
    const competency = await prisma.competency.findFirst({
      where: { organizationId: profile.organizationId, key: profile.lowestCompetency, isActive: true },
    });
    if (!competency) {
      return `${profile.lowestCompetency} focus | Review your latest feedback and pick one behavior to practice this week. | Ask your manager for a concrete example.`;
    }
    const actions = await prisma.action.findMany({
      where: { competencyId: competency.id, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: count,
    });
    if (actions.length === 0) {
      return `${profile.lowestCompetency} focus | Review your latest feedback and pick one behavior to practice this week. | Ask your manager for a concrete example.`;
    }
    return actions
      .map((a) => `${a.title} | ${a.description} | See internal competency resources for ${profile.lowestCompetency}`)
      .join("\n\n");
  };

  const result = await generateWithFallback(prompt, ACTION_SYSTEM_PROMPT, fallback, cacheKey, 300);

  const text =
    result.success && result.content.trim().length > 0
      ? result.content
      : await fallback();

  const parsed = parseActions(text);

  return {
    parsed,
    raw: text,
    source: result.source,
    error: result.error,
  };
}
