import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/reading-plans/pages/ReadingPlansPage.vue", import.meta.url),
  "utf8"
);
const controller = readFileSync(
  new URL(
    "../src/features/reading-plans/composables/use_reading_plans_page.ts",
    import.meta.url
  ),
  "utf8"
);
const queries = readFileSync(
  new URL(
    "../src/features/reading-plans/composables/use_reading_plan_queries.ts",
    import.meta.url
  ),
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

  test("keeps each query retry explicit at the composition boundary", () => {
    expect(page).toContain('@retry="plansQuery.refetch()"');
    expect(page).toContain('@retry="daysQuery.refetch()"');
    expect(page).toContain('@retry="assignmentsQuery.refetch()"');
  });

  test("applies draft filters through immutable query snapshots", () => {
    expect(queries).toContain("readingPlanFilterSnapshot(filters)");
    expect(queries).toContain(
      "readingPlanAssignmentFilterSnapshot(assignmentFilters)"
    );
    expect(queries).toContain("appliedFilters.value = snapshot");
    expect(queries).toContain("appliedAssignmentFilters.value = snapshot");
    expect(page).toContain('@apply="applyPlanFilters"');
    expect(page).toContain('@apply="applyAssignmentFilters"');
  });

  test("keeps existing workspace data visible during background refresh", () => {
    expect(queries).toContain("query.data.value === undefined");
    expect(queries).toContain("query.data.value !== undefined");
    expect(queries.match(/InitialError = initialError/g)).toHaveLength(3);
    expect(queries.match(/RefreshError = refreshError/g)).toHaveLength(3);
    expect(page.match(/:refresh-error-message=/g)).toHaveLength(3);
  });

  test("keeps command errors separate from query failures", () => {
    expect(controller).toContain('const planErrorMessage = ref("")');
    expect(controller).toContain('const dayErrorMessage = ref("")');
    expect(controller).toContain('const assignmentErrorMessage = ref("")');
    expect(page).toContain('v-if="planErrorMessage"');
    expect(page).toContain(':command-error-message="dayErrorMessage"');
    expect(page).toContain(
      ':command-error-message="assignmentErrorMessage"'
    );
    expect(page).toContain(':error-message="plansErrorMessage"');
    expect(page).toContain(':error-message="daysErrorMessage"');
    expect(page).toContain(':error-message="assignmentsErrorMessage"');
  });

  test("freezes command payloads and guards results by plan context", () => {
    expect(controller).toContain("mutationFn: (intent: PlanSaveIntent)");
    expect(controller).toContain("mutationFn: (intent: DaySaveIntent)");
    expect(controller).toContain(
      "mutationFn: (intent: AssignmentCreateIntent)"
    );
    expect(controller).toContain("readingPlanCommandTargetsSelection(");
    expect(controller).toContain("planId: selectedPlan.value.id");
    expect(controller).not.toContain("mutationFn: () =>");
  });

  test("keeps structure locks independent from assignment filters", () => {
    expect(queries).toContain('"reading-plan-assignment-presence"');
    expect(queries).toContain("limit: 1");
    expect(controller).toContain(
      "queries.assignmentPresenceQuery.isSuccess.value"
    );
    expect(controller).not.toContain("queries.assignments.value.length > 0");
  });
});
