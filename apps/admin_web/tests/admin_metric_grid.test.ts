import { describe, expect, test } from "bun:test";

describe("admin metric grid", () => {
  test("owns presentation without owning feature state", async () => {
    const component = await Bun.file(
      new URL("../src/core/ui/AdminMetricGrid.vue", import.meta.url)
    ).text();

    expect(component).toContain("AdminMetricItem[]");
    expect(component).toContain("repeat(auto-fit, minmax(190px, 1fr))");
    expect(component).toContain("item.label");
    expect(component).toContain("item.value");
    expect(component).not.toContain("@/core/api/");
    expect(component).not.toContain("useAdminAuthStore");
  });

  test("is reused by feature-owned summary projections", async () => {
    const paths = [
      "../src/features/bible-notes/pages/BibleNotesPage.vue",
      "../src/features/care/pages/CarePage.vue",
      "../src/features/newcomers/pages/NewcomersPage.vue",
      "../src/features/prayer/components/PrayerSummaryCards.vue",
      "../src/features/giving/components/GivingSummaryCards.vue"
    ];
    const sources = await Promise.all(
      paths.map((path) => Bun.file(new URL(path, import.meta.url)).text())
    );

    for (const source of sources) {
      expect(source).toContain('import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue"');
      expect(source).toContain("<AdminMetricGrid");
    }
  });
});
