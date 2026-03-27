/** Goleman EQ framework domain keys (stored on `Question.traitCategory`). */
export const EQ_DOMAIN_KEYS = [
  "SelfAwareness",
  "SelfRegulation",
  "Motivation",
  "Empathy",
  "SocialSkills",
] as const;

export type EqDomainKey = (typeof EQ_DOMAIN_KEYS)[number];

export function isEqDomainKey(s: string | null | undefined): s is EqDomainKey {
  return Boolean(s && (EQ_DOMAIN_KEYS as readonly string[]).includes(s));
}

export function domainDisplayName(key: string): string {
  const map: Record<string, string> = {
    SelfAwareness: "Self-Awareness",
    SelfRegulation: "Self-Regulation",
    Motivation: "Motivation",
    Empathy: "Empathy",
    SocialSkills: "Social Skills",
  };
  return map[key] ?? key;
}

export function domainSortIndex(trait: string | null | undefined): number {
  if (!trait) return 999;
  const i = EQ_DOMAIN_KEYS.indexOf(trait as EqDomainKey);
  return i === -1 ? 999 : i;
}
