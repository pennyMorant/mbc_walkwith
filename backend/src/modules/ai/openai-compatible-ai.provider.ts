import type { AiProviderId } from "@mbc/api-contracts";

import { aiProviderRequestFailed } from "./ai-errors.js";
import {
  fetchAiProvider,
  parseAiProviderJson
} from "./ai-provider-fetch.js";
import { parseOpenAiResponse } from "./ai_provider_response.js";
import type {
  AiGenerateTextInput,
  AiGenerateTextResult,
  AiProvider
} from "./ai.provider.js";

type OpenAiCompatibleProviderOptions = {
  id: Extract<AiProviderId, "openai" | "openai_compatible">;
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  extraHeaders?: Record<string, string>;
};

export class OpenAiCompatibleAiProvider implements AiProvider {
  readonly id: OpenAiCompatibleProviderOptions["id"];
  readonly enabled = true;
  readonly model: string;
  readonly maxOutputTokens: number;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly extraHeaders: Record<string, string>;

  constructor(options: OpenAiCompatibleProviderOptions) {
    this.id = options.id;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
    this.maxOutputTokens = options.maxOutputTokens;
    this.extraHeaders = options.extraHeaders ?? {};
  }

  async generateText(
    input: AiGenerateTextInput
  ): Promise<AiGenerateTextResult> {
    const startedAt = Date.now();
    const response = await fetchAiProvider(
      this.id,
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
          ...this.extraHeaders
        },
        body: JSON.stringify({
          model: this.model,
          temperature: input.temperature ?? 0.2,
          max_tokens: input.maxOutputTokens ?? this.maxOutputTokens,
          messages: [
            { role: "system", content: input.systemPrompt },
            { role: "user", content: input.userPrompt }
          ]
        })
      },
      this.timeoutMs
    );

    if (!response.ok) {
      throw aiProviderRequestFailed(this.id, response.status);
    }

    const body = parseOpenAiResponse(
      this.id,
      await parseAiProviderJson<unknown>(this.id, response)
    );

    return {
      text: body.text,
      usage: body.usage,
      latencyMs: Date.now() - startedAt,
      provider: this.id,
      model: this.model
    };
  }
}
