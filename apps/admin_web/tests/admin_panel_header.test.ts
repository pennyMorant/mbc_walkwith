import { describe, expect, test } from "bun:test";

describe("admin panel header", () => {
  test("owns responsive card heading layout without feature state", async () => {
    const component = await Bun.file(
      new URL("../src/core/ui/AdminPanelHeader.vue", import.meta.url)
    ).text();

    expect(component).toContain("admin-panel-header__title");
    expect(component).toContain('<h2 class="admin-panel-header__title">');
    expect(component).toContain('<slot name="actions" />');
    expect(component).toContain("@media (max-width: 600px)");
    expect(component).not.toContain("useAdminAuthStore");
    expect(component).not.toContain("@/core/api/");
  });

  test("is reused by operational card workspaces", async () => {
    const paths = [
      "../src/features/sermons/components/SermonLibraryCard.vue",
      "../src/features/sermons/components/SermonAudioCleanupCard.vue",
      "../src/features/sermons/components/SermonPipelineTab.vue",
      "../src/features/sermons/components/SermonReviewTab.vue",
      "../src/features/life-posts/components/LifePostLibraryCard.vue",
      "../src/features/jobs/components/JobQueueCard.vue",
      "../src/features/jobs/components/JobPipelineReadinessCard.vue",
      "../src/features/media/components/MediaCleanupCard.vue",
      "../src/features/media/components/MediaLibraryCard.vue",
      "../src/features/content-localization/components/ContentLocalizationCard.vue",
      "../src/features/serving/components/ServingAssignmentsCard.vue",
      "../src/features/serving/components/ServingSetupCard.vue",
      "../src/features/groups/components/GroupWorkspaceCard.vue",
      "../src/features/courses/components/CourseWorkspaceCard.vue",
      "../src/features/reading-plans/pages/ReadingPlansPage.vue",
      "../src/features/discipleship/pages/DiscipleshipPage.vue",
      "../src/features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue"
    ];
    const sources = await Promise.all(
      paths.map((path) => Bun.file(new URL(path, import.meta.url)).text())
    );

    for (const source of sources) {
      expect(source).toContain(
        'import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue"'
      );
      expect(source).toContain("<AdminPanelHeader");
    }
  });
});
