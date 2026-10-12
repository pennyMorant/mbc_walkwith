import { aiProviderRequestFailed } from "./ai-errors.js";
import {
  fetchAiProvider,
  parseAiProviderJson
} from "./ai-provider-fetch.js";
import { parseGeminiResponse } from "./ai_provider_response.js";
import type {
  AiGenerateTextInput,
  AiGenerateTextResult,
  AiProvider
} from "./ai.provider.js";

type GeminiAiProviderOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
};

export class GeminiAiProvider implements AiProvider {
  readonly id = "gemini";
  readonly enabled = true;
  readonly model: string;
  readonly maxOutputTokens: number;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: GeminiAiProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
    this.maxOutputTokens = options.maxOutputTokens;
  }

  async generateText(
    input: AiGenerateTextInput
  ): Promise<AiGenerateTextResult> {
    const startedAt = Date.now();
    const response = await fetchAiProvider(
      this.id,
      `${this.baseUrl}/models/${encodeURIComponent(
        this.model
      )}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.systemPrompt }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: input.userPrompt }]
            }
          ],
          generationConfig: {
            temperature: input.temperature ?? 0.2,
            maxOutputTokens: input.maxOutputTokens ?? this.maxOutputTokens
          }
        })
      },
      this.timeoutMs
    );

    if (!response.ok) {
      throw aiProviderRequestFailed(this.id, response.status);
    }

    const body = parseGeminiResponse(
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
