import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

import { llmEnv } from "@/lib/env.server";
import { findModel, PROVIDER_LABELS, type ModelOption, type ProviderId } from "@/lib/models";

/**
 * Model gateway (prototype): one place that turns a `provider:model` id into an AI SDK model.
 * Keys never leave the server. In production this grows into the gateway described in
 * ARCHITECTURE.md (capability matrix, per-step routing, fallbacks, BYOK, metering).
 */

export class ModelUnavailableError extends Error {
  constructor(
    message: string,
    readonly code: "unknown_model" | "missing_key",
  ) {
    super(message);
  }
}

const KEY_FOR: Record<ProviderId, keyof ReturnType<typeof llmEnv>> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

/** Which providers have a key configured (drives the model picker's enabled state). */
export function availableProviders(): ProviderId[] {
  const env = llmEnv();
  return (Object.keys(KEY_FOR) as ProviderId[]).filter((p) => Boolean(env[KEY_FOR[p]]));
}

export function resolveModel(modelId: string): { model: LanguageModel; option: ModelOption } {
  const option = findModel(modelId);
  if (!option) throw new ModelUnavailableError(`Unknown model "${modelId}".`, "unknown_model");

  const env = llmEnv();
  const apiKey = env[KEY_FOR[option.provider]];
  if (typeof apiKey !== "string" || !apiKey) {
    throw new ModelUnavailableError(
      `No API key configured for ${PROVIDER_LABELS[option.provider]} (${KEY_FOR[option.provider]}).`,
      "missing_key",
    );
  }

  const modelName = option.id.slice(option.provider.length + 1);
  switch (option.provider) {
    case "anthropic":
      return { model: createAnthropic({ apiKey })(modelName), option };
    case "openai":
      return { model: createOpenAI({ apiKey })(modelName), option };
    case "google":
      return { model: createGoogleGenerativeAI({ apiKey })(modelName), option };
    case "groq":
      return { model: createGroq({ apiKey })(modelName), option };
    case "openrouter":
      return { model: createOpenRouter({ apiKey }).chat(modelName), option };
  }
}
