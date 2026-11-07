import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminRefreshButton.vue", import.meta.url)
).text();

const consumers = await Promise.all(
  [
    "audit/pages/AuditLogsPage.vue",
    "bible-knowledge/pages/BibleKnowledgePage.vue",
    "bible-notes/pages/BibleNotesPage.vue",
    "giving/pages/GivingPage.vue",
    "members/pages/MembersPage.vue",
    "prayer/pages/PrayerPage.vue",
    "sermons/pages/SermonsPage.vue",
    "notifications/pages/NotificationsPage.vue",
    "settings/pages/SettingsPage.vue",
    "care/pages/CarePage.vue",
    "life-posts/pages/LifePostsPage.vue",
    "newcomers/pages/NewcomersPage.vue",
    "users/pages/UsersPage.vue",
    "jobs/pages/JobsPage.vue"
  ].map((path) =>
    Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
  )
);

describe("admin refresh button", () => {
  test("owns the standard page refresh presentation", () => {
    expect(component).toContain('color="primary"');
    expect(component).toContain('variant="tonal"');
    expect(component).toContain('prepend-icon="mdi-refresh"');
    expect(component).toContain(":loading=\"loading ?? false\"");
    expect(component).toContain(":disabled=\"disabled ?? false\"");
    expect(component).toContain("$emit('refresh')");
  });

  test("is reused without taking page query ownership", () => {
    for (const source of consumers) {
      expect(source).toContain("AdminRefreshButton");
      expect(source).toContain("@refresh=");
      expect(source).not.toContain("@/core/api/api_client");
    }
  });
});
