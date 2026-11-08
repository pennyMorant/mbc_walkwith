import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminMobileRecord.vue", import.meta.url)
).text();

const consumers = await Promise.all(
  [
    "members/components/MemberResults.vue",
    "newcomers/components/NewcomerResults.vue",
    "users/components/AdminUserResults.vue",
    "bible-notes/components/BibleNoteResults.vue",
    "care/components/CareRequestResults.vue",
    "notifications/components/NotificationDeliveryResults.vue",
    "prayer/components/PrayerRequestsTable.vue",
    "dashboard/components/DashboardRecentContent.vue",
    "sermons/components/SermonLibraryCard.vue",
    "life-posts/components/LifePostLibraryCard.vue"
  ].map((path) =>
    Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
  )
);

describe("admin mobile record", () => {
  test("owns the shared interactive record structure", () => {
    expect(component).toContain('class="admin-mobile-record"');
    expect(component).toContain('type="button"');
    expect(component).toContain("$emit('activate')");
    expect(component).toContain('<slot name="trailing" />');
    expect(component).toContain('icon="mdi-chevron-right"');
    expect(component).toContain("admin-mobile-record__chevron");
    expect(component).toContain("grid-row: 1 / span 2");
    expect(component).not.toContain("display: none");
  });

  test("is used by responsive result lists without local layout copies", () => {
    for (const source of consumers) {
      expect(source).toContain("AdminMobileRecord");
      expect(source).not.toContain("grid-template-columns: minmax(0, 1fr) auto auto");
    }
  });
});
