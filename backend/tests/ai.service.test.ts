import { describe, expect, it } from "vitest";

import { AiService } from "../src/modules/ai/ai.service.js";
import type {
  AiGenerateTextInput,
  AiGenerateTextResult,
  AiProvider
} from "../src/modules/ai/ai.provider.js";

class FakeAiProvider implements AiProvider {
  readonly id = "openai";
  readonly enabled = true;
  readonly model = "test-model";
  lastInput: AiGenerateTextInput | null = null;

  async generateText(
    input: AiGenerateTextInput
  ): Promise<AiGenerateTextResult> {
    this.lastInput = input;
    return {
      text: "## Draft\n\nGenerated content.",
      usage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15
      },
      latencyMs: 12
    };
  }
}

describe("AiService", () => {
  it("builds church-safe admin draft prompts through the provider", async () => {
    const provider = new FakeAiProvider();
    const service = new AiService(provider, {
      auditEnabled: true,
      maxOutputTokens: 800
    });

    const result = await service.createAdminDraft({
      task: "sermon_summary",
      locale: "zh-Hans",
      input: {
        title: "主日讲道",
        body: "罗马书 8:28 的讲道内容",
        context: [{ label: "Speaker", value: "Pastor John" }]
      }
    });

    expect(result).toMatchObject({
      task: "sermon_summary",
      markdown: "## Draft\n\nGenerated content.",
      provider: "openai",
      model: "test-model",
      latencyMs: 12
    });
    expect(provider.lastInput).toMatchObject({
      temperature: 0.5,
      maxOutputTokens: 800
    });
    expect(provider.lastInput?.systemPrompt).toContain(
      "Respond in Simplified Chinese"
    );
    expect(provider.lastInput?.userPrompt).toContain("Title: 主日讲道");
    expect(provider.lastInput?.userPrompt).toContain("Body:");
  });

  it("rejects empty AI tasks before provider calls", async () => {
    const provider = new FakeAiProvider();
    const service = new AiService(provider, {
      auditEnabled: true,
      maxOutputTokens: 800
    });

    await expect(
      service.createAdminDraft({
        task: "sermon_summary",
        locale: "en",
        input: {
          context: []
        }
      })
    ).rejects.toMatchObject({
      code: "ai_task_input_required",
      statusCode: 400,
      sourceLayer: "feature"
    });
    expect(provider.lastInput).toBeNull();
  });

  it("returns the member safety notice in the requested locale", async () => {
    const service = new AiService(new FakeAiProvider(), {
      auditEnabled: true,
      maxOutputTokens: 800
    });

    const result = await service.createMemberStudy({
      task: "bible_study_help",
      locale: "zh-Hant",
      input: {
        reference: "羅馬書 8:28",
        question: "這節經文是什麼意思？",
        context: []
      },
      resource: {
        resourceType: "bible_passage",
        resourceId: "rom.8.28"
      }
    });

    expect(result.safetyNotice).toContain("AI 學習輔助");
    expect(result.safetyNotice).toContain("牧養關懷");
  });

  it("uses deterministic admin formats without inventing outline timing", async () => {
    const provider = new FakeAiProvider();
    const service = new AiService(provider, {
      auditEnabled: true,
      maxOutputTokens: 800
    });

    await service.createAdminDraft({
      task: "notification_draft",
      locale: "es",
      input: {
        title: "Servicio dominical",
        body: "El servicio comienza a las diez.",
        context: []
      }
    });
    expect(provider.lastInput?.systemPrompt).toContain(
      "exactly two lines"
    );
    expect(provider.lastInput?.systemPrompt).toContain("'Title:' and 'Body:'");

    await service.createAdminDraft({
      task: "sermon_outline",
      locale: "en",
      input: {
        body: "Reviewed sermon manuscript.",
        context: []
      }
    });
    expect(provider.lastInput?.systemPrompt).toContain("'- Title: summary'");
    expect(provider.lastInput?.systemPrompt).toContain(
      "Do not invent timestamps"
    );
  });
});
