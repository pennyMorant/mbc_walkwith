import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminFilterActions.vue", import.meta.url)
).text();

describe("admin filter actions", () => {
  test("owns accessible responsive filter actions without query state", () => {
    expect(component).toContain('type="submit"');
    expect(component).toContain('type="button"');
    expect(component).toContain('icon="mdi-filter-check-outline"');
    expect(component).toContain(':aria-label="applyLabel"');
    expect(component).toContain("$emit('clear')");
    expect(component).toContain("admin-filter-actions--end");
    expect(component).toContain("@media (max-width: 420px)");
    expect(component).not.toContain("@/core/api");
    expect(component).not.toContain("defineModel");
  });

  test("is shared by explicit apply and clear filter forms", async () => {
    const paths = [
      "../src/core/ui/AdminCatalogFilters.vue",
      "../src/features/notifications/components/NotificationDeliveryFiltersCard.vue",
      "../src/features/audit/components/AuditLogFiltersCard.vue",
      "../src/features/settings/components/SettingsFiltersCard.vue",
      "../src/features/newcomers/components/NewcomerFiltersCard.vue",
      "../src/features/prayer/components/PrayerRequestsTable.vue",
      "../src/features/life-posts/components/LifePostLibraryFilters.vue"
    ];
    const sources = await Promise.all(
      paths.map((path) => Bun.file(new URL(path, import.meta.url)).text())
    );

    for (const source of sources) {
      expect(source).toContain("<AdminFilterActions");
      expect(source).toContain('@clear="');
      expect(source).toContain("@submit.prevent");
    }
  });

  test("keeps notification controls compact before the desktop row breakpoint", async () => {
    const source = await Bun.file(
      new URL(
        "../src/features/notifications/components/NotificationDeliveryFiltersCard.vue",
        import.meta.url
      )
    ).text();

    expect(source).toContain(".filter-control {\n  width: 100%;");
    expect(source).toContain("@media (min-width: 1280px)");
    expect(source).toContain("flex: 1 1 220px");
  });
});
