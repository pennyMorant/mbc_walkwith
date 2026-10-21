import { describe, expect, test } from "bun:test";

import { formatAiUsageTimestamp } from "../src/features/ai/ai_management_presenters";

describe("AI management presenters", () => {
  test("formats usage timestamps for the active locale", () => {
    const result = formatAiUsageTimestamp("2026-10-20T18:30:00.000Z", "en-US");
    expect(result).toContain("2026");
    expect(result).toContain("Oct");
  });

  test("preserves invalid timestamps for diagnosis", () => {
    expect(formatAiUsageTimestamp("invalid", "en-US")).toBe("invalid");
  });
});
