/** `AssessmentTemplate.config` for PSYCHOMETRIC templates. */
export type PsychometricTemplateConfig = {
  itemsPerPage?: number;
  retakeCooldownMonths?: number;
  /** Ideal trait profiles 0–1 for role-fit (optional). */
  roleProfiles?: Record<string, Partial<Record<string, number>>>;
};

export function parsePsychometricTemplateConfig(raw: unknown): {
  itemsPerPage: number;
  retakeCooldownMonths: number;
  roleProfiles: Record<string, Partial<Record<string, number>>>;
} {
  const o = (raw && typeof raw === "object" ? raw : {}) as PsychometricTemplateConfig;
  return {
    itemsPerPage:
      typeof o.itemsPerPage === "number" && o.itemsPerPage > 0 ? Math.floor(o.itemsPerPage) : 5,
    retakeCooldownMonths:
      typeof o.retakeCooldownMonths === "number" && o.retakeCooldownMonths >= 0
        ? Math.floor(o.retakeCooldownMonths)
        : 12,
    roleProfiles:
      o.roleProfiles && typeof o.roleProfiles === "object" ? o.roleProfiles : {},
  };
}
