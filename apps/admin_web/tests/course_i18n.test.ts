import { describe, expect, test } from "bun:test";

describe("admin course localization", () => {
  test("defines complete course workflow overrides for all locales", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();

    expect(courseBlock(source, "messages.en")).toContain(
      '"Search enrollments": "Search enrollments"'
    );
    expect(courseBlock(source, 'messages["zh-Hans"]')).toContain(
      '"No lessons yet.": "还没有课次。"'
    );
    expect(courseBlock(source, "messages.es")).toContain(
      '"Course manage access required": "Se requiere permiso para gestionar cursos"'
    );
    expect(courseBlock(source, 'messages["zh-Hant"]')).toContain(
      '"Waitlist": "加入候補"'
    );
  });
});

function courseBlock(source: string, localeExpression: string) {
  const marker = `Object.assign(${localeExpression}, {\n  "Add"`;
  const start = source.lastIndexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf("\n});", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}
