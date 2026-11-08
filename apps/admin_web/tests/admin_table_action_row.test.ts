import { describe, expect, test } from "bun:test";

const row = await Bun.file(
  new URL("../src/core/ui/AdminTableActionRow.vue", import.meta.url)
).text();

const consumers = await Promise.all(
  [
    "audit/components/AuditLogResults.vue",
    "bible-knowledge/components/BibleKnowledgeEntityListCard.vue",
    "bible-notes/components/BibleNoteResults.vue",
    "care/components/CareRequestResults.vue",
    "giving/components/GivingProviderEventsCard.vue",
    "giving/components/GivingTransactionsCard.vue",
    "jobs/components/JobQueueCard.vue",
    "life-posts/components/LifePostLibraryCard.vue",
    "members/components/MemberResults.vue",
    "newcomers/components/NewcomerResults.vue",
    "notifications/components/NotificationDeliveryResults.vue",
    "prayer/components/PrayerRequestsTable.vue",
    "sermons/components/SermonLibraryCard.vue",
    "users/components/AdminUserResults.vue"
  ].map((path) =>
    Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
  )
);

describe("admin table action row", () => {
  test("owns keyboard and pointer activation semantics", () => {
    expect(row).toContain('role="button"');
    expect(row).toContain('tabindex="0"');
    expect(row).toContain("@keydown.enter");
    expect(row).toContain("@keydown.space.prevent");
    expect(row).toContain("focus-visible");
  });

  test("is shared by every whole-row desktop action", () => {
    for (const source of consumers) {
      expect(source).toContain("AdminTableActionRow");
      expect(source).not.toMatch(/<tr[\s\S]{0,180}@click/);
    }
  });
});
