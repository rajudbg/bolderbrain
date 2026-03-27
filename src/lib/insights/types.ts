import type { InsightSeverity } from "@/generated/prisma/enums";

export type GeneratedInsight = {
  id: string;
  kind: "blind_spot" | "hidden_strength" | "development" | "rule";
  title: string;
  message: string;
  severity: InsightSeverity;
  competencyKey?: string;
  /** Higher = more important for ranking */
  weight: number;
};
