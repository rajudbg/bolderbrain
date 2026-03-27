/**
 * Strip dangerous HTML for stored rich text (defense in depth — still treat as untrusted in UI).
 */
export function sanitizeRichText(input: string): string {
  let s = input;
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/javascript:/gi, "");
  return s;
}

/** Recursively sanitize string leaves in JSON configs (prompts, labels, rationales). */
export function sanitizeJsonTextFields(input: unknown): unknown {
  if (typeof input === "string") return sanitizeRichText(input);
  if (Array.isArray(input)) return input.map(sanitizeJsonTextFields);
  if (input !== null && typeof input === "object") {
    const o = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) {
      out[k] = sanitizeJsonTextFields(o[k]);
    }
    return out;
  }
  return input;
}
