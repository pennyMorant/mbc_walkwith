import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminRefreshAlert.vue", import.meta.url)
).text();

const consumers = await Promise.all(
  [
    "members/components/MemberResults.vue",
    "newcomers/components/NewcomerResults.vue",
    "prayer/components/PrayerRequestsTable.vue",
    "media/components/MediaLibraryCard.vue",
    "media/components/MediaCleanupCard.vue",
    "reading-plans/components/ReadingPlanLibraryPanel.vue",
    "reading-plans/components/ReadingPlanDaysPanel.vue",
    "reading-plans/components/ReadingPlanAssignmentsPanel.vue",
    "discipleship/components/DiscipleshipJourneyCatalogCard.vue"
  ].map((path) =>
    Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
  )
);

describe("admin refresh alert", () => {
  test("owns the non-destructive refresh recovery presentation", () => {
    expect(component).toContain('type="warning"');
    expect(component).toContain('variant="tonal"');
    expect(component).toContain('density="compact"');
    expect(component).toContain("$emit('retry')");
  });

  test("is reused without taking query ownership", () => {
    for (const source of consumers) {
      expect(source).toContain("AdminRefreshAlert");
      expect(source).not.toContain('v-if="refreshErrorMessage"');
      expect(source).not.toContain("@/core/api");
    }
  });
});
