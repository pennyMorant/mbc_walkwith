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
    expect(controller).toContain("commandErrorMessage");
    expect(controller).toContain("mutationFeedback.errorMessage.value");
    expect(page).toContain('v-if="commandErrorMessage"');
    expect(page).toContain(':error-message="setupErrorMessage"');
    expect(page).toContain(':error-message="assignmentsErrorMessage"');
    expect(page).toContain(':error-message="availabilityErrorMessage"');
    expect(page).toContain(':error-message="checkInsErrorMessage"');
  });
});
