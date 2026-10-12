import { describe, expect, test } from "bun:test";

describe("admin serving localization", () => {
  test("defines the complete workspace vocabulary for every locale", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();

    const english = servingBlock(source, "messages.en");
    const simplified = servingBlock(source, 'messages["zh-Hans"]');
    const spanish = servingBlock(source, "messages.es");
    const traditional = servingBlock(source, 'messages["zh-Hant"]');

    for (const block of [english, simplified, spanish, traditional]) {
      for (const key of requiredKeys) {
        expect(block).toContain(`${JSON.stringify(key)}:`);
      }
    }

    expect(english).toContain('"Availability": "Availability"');
    expect(simplified).toContain('"Arrival status": "到岗状态"');
    expect(spanish).toContain('"Correction reason": "Motivo de corrección"');
    expect(traditional).toContain('"Save arrival status": "儲存到崗狀態"');
  });
});

const requiredKeys = [
  "A correction reason is required.",
  "Arrival status",
  "Arrival status saved.",
  "Arrival time",
  "Assignment",
  "Assignment created.",
  "Assignments",
  "Availability",
  "Availability saved.",
  "Correction reason",
  "Create assignment",
  "Create role",
  "Create team",
  "Manage teams, roles, assignments, availability, and arrival status.",
  "Member",
  "No arrival records match the current filters.",
  "No assignments match the current filters.",
  "No availability records match the current filters.",
  "Save arrival status",
  "Serving assignment time is invalid.",
  "Serving availability time is invalid.",
  "Serving manage access required",
  "Serving schedule",
  "checked_in",
  "missed",
  "preferred",
  "unavailable"
] as const;

function servingBlock(source: string, localeExpression: string) {
  const marker = `Object.assign(${localeExpression}, {\n  "A correction reason is required."`;
  const start = source.lastIndexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf("\n});", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}
