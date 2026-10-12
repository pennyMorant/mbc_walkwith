import { describe, expect, test } from "bun:test";

describe("admin prayer localization", () => {
  test("defines complete moderation vocabulary for every locale", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();
    const blocks = [
      prayerBlock(source, "messages.en"),
      prayerBlock(source, 'messages["zh-Hans"]'),
      prayerBlock(source, "messages.es"),
      prayerBlock(source, 'messages["zh-Hant"]')
    ];

    for (const block of blocks) {
      for (const key of requiredKeys) {
        expect(block).toContain(`${JSON.stringify(key)}:`);
      }
    }

    expect(blocks[0]).toContain('"Prayer approved.": "Prayer approved."');
    expect(blocks[1]).toContain('"Save moderation details": "保存审核信息"');
    expect(blocks[2]).toContain('"Delete prayer request?"');
    expect(blocks[3]).toContain('"Prayer deleted.": "代禱請求已刪除。"');
  });
});

const requiredKeys = [
  "Delete prayer request?",
  "No prayer requests match the current filters.",
  "Prayer approved.",
  "Prayer archived.",
  "Prayer deleted.",
  "Prayer hidden.",
  "Prayer moderate access required",
  "Prayer moderation saved.",
  "Save moderation details",
  "This permanently removes the prayer request content.",
  "prayer.notifyAppOnApprove",
  "prayer.notifyAppOnApproveHint",
  "prayer.pageSubtitle",
  "prayer.sensitiveNotice"
] as const;

function prayerBlock(source: string, localeExpression: string) {
  const marker = `Object.assign(${localeExpression}, {\n  "Anonymous":`;
  const start = source.lastIndexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf("\n});", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}
