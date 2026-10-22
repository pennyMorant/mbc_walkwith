import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/reading-plans/pages/ReadingPlansPage.vue", import.meta.url),
  "utf8"
);
const componentFiles = [
  "ReadingPlanLibraryPanel.vue",
  "ReadingPlanDaysPanel.vue",
  "ReadingPlanAssignmentsPanel.vue"
];

describe("reading plan query states", () => {
  test.each(componentFiles)("keeps %s query presentation-only", (file) => {
    const source = readFileSync(
      new URL(`../src/features/reading-plans/components/${file}`, import.meta.url),
      "utf8"
    );

    expect(source).toContain("AdminDataState");
    expect(source).toContain("$emit('retry')");
    expect(source).not.toContain("useQuery");
    expect(source).not.toContain("useMutation");
    expect(source).not.toContain("auth_store");
  });

  test("keeps each query retry page-owned", () => {
    expect(page).toContain('@retry="plansQuery.refetch()"');
    expect(page).toContain('@retry="daysQuery.refetch()"');
    expect(page).toContain('@retry="assignmentsQuery.refetch()"');
  });

  test("keeps existing workspace data visible during background refresh", () => {
    expect(page).toContain(':pending="daysQuery.isPending.value"');
    expect(page).toContain(':loading="daysQuery.isFetching.value"');
    expect(page).toContain(':pending="assignmentsQuery.isPending.value"');
    expect(page).toContain(':loading="assignmentsQuery.isFetching.value"');
  });

  test("keeps mutation errors separate from query failures", () => {
    expect(page).toContain('v-if="mutationErrorMessage"');
    expect(page).toContain(':error-message="plansErrorMessage"');
    expect(page).toContain(':error-message="daysErrorMessage"');
    expect(page).toContain(':error-message="assignmentsErrorMessage"');
  });
});
