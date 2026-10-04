// Client-safe model catalogue. The server-side registry (lib/ai/registry.server.ts) maps these
// ids to provider SDK instances; the UI only ever sees ids, labels and prices.

export type ProviderId = "anthropic" | "openai" | "google" | "groq" | "openrouter";

export type ModelOption = {
  /** `provider:model` — stored in profiles.default_model and messages.model. */
  id: `${ProviderId}:${string}`;
  label: string;
  provider: ProviderId;
  /** USD per 1M tokens; omitted when we haven't verified the provider's price. */
  price?: { input: number; output: number };
  /** Short hint shown in the picker. */
  hint?: string;
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  groq: "Groq",
  openrouter: "OpenRouter",
};

export const MODELS: readonly ModelOption[] = [
  {
    id: "anthropic:claude-opus-5-5",
    label: "Claude Opus 5.5",
    provider: "anthropic",
    price: { input: 4, output: 20 },
    hint: "Best for planning",
  },
  {
    id: "anthropic:claude-sonnet-5-5",
    label: "Claude Sonnet 5.5",
    provider: "anthropic",
    price: { input: 2, output: 10 },
    hint: "Fast, everyday edits",
  },
  {
    id: "anthropic:claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    price: { input: 1, output: 5 },
    hint: "Cheapest",
  },
  { id: "openai:gpt-5.5", label: "GPT-5.5", provider: "openai" },
  { id: "openai:gpt-6-luna", label: "GPT-6 Luna", provider: "openai" },
  { id: "google:gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "google" },
  { id: "google:gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "google" },
  { id: "groq:openai/gpt-oss-120b", label: "GPT-OSS 120B", provider: "groq", hint: "Open weights, very fast" },
  { id: "groq:openai/gpt-oss-20b", label: "GPT-OSS 20B", provider: "groq", hint: "Fastest" },
  { id: "groq:qwen/qwen3.8-27b", label: "Qwen 3.8 27B", provider: "groq", hint: "Open weights" },
  {
    id: "openrouter:meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    provider: "openrouter",
    hint: "Open source",
  },
];

export const DEFAULT_MODEL_ID: ModelOption["id"] = "anthropic:claude-opus-5-5";

/** First model whose provider has a key, so the picker never defaults to something unusable. */
export function defaultModelFor(available: readonly ProviderId[]): ModelOption {
  return MODELS.find((m) => m.id === DEFAULT_MODEL_ID && available.includes(m.provider))
    ?? MODELS.find((m) => available.includes(m.provider))
    ?? MODELS[0];
}

export function findModel(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Cost in USD for a call, or null when the model's price isn't known. */
export function estimateCostUsd(
  model: ModelOption,
  usage: { inputTokens?: number; outputTokens?: number },
): number | null {
  if (!model.price) return null;
  const input = ((usage.inputTokens ?? 0) / 1_000_000) * model.price.input;
  const output = ((usage.outputTokens ?? 0) / 1_000_000) * model.price.output;
  return input + output;
}
