import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminConfirmDialog.vue", import.meta.url)
).text();

describe("admin confirmation dialog", () => {
  test("owns responsive confirmation presentation without command behavior", () => {
    expect(component).toContain('emit("update:modelValue", open)');
    expect(component).toContain('emit("confirm")');
    expect(component).toContain(':persistent="dialogLoading"');
    expect(component).toContain("const confirmDisabled = computed");
    expect(component).toContain("admin-confirm-dialog__actions");
    expect(component).toContain("grid-template-columns: 1fr");
    expect(component).toContain('aria-hidden="true"');
    expect(component).not.toContain("@/core/api");
    expect(component).not.toContain("useAdminAuthStore");
  });

  test("is shared by feature-owned command flows", async () => {
    const sources = await Promise.all(
      [
        "users/components/AdminUserEditorDrawer.vue",
        "notifications/components/NotificationDeliveryDetailDrawer.vue",
        "prayer/components/PrayerModerationDrawer.vue",
        "life-posts/pages/LifePostsPage.vue"
      ].map((path) =>
        Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
      )
    );

    for (const source of sources) {
      expect(source).toContain("<AdminConfirmDialog");
      expect(source).toContain('@confirm="');
    }
  });
});
