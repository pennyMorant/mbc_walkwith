import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminRetryAlert.vue", import.meta.url)
).text();

const dataState = await Bun.file(
  new URL("../src/core/ui/AdminDataState.vue", import.meta.url)
).text();

const refreshAlert = await Bun.file(
  new URL("../src/core/ui/AdminRefreshAlert.vue", import.meta.url)
).text();

const consumers = await Promise.all(
  [
    "jobs/components/JobQueueCard.vue",
    "jobs/components/JobPipelineReadinessCard.vue",
    "jobs/components/JobStatsWorkspace.vue",
    "bible-notes/components/BibleNoteResults.vue",
    "ai/pages/AiManagementPage.vue",
    "members/components/MemberEditorDrawer.vue",
    "audit/pages/AuditLogsPage.vue",
    "notifications/pages/NotificationsPage.vue",
    "settings/pages/SettingsPage.vue",
    "giving/pages/GivingPage.vue",
    "giving/components/GivingRefreshError.vue",
    "life-posts/components/LifePostLibraryCard.vue",
    "bible-knowledge/components/BibleKnowledgeEntityListCard.vue",
    "groups/components/GroupCatalogCard.vue",
    "courses/components/CourseCatalogCard.vue",
    "care/components/CareRequestDrawer.vue"
  ].map((path) =>
    Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
  )
);

describe("admin retry alert", () => {
  test("owns responsive retry presentation without query behavior", () => {
    expect(component).toContain('variant="tonal"');
    expect(component).toContain("props.buttonColor || alertType.value");
    expect(component).toContain(":loading=\"retryLoading\"");
    expect(component).toContain("$emit('retry')");
    expect(component).toContain("admin-retry-alert__message");
    expect(component).toContain("overflow-wrap: anywhere");
    expect(component).not.toContain("@/core/api");
  });

  test("backs the existing data-state and refresh-alert contracts", () => {
    expect(dataState).toContain("AdminRetryAlert");
    expect(refreshAlert).toContain("AdminRetryAlert");
    expect(refreshAlert).toContain('type="warning"');
    expect(refreshAlert).toContain('button-variant="text"');
  });

  test("is reused by matching feature recovery surfaces", () => {
    for (const source of consumers) {
      expect(source).toContain("AdminRetryAlert");
      expect(source.match(/<AdminRetryAlert/g)?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
