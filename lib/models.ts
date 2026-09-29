export type ProviderId = "anthropic" | "openai" | "google" | "openrouter";

export type ModelOption = {
  /** `provider:model` — the id stored in profiles.default_model and messages.model. */
  id: `${ProviderId}:${string}`;
  label: string;
  provider: ProviderId;
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  openrouter: "OpenRouter",
};

// Session 1: picker only. Session 2 wires these to the Vercel AI SDK provider registry and
// verifies the non-Anthropic ids against each provider's current model list.
export const MODELS: readonly ModelOption[] = [
  { id: "anthropic:claude-opus-5-5", label: "Claude Opus 5.5", provider: "anthropic" },
  { id: "anthropic:claude-sonnet-5-5", label: "Claude Sonnet 5.5", provider: "anthropic" },
  { id: "anthropic:claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic" },
  { id: "openai:gpt-5", label: "GPT-5", provider: "openai" },
  { id: "google:gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "google" },
  { id: "openrouter:meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", provider: "openrouter" },
];

export const DEFAULT_MODEL_ID: ModelOption["id"] = "anthropic:claude-opus-5-5";
