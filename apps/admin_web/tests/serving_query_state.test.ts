import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/serving/pages/ServingPage.vue", import.meta.url),
  "utf8"
);
const controller = readFileSync(
  new URL(
    "../src/features/serving/composables/use_serving_page.ts",
    import.meta.url
  ),
  "utf8"
);
const workspaceState = readFileSync(
  new URL(
    "../src/features/serving/composables/use_serving_workspace_state.ts",
    import.meta.url
  ),
  "utf8"
);
const feedbackAlerts = readFileSync(
  new URL(
    "../src/features/serving/components/ServingFeedbackAlerts.vue",
    import.meta.url
  ),
  "utf8"
);
const componentFiles = [
  "ServingSetupCard.vue",
  "ServingAssignmentsCard.vue",
  "ServingAvailabilityPanel.vue",
  "ServingCheckInsPanel.vue"
];

describe("serving workspace query states", () => {
  test.each(componentFiles)("keeps %s query presentation component-owned", (file) => {
    const source = readFileSync(
      new URL(`../src/features/serving/components/${file}`, import.meta.url),
      "utf8"
    );

    expect(source).toContain("AdminDataState");
    expect(source).toContain("emit('retry')");
    expect(source).not.toContain("useQuery");
    expect(source).not.toContain("auth_store");
  });

  test("keeps targeted query retries in the page controller", () => {
    for (const refresh of [
      "refreshSetup",
      "refreshAssignments",
      "refreshAvailability",
      "refreshCheckIns"
    ]) {
      expect(controller).toContain(`function ${refresh}()`);
      expect(page).toContain(`@retry="${refresh}"`);
    }
  });

  test("keeps command failures separate from query failures", () => {
    for (const region of [
      "setup",
      "assignments",
      "availability",
      "checkIns"
    ]) {
      expect(controller).toContain(`${region}CommandErrorMessage`);
      expect(controller).toContain(`${region}RefreshErrorMessage`);
    }
    expect(feedbackAlerts).toContain("AdminRefreshAlert");
    expect(feedbackAlerts).toContain('v-if="commandErrorMessage"');
    expect(feedbackAlerts).toContain("emit('retry')");
    expect(page).toContain(':error-message="setupErrorMessage"');
    expect(page).toContain(':error-message="assignmentsErrorMessage"');
    expect(page).toContain(':error-message="availabilityErrorMessage"');
    expect(page).toContain(':error-message="checkInsErrorMessage"');
  });

  test("applies filters explicitly instead of querying on every draft edit", () => {
    for (const region of ["Assignment", "Availability", "CheckIn"]) {
      expect(workspaceState).toContain(`applied${region}Filters`);
      expect(workspaceState).toContain(`function apply${region}Filters()`);
      expect(page).toContain(`@refresh="apply${region}Filters"`);
    }
  });

  test("freezes status command targets before starting mutations", () => {
    expect(controller).toContain("{ teamId: team.id, status }");
    expect(controller).toContain("{ roleId: role.id, status }");
    expect(controller).toContain("{ assignmentId: assignment.id, status }");
    expect(controller).not.toContain("mutate({ team, status })");
    expect(controller).not.toContain("mutate({ role, status })");
    expect(controller).not.toContain("mutate({ assignment, status })");
  });
});
