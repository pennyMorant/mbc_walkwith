import {
  sermonDiscussionGuideCreateRequestSchema,
  sermonDiscussionResponseCreateRequestSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

describe("sermon discussion guide contract", () => {
  it.each([
    [
      "question",
      {
        questions: [question("duplicate"), question("duplicate")]
      }
    ],
    [
      "action step",
      {
        actionSteps: [actionStep("duplicate"), actionStep("duplicate")]
      }
    ]
  ])("rejects duplicate %s ids", (_label, content) => {
    const result = sermonDiscussionGuideCreateRequestSchema.safeParse({
      sermonId: "sermon-1",
      title: "Guide",
      ...content
    });

    expect(result.success).toBe(false);
  });

  it.each([
    ["questions", Array.from({ length: 51 }, (_, index) => question(`q-${index}`))],
    [
      "actionSteps",
      Array.from({ length: 51 }, (_, index) => actionStep(`a-${index}`))
    ],
    [
      "prayerPrompts",
      Array.from({ length: 51 }, (_, index) => `Prayer ${index}`)
    ]
  ])("limits %s to 50 items", (field, items) => {
    const result = sermonDiscussionGuideCreateRequestSchema.safeParse({
      sermonId: "sermon-1",
      title: "Guide",
      [field]: items
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty response question id", () => {
    const result = sermonDiscussionResponseCreateRequestSchema.safeParse({
      questionId: " ",
      content: "A private response."
    });

    expect(result.success).toBe(false);
  });
});

function question(id: string) {
  return {
    id,
    type: "application" as const,
    prompt: "What will you practice?",
    sortOrder: 1
  };
}

function actionStep(id: string) {
  return {
    id,
    title: "Take one step",
    description: "",
    sortOrder: 1
  };
}
