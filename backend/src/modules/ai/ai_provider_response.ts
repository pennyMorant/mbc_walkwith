import type { AiUsage } from "@mbc/api-contracts";
import { z } from "zod";

import { aiProviderResponseInvalid } from "./ai-errors.js";

const usageCountSchema = z.number().int().nonnegative().optional();

const openAiResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().nullable() })
      })
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: usageCountSchema,
      completion_tokens: usageCountSchema,
      total_tokens: usageCountSchema
    })
    .optional()
});

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })).min(1)
        })
      })
    )
    .min(1),
  usageMetadata: z
    .object({
      promptTokenCount: usageCountSchema,
      candidatesTokenCount: usageCountSchema,
      totalTokenCount: usageCountSchema
    })
    .optional()
});

export type ParsedAiProviderResponse = {
  text: string;
  usage: AiUsage;
};

export function parseOpenAiResponse(
  provider: string,
  payload: unknown
): ParsedAiProviderResponse {
  const parsed = openAiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw aiProviderResponseInvalid(provider);
  }
  const text = parsed.data.choices[0]?.message.content?.trim();
  if (!text) {
    throw aiProviderResponseInvalid(provider);
  }
  return {
    text,
    usage: {
      inputTokens: parsed.data.usage?.prompt_tokens ?? null,
      outputTokens: parsed.data.usage?.completion_tokens ?? null,
      totalTokens: parsed.data.usage?.total_tokens ?? null
    }
  };
}

export function parseGeminiResponse(
  provider: string,
  payload: unknown
): ParsedAiProviderResponse {
  const parsed = geminiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw aiProviderResponseInvalid(provider);
  }
  const text = parsed.data.candidates[0]?.content.parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw aiProviderResponseInvalid(provider);
  }
  return {
    text,
    usage: {
      inputTokens: parsed.data.usageMetadata?.promptTokenCount ?? null,
      outputTokens: parsed.data.usageMetadata?.candidatesTokenCount ?? null,
      totalTokens: parsed.data.usageMetadata?.totalTokenCount ?? null
    }
  };
}
