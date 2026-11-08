import { describe, expect, test } from "bun:test";

const dataRow = await source("../src/core/ui/AdminMobileDataRow.vue");
const memberships = await source(
  "../src/features/groups/components/GroupMembershipsPanel.vue"
);
const materials = await source(
  "../src/features/groups/components/GroupMaterialsPanel.vue"
);
const attendance = await source(
  "../src/features/groups/components/GroupAttendancePanel.vue"
);

describe("group responsive results", () => {
  test("provides a non-interactive mobile row for embedded controls", () => {
    expect(dataRow).toContain('class="admin-mobile-data-row"');
    expect(dataRow).toContain('<slot name="trailing" />');
    expect(dataRow).toContain('<slot name="meta" />');
    expect(dataRow).toContain('<slot name="actions" />');
    expect(dataRow).not.toContain("<button");
    expect(dataRow).not.toContain("useQuery");
  });

  test.each([memberships, materials, attendance])(
    "keeps group desktop and mobile projections on one canonical collection",
    (panel) => {
      expect(panel).toContain("AdminMobileDataRow");
      expect(panel).toContain("AdminResponsiveTable");
      expect(panel).toContain("<template #desktop>");
      expect(panel).toContain("<template #mobile>");
      expect(panel).not.toContain('class="d-none d-md-block"');
      expect(panel).not.toContain('class="d-md-none"');
      expect(panel).not.toContain("useQuery");
    }
  );

  test("keeps mobile status changes on the existing command intents", () => {
    expect(
      memberships.match(/updateStatus\(membership, \$event\)/g)?.length
    ).toBe(2);
    expect(materials.match(/updateStatus\(material, \$event\)/g)?.length).toBe(
      2
    );
  });

  test("formats dates through the existing group presenters", () => {
    expect(
      memberships.match(/formatGroupDateTime\(membership.updatedAt, locale\)/g)
        ?.length
    ).toBe(2);
    expect(
      materials.match(/formatGroupDateTime\(material.dueAt, locale\)/g)?.length
    ).toBe(2);
    expect(
      attendance.match(/formatGroupDate\(record.meetingDate, locale\)/g)?.length
    ).toBe(2);
  });
});

async function source(path: string) {
  return Bun.file(new URL(path, import.meta.url)).text();
}
