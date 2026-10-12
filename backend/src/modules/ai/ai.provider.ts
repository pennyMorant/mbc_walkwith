import type { AiProviderId, AiUsage } from "@mbc/api-contracts";

export type AiGenerateTextInput = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type AiGenerateTextResult = {
  text: string;
  usage: AiUsage;
  latencyMs: number;
  provider?: AiProviderId;
  model?: string | null;
};

export interface AiProvider {
  readonly id: AiProviderId;
  readonly enabled: boolean;
  readonly model: string | null;
  readonly maxOutputTokens?: number;
  generateText(input: AiGenerateTextInput): Promise<AiGenerateTextResult>;
}
