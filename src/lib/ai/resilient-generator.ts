import { getCache, setCache } from "./cache";
import { getOpenRouter, hasOpenRouterCredentials, PRIMARY_MODEL, type AIGenerationResult } from "./openrouter";
import { sleep } from "@/lib/utils";

function aiFallbackEnabled(): boolean {
  return process.env.AI_FALLBACK_ENABLED !== "false";
}

function shouldSkipAi(): boolean {
  return !hasOpenRouterCredentials();
}

export async function generateWithFallback(
  prompt: string,
  systemPrompt: string,
  fallbackGenerator: () => string | Promise<string>,
  cacheKey?: string,
  maxTokens: number = 400,
): Promise<AIGenerationResult> {
  const startTime = Date.now();

  if (cacheKey) {
    const cached = await getCache(cacheKey);
    if (cached) {
      return {
        success: true,
        content: cached,
        source: "CACHED",
        generationTimeMs: Date.now() - startTime,
      };
    }
  }

  if (shouldSkipAi()) {
    const fallbackContent = await Promise.resolve(fallbackGenerator());
    return {
      success: true,
      content: fallbackContent,
      source: "RULE_BASED",
      error: "AI_KEY_MISSING",
      generationTimeMs: Date.now() - startTime,
    };
  }

  const maxRetries = Math.max(1, parseInt(process.env.AI_MAX_RETRIES || "2", 10));
  const timeoutMs = Math.max(1000, parseInt(process.env.AI_TIMEOUT_MS || "10000", 10));

  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const openrouter = getOpenRouter();
      const completion = await openrouter.chat.completions.create(
        {
          model: PRIMARY_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: maxTokens,
        },
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      const content = completion.choices[0]?.message?.content?.trim();

      if (!content || content.length < 10) {
        throw new Error("Empty or invalid AI response");
      }

      if (cacheKey) {
        const ttlHours = Math.max(1, parseInt(process.env.AI_CACHE_TTL_HOURS || "720", 10));
        await setCache(cacheKey, content, ttlHours * 3600);
      }

      return {
        success: true,
        content,
        source: "AI_GENERATED",
        modelUsed: PRIMARY_MODEL,
        generationTimeMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`AI attempt ${i + 1} failed:`, msg);

      if (i < maxRetries - 1) {
        await sleep(1000 * (i + 1));
      }
    }
  }

  console.warn("AI failed after retries");

  if (aiFallbackEnabled()) {
    const fallbackContent = await Promise.resolve(fallbackGenerator());
    return {
      success: true,
      content: fallbackContent,
      source: "RULE_BASED",
      error: "AI_SERVICE_UNAVAILABLE",
      generationTimeMs: Date.now() - startTime,
    };
  }

  return {
    success: false,
    content: "",
    source: "RULE_BASED",
    error: "AI_SERVICE_UNAVAILABLE",
    generationTimeMs: Date.now() - startTime,
  };
}
