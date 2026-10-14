import { describe, expect, test } from "bun:test";

import {
  cloneLandingSettingValue,
  createLandingItemId,
  isPublicLandingStructuredSetting,
  publicLandingStructuredSection
} from "../src/features/settings/public_landing_editor";

describe("public landing structured editor", () => {
  test("recognizes base and localized structured settings", () => {
    expect(publicLandingStructuredSection("publicLanding.schedule")).toBe(
      "schedule"
    );
    expect(publicLandingStructuredSection("publicLanding.es.people")).toBe(
      "people"
    );
    expect(publicLandingStructuredSection("publicLanding.zh-Hant.events")).toBe(
      "events"
    );
  });

  test("keeps unrelated settings in the advanced JSON editor", () => {
    expect(isPublicLandingStructuredSetting("publicLanding.contact")).toBe(
      false
    );
    expect(isPublicLandingStructuredSetting("other.schedule")).toBe(false);
    expect(isPublicLandingStructuredSetting("church.identity")).toBe(false);
  });

  test("copies JSON setting values without retaining nested references", () => {
    const source = { title: "Schedule", items: [{ title: "Sunday" }] };
    const copy = cloneLandingSettingValue(source);

    copy.items[0]!.title = "Updated";

    expect(source.items[0]!.title).toBe("Sunday");
    expect(copy.items[0]!.title).toBe("Updated");
  });

  test("creates prefixed unique item identifiers", () => {
    const first = createLandingItemId("schedule");
    const second = createLandingItemId("schedule");

    expect(first.startsWith("schedule-")).toBe(true);
    expect(second.startsWith("schedule-")).toBe(true);
    expect(first).not.toBe(second);
  });
});
