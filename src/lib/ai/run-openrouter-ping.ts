import { getOpenRouter, hasOpenRouterCredentials, PRIMARY_MODEL } from "@/lib/ai/openrouter";

export type OpenRouterPingResult = {
  ok: boolean;
  message: string;
  model?: string;
  latencyMs?: number;
  hasKey: boolean;
};

/**
 * Lightweight completion to verify OpenRouter credentials and network (no auth — call from server actions only).
 */
export async function runOpenRouterPing(): Promise<OpenRouterPingResult> {
  const hasKey = hasOpenRouterCredentials();
  if (!hasKey) {
    return {
      ok: false,
      hasKey: false,
      message:
        "OPENROUTER_API_KEY is not set. Add it to .env (see .env.example) and restart the dev server.",
    };
  }

  const start = Date.now();
  try {
    const openrouter = getOpenRouter();
    const completion = await openrouter.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      max_tokens: 16,
      temperature: 0,
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      hasKey: true,
      message: text ? `Model replied: "${text.slice(0, 200)}${text.length > 200 ? "…" : ""}"` : "Empty model response",
      model: completion.model ?? PRIMARY_MODEL,
      latencyMs,
    };
  } catch (e) {
    return {
      ok: false,
      hasKey: true,
      message: e instanceof Error ? e.message : "Unknown error",
      latencyMs: Date.now() - start,
    };
  }
}
