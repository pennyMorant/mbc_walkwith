import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../src/features/reading-plans/pages/ReadingPlansPage.vue", import.meta.url),
  "utf8"
);
const componentSources = [
  "ReadingPlanFiltersCard.vue",
  "ReadingPlanLibraryPanel.vue",
  "ReadingPlanEditorFields.vue"
].map((fileName) =>
  readFileSync(
    new URL(`../src/features/reading-plans/components/${fileName}`, import.meta.url),
    "utf8"
  )
);

describe("reading plan page composition", () => {
  it("keeps queries, mutations, permissions, and business locks page-owned", () => {
    expect(pageSource).toContain("listReadingPlans");
    expect(pageSource).toContain("createReadingPlanAssignment");
    expect(pageSource).toContain("authStore.can");
    expect(pageSource).toContain("readingPlanContentIsLocked");
    expect(pageSource).toContain("readingPlanVisibilityAllowsUserType");
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
