import OpenAI from "openai";

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

export const PRIMARY_MODEL =
  process.env.AI_PRIMARY_MODEL || "deepseek/deepseek-chat-v3-5:free";

export type AIGenerationResult = {
  success: boolean;
  content: string;
  source: "AI_GENERATED" | "AI_NEMOTRON" | "RULE_BASED" | "CACHED";
  modelUsed?: string;
  error?: string;
  generationTimeMs: number;
};
