import type { AiGenerateTextInput, AiGenerateTextResult, AiProvider } from "./ai.provider.js";
import { isAppError } from "../../shared/http/app-error.js";

export class FallbackAiProvider implements AiProvider {
  readonly id: AiProvider["id"];
  readonly enabled: boolean;
  readonly model: string | null;
  readonly maxOutputTokens: number;
  constructor(private readonly primary: AiProvider, private readonly fallback: AiProvider | null) {
    this.id = primary.id;
    this.enabled = primary.enabled;
    this.model = primary.model;
    this.maxOutputTokens = primary.maxOutputTokens ?? 1200;
  }
  async generateText(input: AiGenerateTextInput): Promise<AiGenerateTextResult> {
    try { return await this.primary.generateText(input); }
    catch (error) {
      if (!isAppError(error) || !error.retryable || !this.fallback?.enabled) throw error;
      return this.fallback.generateText(input);
    }
  }
}
