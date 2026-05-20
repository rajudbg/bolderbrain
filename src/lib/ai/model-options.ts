export const OPENROUTER_MODEL_OPTIONS = [
  { value: "anthropic/claude-opus-4.7", label: "Anthropic Claude Opus 4.7" },
  { value: "anthropic/claude-sonnet-4.6", label: "Anthropic Claude Sonnet 4.6" },
  { value: "anthropic/claude-haiku-4.5", label: "Anthropic Claude Haiku 4.5" },
  { value: "~anthropic/claude-opus-latest", label: "Anthropic Claude Opus (latest auto)" },
  { value: "~anthropic/claude-sonnet-latest", label: "Anthropic Claude Sonnet (latest auto)" },
  { value: "openai/gpt-5.5-pro", label: "OpenAI GPT-5.5 Pro" },
  { value: "openai/gpt-5.5", label: "OpenAI GPT-5.5" },
  { value: "openai/gpt-5.4", label: "OpenAI GPT-5.4" },
  { value: "openai/gpt-4o", label: "OpenAI GPT-4o" },
  { value: "openai/o4-mini-deep-research", label: "OpenAI o4 Mini Deep Research" },
  { value: "google/gemini-3.5-flash", label: "Google Gemini 3.5 Flash" },
  { value: "~google/gemini-pro-latest", label: "Google Gemini Pro (latest auto)" },
  { value: "~google/gemini-flash-latest", label: "Google Gemini Flash (latest auto)" },
  { value: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { value: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2" },
  { value: "mistralai/mistral-medium-3-5", label: "Mistral Medium 3.5" },
  { value: "qwen/qwen3.6-plus", label: "Qwen 3.6 Plus" },
  { value: "perplexity/sonar-pro-search", label: "Perplexity Sonar Pro Search" },
] as const;

export function modelDisplayName(modelId: string): string {
  const match = OPENROUTER_MODEL_OPTIONS.find((m) => m.value === modelId);
  return match?.label ?? modelId.split("/").pop() ?? modelId;
}
