import { describe, expect, test } from "bun:test";

describe("admin page header", () => {
  test("owns responsive layout without owning feature actions", async () => {
    const component = await Bun.file(
      new URL("../src/core/ui/AdminPageHeader.vue", import.meta.url)
    ).text();

    expect(component).toContain("<h1");
    expect(component).toContain('<slot name="actions" />');
    expect(component).toContain("@media (max-width: 600px)");
    expect(component).toContain("flex-direction: column");
    expect(component).not.toContain("useAdminAuthStore");
    expect(component).not.toContain("@/core/api/");
  });

  test("is reused by the primary content and settings workspaces", async () => {
    const pagePaths = [
      "../src/features/sermons/pages/SermonsPage.vue",
      "../src/features/life-posts/pages/LifePostsPage.vue",
      "../src/features/prayer/pages/PrayerPage.vue",
      "../src/features/media/pages/MediaPage.vue",
      "../src/features/settings/pages/SettingsPage.vue"
    ];
    const pages = await Promise.all(
      pagePaths.map((path) => Bun.file(new URL(path, import.meta.url)).text())
    );

    for (const page of pages) {
      expect(page).toContain('import AdminPageHeader from "@/core/ui/AdminPageHeader.vue"');
      expect(page).toContain("<AdminPageHeader");
    }
  });
});
