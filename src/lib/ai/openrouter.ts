import OpenAI from "openai";
import { resolveEffectiveModel } from "@/lib/platform-settings";

function requireOpenRouter(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  if (!apiKey?.trim()) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  return new OpenAI({
    baseURL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "BolderBrain",
    },
  });
}

let client: OpenAI | null = null;

/** Lazy OpenRouter client; throws if API key missing (caller should catch and fall back). */
export function getOpenRouter(): OpenAI {
  if (!client) {
    client = requireOpenRouter();
  }
  return client;
}

export function hasOpenRouterCredentials(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

let cachedModel: string | null = null;
let cachedModelAt = 0;
const MODEL_CACHE_TTL_MS = 30_000;

/**
 * Resolve the effective primary model from DB, env, or built-in default.
 * Caches for 30s to avoid DB round-trips on every AI call.
 */
export async function getPrimaryModel(): Promise<string> {
  const now = Date.now();
  if (cachedModel && now - cachedModelAt < MODEL_CACHE_TTL_MS) {
    return cachedModel;
  }
  cachedModel = await resolveEffectiveModel();
  cachedModelAt = now;
  return cachedModel;
}

/** Force-refresh the cached model (call after admin changes it). */
export function invalidateModelCache(): void {
  cachedModel = null;
  cachedModelAt = 0;
}

/** Legacy constant for imports that need a sync fallback (non-AI call sites). */
export const PRIMARY_MODEL = process.env.AI_PRIMARY_MODEL || "anthropic/claude-opus-4.7";

export type AIGenerationResult = {
  success: boolean;
  content: string;
  source: "AI_GENERATED" | "AI_NEMOTRON" | "RULE_BASED" | "CACHED";
  modelUsed?: string;
  error?: string;
  generationTimeMs: number;
};
