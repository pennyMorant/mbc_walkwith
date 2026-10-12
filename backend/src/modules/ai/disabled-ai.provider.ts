import { aiProviderDisabled, aiProviderMisconfigured } from "./ai-errors.js";
import type { AiGenerateTextInput, AiGenerateTextResult, AiProvider } from "./ai.provider.js";
import type { AiProviderId } from "@mbc/api-contracts";

export class DisabledAiProvider implements AiProvider {
  readonly id = "disabled";
  readonly enabled = false;
  readonly model = null;

  async generateText(_input: AiGenerateTextInput): Promise<AiGenerateTextResult> {
    throw aiProviderDisabled();
  }
}

export class MisconfiguredAiProvider implements AiProvider {
  readonly enabled = false;

  constructor(
    readonly id: AiProviderId,
    readonly model: string | null,
    private readonly reason: string
  ) {}

  async generateText(_input: AiGenerateTextInput): Promise<AiGenerateTextResult> {
    throw aiProviderMisconfigured(this.reason);
  }
}
