import { describe, expect, test } from "bun:test";

describe("admin group ministry localization", () => {
  test("defines complete workspace overrides for all locales", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();

    const english = groupBlock(source, "messages.en");
    const simplified = groupBlock(source, 'messages["zh-Hans"]');
    const spanish = groupBlock(source, "messages.es");
    const traditional = groupBlock(source, 'messages["zh-Hant"]');

    for (const block of [english, simplified, spanish, traditional]) {
      for (const key of requiredWorkspaceKeys) {
        expect(block).toContain(`${JSON.stringify(key)}:`);
      }
    }

    expect(english).toContain('"Group workspace": "Group workspace"');
    expect(english).toContain('"sermon_discussion_guide"');
    expect(simplified).toContain('"Materials": "材料"');
    expect(simplified).toContain('"Attendance saved.": "出席记录已保存。"');
    expect(spanish).toContain('"Search members": "Buscar miembros"');
    expect(spanish).toContain('"needs_follow_up": "Requiere seguimiento"');
    expect(traditional).toContain('"Group saved.": "小組資料已儲存。"');
    expect(traditional).toContain('"Meeting date": "聚會日期"');
  });
});

const requiredWorkspaceKeys = [
  "Applications",
  "Attendance",
  "Approve",
  "Assign",
  "Capacity",
  "Decline",
  "Edit group",
  "Group manage access required",
  "Group workspace",
  "Groups",
  "Materials",
  "Members",
  "No group selected.",
  "Save",
  "Search",
  "Status",
  "Visibility",
  "absent",
  "active",
  "approved",
  "archived",
  "assigned",
  "completed",
  "declined",
  "draft",
  "excused",
  "group",
  "in_progress",
  "inactive",
  "leader",
  "manual",
  "members",
  "needs_follow_up",
  "paused",
  "present",
  "private",
  "public",
  "submitted",
  "withdrawn"
] as const;

function groupBlock(source: string, localeExpression: string) {
  const marker = `Object.assign(${localeExpression}, {\n  "A valid date and time is required."`;
  const start = source.lastIndexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf("\n});", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}
