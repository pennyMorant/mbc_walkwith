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

  test("is reused by the primary admin workspaces", async () => {
    const pagePaths = [
      "../src/features/sermons/pages/SermonsPage.vue",
      "../src/features/life-posts/pages/LifePostsPage.vue",
      "../src/features/prayer/pages/PrayerPage.vue",
      "../src/features/media/pages/MediaPage.vue",
      "../src/features/settings/pages/SettingsPage.vue",
      "../src/features/ai/pages/AiManagementPage.vue",
      "../src/features/audit/pages/AuditLogsPage.vue",
      "../src/features/jobs/pages/JobsPage.vue",
      "../src/features/users/pages/UsersPage.vue",
      "../src/features/members/pages/MembersPage.vue",
      "../src/features/newcomers/pages/NewcomersPage.vue",
      "../src/features/care/pages/CarePage.vue",
      "../src/features/notifications/pages/NotificationsPage.vue",
      "../src/features/bible-knowledge/pages/BibleKnowledgePage.vue",
      "../src/features/bible-notes/pages/BibleNotesPage.vue",
      "../src/features/discipleship/pages/DiscipleshipPage.vue",
      "../src/features/giving/pages/GivingPage.vue",
      "../src/features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue",
      "../src/features/groups/pages/GroupsPage.vue",
      "../src/features/courses/pages/CoursesPage.vue",
      "../src/features/serving/pages/ServingPage.vue",
      "../src/features/reading-plans/pages/ReadingPlansPage.vue"
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
