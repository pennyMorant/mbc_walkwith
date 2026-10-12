import type { AppConfig } from "../../config/env.js";
import { DisabledAiProvider, MisconfiguredAiProvider } from "./disabled-ai.provider.js";
import { GeminiAiProvider } from "./gemini-ai.provider.js";
import { OpenAiCompatibleAiProvider } from "./openai-compatible-ai.provider.js";
import type { AiProvider } from "./ai.provider.js";

export function createAiProvider(config: AppConfig): AiProvider {
  if (config.aiProvider === "disabled") {
    return new DisabledAiProvider();
  }

  const model = config.aiModel ?? defaultModel(config.aiProvider);
  if (!config.aiApiKey) {
    return new MisconfiguredAiProvider(
      config.aiProvider,
      model,
      "missing_api_key"
    );
  }
  if (!Number.isInteger(config.aiTimeoutMs) || config.aiTimeoutMs <= 0) {
    return new MisconfiguredAiProvider(
      config.aiProvider,
      model,
      "invalid_timeout_ms"
    );
  }
  if (
    !Number.isInteger(config.aiMaxOutputTokens) ||
    config.aiMaxOutputTokens <= 0
  ) {
    return new MisconfiguredAiProvider(
      config.aiProvider,
      model,
      "invalid_max_output_tokens"
    );
  }

  if (config.aiProvider === "gemini") {
    return new GeminiAiProvider({
      apiKey: config.aiApiKey,
      baseUrl:
        config.aiBaseUrl ?? "https://generativelanguage.googleapis.com/v1beta",
      model,
      timeoutMs: config.aiTimeoutMs,
      maxOutputTokens: config.aiMaxOutputTokens
    });
  }

  if (config.aiProvider === "openai_compatible" && !config.aiBaseUrl) {
    return new MisconfiguredAiProvider(
      config.aiProvider,
      model,
      "missing_base_url"
    );
  }

  return new OpenAiCompatibleAiProvider({
    id: config.aiProvider,
    apiKey: config.aiApiKey,
    baseUrl: config.aiBaseUrl ?? "https://api.openai.com/v1",
    model,
    timeoutMs: config.aiTimeoutMs,
    maxOutputTokens: config.aiMaxOutputTokens,
    extraHeaders: config.aiExtraHeaders
  });
}

function defaultModel(provider: AppConfig["aiProvider"]): string {
  if (provider === "gemini") {
    return "gemini-1.5-flash";
  }
  return "gpt-4o-mini";
}
