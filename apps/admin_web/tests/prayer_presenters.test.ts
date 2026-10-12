import { describe, expect, test } from "bun:test";

import {
  formatPrayerDateTime,
  prayerStatusColor,
  prayerVisibilityColor
} from "../src/features/prayer/prayer_presenters";

describe("prayer presenters", () => {
  test("maps moderation state to stable semantic colors", () => {
    expect(prayerStatusColor("approved")).toBe("success");
    expect(prayerStatusColor("hidden")).toBe("error");
    expect(prayerStatusColor("archived")).toBe("secondary");
    expect(prayerStatusColor("pending")).toBe("warning");
    expect(prayerVisibilityColor("private")).toBe("error");
    expect(prayerVisibilityColor("group")).toBe("primary");
  });

  test("formats canonical timestamps with the active locale", () => {
    expect(
      formatPrayerDateTime("2026-07-13T10:00:00.000Z", "en-US")
    ).toContain("2026");
    expect(formatPrayerDateTime("invalid", "en-US")).toBe("invalid");
  });
});
