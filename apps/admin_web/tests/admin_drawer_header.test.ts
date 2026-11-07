import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminDrawerHeader.vue", import.meta.url)
).text();

describe("admin drawer header", () => {
  test("owns responsive drawer heading presentation only", () => {
    expect(component).toContain("admin-drawer-header__title");
    expect(component).toContain('<h2 class="admin-drawer-header__title">');
    expect(component).toContain("admin-drawer-header__subtitle");
    expect(component).toContain('<slot name="meta" />');
    expect(component).toContain('icon="mdi-close"');
    expect(component).toContain("grid-column: 1 / -1");
    expect(component).toContain("$emit('close')");
    expect(component).toContain("const closeButtonDisabled = computed");
    expect(component).not.toContain("@/core/api");
    expect(component).not.toContain("useAdminAuthStore");
  });

  test("is shared by sensitive and operational feature drawers", async () => {
    const sources = await Promise.all(
      [
        "audit/components/AuditLogDetailDrawer.vue",
        "care/components/CareRequestDrawer.vue",
        "members/components/MemberEditorDrawer.vue",
        "settings/components/SettingsEditorDrawer.vue",
        "users/components/AdminUserEditorDrawer.vue",
        "notifications/components/NotificationDeliveryDetailDrawer.vue",
        "prayer/components/PrayerModerationDrawer.vue"
      ].map((path) =>
        Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
      )
    );

    for (const source of sources) {
      expect(source).toContain("<AdminDrawerHeader");
      expect(source).toContain('@close="');
    }
  });
});
