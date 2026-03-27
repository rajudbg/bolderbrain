/** Big Five / OCEAN trait keys stored on statements and `Question.traitCategory` (semantic items). */
export const OCEAN_TRAITS = [
  "Openness",
  "Conscientiousness",
  "Extraversion",
  "Agreeableness",
  "Neuroticism",
] as const;

export type OceanTrait = (typeof OCEAN_TRAITS)[number];

export function isOceanTrait(s: string | null | undefined): s is OceanTrait {
  return Boolean(s && (OCEAN_TRAITS as readonly string[]).includes(s));
}

export function oceanDisplayName(t: string): string {
  const m: Record<string, string> = {
    Openness: "Openness",
    Conscientiousness: "Conscientiousness",
    Extraversion: "Extraversion",
    Agreeableness: "Agreeableness",
    Neuroticism: "Neuroticism (higher = more stress reactivity)",
  };
  return m[t] ?? t;
}
