import prisma from "@/lib/prisma";

function calculateSatisfaction(rows: { userRating: number | null; _count: number }[]): number | null {
  let weighted = 0;
  let n = 0;
  for (const r of rows) {
    if (r.userRating == null) continue;
    weighted += r.userRating * r._count;
    n += r._count;
  }
  if (n === 0) return null;
  return weighted / n;
}

export type AIMetrics = {
  totalInsights: number;
  aiSuccessRate: number;
  fallbackRate: number;
  cacheHitRate: number;
  averageLatencyMs: number;
  userSatisfaction: number | null;
  costPerInsight: string;
};

export async function getAIMetrics(): Promise<AIMetrics> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalInsights, aiSuccess, ruleFallback, cachedCount, avgGenerationTime, userRatings] =
    await Promise.all([
      prisma.aIInsight.count({ where: { createdAt: { gte: last24h } } }),
      prisma.aIInsight.count({ where: { createdAt: { gte: last24h }, source: "AI_NEMOTRON" } }),
      prisma.aIInsight.count({ where: { createdAt: { gte: last24h }, source: "RULE_BASED" } }),
      prisma.aIInsight.count({ where: { createdAt: { gte: last24h }, source: "CACHED" } }),
      prisma.aIInsight.aggregate({
        where: { createdAt: { gte: last24h } },
        _avg: { generationTimeMs: true },
      }),
      prisma.aIInsight.groupBy({
        by: ["userRating"],
        where: { createdAt: { gte: last24h }, userRating: { not: null } },
        _count: true,
      }),
    ]);

  const avgMs = avgGenerationTime._avg.generationTimeMs;

  return {
    totalInsights,
    aiSuccessRate: totalInsights > 0 ? ((aiSuccess + cachedCount) / totalInsights) * 100 : 0,
    fallbackRate: totalInsights > 0 ? (ruleFallback / totalInsights) * 100 : 0,
    cacheHitRate: totalInsights > 0 ? (cachedCount / totalInsights) * 100 : 0,
    averageLatencyMs: Math.round(avgMs ?? 0),
    userSatisfaction: calculateSatisfaction(userRatings),
    costPerInsight: "$0.00",
  };
}

export function healthStatusFromMetrics(m: AIMetrics): "green" | "yellow" | "red" {
  if (m.totalInsights === 0) return "yellow";

  const aiRate = m.aiSuccessRate;
  const lat = m.averageLatencyMs;
  const fb = m.fallbackRate;

  if (aiRate >= 90 && lat < 3000 && fb < 30) return "green";
  if (aiRate < 70 || fb > 30) return "red";
  if ((aiRate >= 70 && aiRate < 90) || (lat >= 3000 && lat <= 5000)) return "yellow";
  return "yellow";
}
