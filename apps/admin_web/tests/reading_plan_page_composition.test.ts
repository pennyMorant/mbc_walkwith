import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../src/features/reading-plans/pages/ReadingPlansPage.vue", import.meta.url),
  "utf8"
);
const controllerSource = readFileSync(
  new URL(
    "../src/features/reading-plans/composables/use_reading_plans_page.ts",
    import.meta.url
  ),
  "utf8"
);
const componentSources = [
  "ReadingPlanFiltersCard.vue",
  "ReadingPlanLibraryPanel.vue",
  "ReadingPlanEditorFields.vue",
  "ReadingPlanDaysPanel.vue",
  "ReadingPlanAssignmentsPanel.vue"
].map((fileName) =>
  readFileSync(
    new URL(`../src/features/reading-plans/components/${fileName}`, import.meta.url),
    "utf8"
  )
);

describe("reading plan page composition", () => {
  it("keeps the page composition-only and controller-owned", () => {
    expect(pageSource).toContain("useReadingPlansPage");
    expect(pageSource).not.toContain("useQuery");
    expect(pageSource).not.toContain("useMutation");
    expect(pageSource).not.toContain("@/core/api/");
    expect(controllerSource).toContain("createReadingPlanAssignment");
    expect(controllerSource).toContain('authStore.can("reading_plans:manage")');
    expect(controllerSource).toContain("readingPlanContentIsLocked");
    expect(controllerSource).toContain(
      "readingPlanVisibilityAllowsUserType"
    );
  });

  it("delegates focused presentation sections without transport ownership", () => {
    expect(pageSource).toContain("<ReadingPlanFiltersCard");
    expect(pageSource).toContain("<ReadingPlanLibraryPanel");
    expect(pageSource).toContain("<ReadingPlanEditorFields");
    for (const source of componentSources) {
      expect(source).not.toContain("@/core/api/");
      expect(source).not.toContain("useAdminAuthStore");
      expect(source).not.toContain("useMutation");
    }
  });
});
