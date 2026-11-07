import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminDialogActions.vue", import.meta.url)
).text();

describe("admin dialog actions", () => {
  test("owns responsive action presentation without command behavior", () => {
    expect(component).toContain("admin-dialog-actions__leading");
    expect(component).toContain("admin-dialog-actions__primary");
    expect(component).toContain('<slot name="leading" />');
    expect(component).toContain("const cancelButtonDisabled = computed");
    expect(component).toContain("const confirmButtonDisabled = computed");
    expect(component).toContain("$emit('cancel')");
    expect(component).toContain("$emit('confirm')");
    expect(component).toContain("@media (max-width: 420px)");
    expect(component).not.toContain("@/core/api");
    expect(component).not.toContain("useAdminAuthStore");
  });

  test("is shared by feature-owned editor and utility dialogs", async () => {
    const paths = [
      "../src/features/auth/components/AdminPasswordDialog.vue",
      "../src/features/media/components/MediaAssetEditDialog.vue",
      "../src/features/life-posts/components/LifeEventRegistrationCreateDialog.vue",
      "../src/features/life-posts/components/LifeEventRegistrationEditDialog.vue",
      "../src/features/life-posts/components/LifeEventCheckInCodeDialog.vue"
    ];
    const sources = await Promise.all(
      paths.map((path) => Bun.file(new URL(path, import.meta.url)).text())
    );

    for (const source of sources) {
      expect(source).toContain(
        'import AdminDialogActions from "@/core/ui/AdminDialogActions.vue"'
      );
      expect(source).toContain("<AdminDialogActions");
      expect(source).toContain('@cancel="');
      expect(source).toContain('@confirm="');
    }
  });
});
