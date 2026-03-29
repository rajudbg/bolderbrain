import type { GapSeverity } from "@/generated/prisma/enums";

/** gap = targetScore - currentScore (positive = below target). */
export function gapSeverityFromGap(gap: number): GapSeverity {
  if (gap < 0) return "EXCEEDS";
  if (gap <= 0.5) return "MET";
  if (gap <= 1.5) return "HIGH";
  return "CRITICAL";
}

export function priorityFromGap(gap: number): number {
  return Math.round(Math.max(0, gap) * 100);
}
