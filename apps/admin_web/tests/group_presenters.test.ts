import { describe, expect, test } from "bun:test";

import {
  formatGroupDate,
  formatGroupDateTime
} from "../src/features/groups/group_presenters";

describe("group ministry presenters", () => {
  test("formats dates with the active locale", () => {
    expect(formatGroupDate("2026-07-13T12:00:00.000Z", "en-US")).toContain(
      "2026"
    );
    expect(
      formatGroupDateTime("2026-07-13T12:00:00.000Z", "zh-CN")
    ).toContain("2026");
  });

  test("keeps empty and invalid values safe for display", () => {
    expect(formatGroupDateTime(null, "en-US")).toBe("");
    expect(formatGroupDate("not-a-date", "en-US")).toBe("not-a-date");
  });
});
