import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminDialogHeader.vue", import.meta.url)
).text();

describe("admin dialog header", () => {
  test("owns responsive dialog heading presentation only", () => {
    expect(component).toContain("admin-dialog-header__title");
    expect(component).toContain('<h2 class="admin-dialog-header__title">');
    expect(component).toContain("admin-dialog-header__subtitle");
    expect(component).toContain('icon="mdi-close"');
    expect(component).toContain('aria-hidden="true"');
    expect(component).toContain("$emit('close')");
    expect(component).toContain("const closeButtonDisabled = computed");
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
      "../src/features/life-posts/components/LifeEventCheckInCodeDialog.vue",
      "../src/features/settings/components/MediaImagePicker.vue"
    ];
    const sources = await Promise.all(
      paths.map((path) => Bun.file(new URL(path, import.meta.url)).text())
    );

    for (const source of sources) {
      expect(source).toContain(
        'import AdminDialogHeader from "@/core/ui/AdminDialogHeader.vue"'
      );
      expect(source).toContain("<AdminDialogHeader");
      expect(source).toContain('@close="');
    }
  });
});
