import { describe, expect, test } from "bun:test";

describe("admin event registration localization", () => {
  test("defines the complete registration workspace in every locale", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();

    for (const localeExpression of [
      "messages.en",
      'messages["zh-Hans"]',
      "messages.es",
      'messages["zh-Hant"]'
    ]) {
      const block = registrationBlock(source, localeExpression);
      for (const key of requiredKeys) {
        expect(block).toContain(`${JSON.stringify(key)}:`);
      }
    }
  });
});

const requiredKeys = [
  "Absent",
  "Add registration",
  "Allow cancellation",
  "Change registration status",
  "Confirm this registration status change.",
  "Edit registration",
  "Enable registration",
  "Event registration settings",
  "Event registrations",
  "Event registrations exported.",
  "Max party size",
  "No registrations match the current filters.",
  "Not checked in",
  "Party size",
  "Registered",
  "Registration",
  "Registration deadline",
  "Registration added.",
  "Registration status updated.",
  "Registration updated.",
  "Registrations",
  "life.queueSubtitle",
  "life.queueTitle",
  "absent",
  "admin_manual",
  "cancelled",
  "checked_in",
  "confirmed",
  "member_self"
] as const;

function registrationBlock(source: string, localeExpression: string) {
  const marker = `Object.assign(${localeExpression}, {\n  "Absent":`;
  const start = source.indexOf(marker, source.indexOf('"onsite_qr"'));
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf("\n});", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}
