import { describe, expect, it } from "vitest";

import {
  formatAdminDate,
  formatAdminDateTime
} from "../src/core/i18n/date_time";

describe("admin date and time formatting", () => {
  it("formats dates for each supported locale", () => {
    const value = "2026-10-20T19:30:00.000Z";
    expect(formatAdminDate(value, "en")).toContain("2026");
    expect(formatAdminDate(value, "es")).toContain("2026");
    expect(formatAdminDate(value, "zh-Hans")).toContain("2026");
    expect(formatAdminDate(value, "zh-Hant")).toContain("2026");
  });

  it("includes time and preserves invalid source values", () => {
    expect(formatAdminDateTime("2026-10-20T19:30:00.000Z", "en")).toMatch(/2026/);
    expect(formatAdminDateTime("not-a-date", "en")).toBe("not-a-date");
  });
});
