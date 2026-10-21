import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/discipleship/pages/DiscipleshipPage.vue", import.meta.url),
  "utf8"
);
const controller = readFileSync(
  new URL(
    "../src/features/discipleship/composables/use_discipleship_page_controller.ts",
    import.meta.url
  ),
  "utf8"
);
const catalog = readFileSync(
  new URL(
    "../src/features/discipleship/components/DiscipleshipJourneyCatalogCard.vue",
    import.meta.url
  ),
  "utf8"
);

describe("discipleship query states", () => {
  test("keeps the journey catalog presentation-only", () => {
    expect(catalog).toContain("AdminDataState");
    expect(catalog).toContain("$emit('retry')");
    expect(catalog).not.toContain("@/core/api");
    expect(catalog).not.toContain("auth_store");
  });

  test("keeps retry and selection ownership in the page", () => {
    expect(page).toContain("<DiscipleshipJourneyCatalogCard");
    expect(page).toContain('@retry="refreshJourneys"');
    expect(page).toContain('@select="selectJourney"');
  });

  test("separates catalog query failures from workspace command failures", () => {
    expect(controller).toContain("journeysQuery.error.value");
    expect(controller).toContain("workspaceQueryError.value");
    expect(page).toContain(':error-message="listErrorMessage"');
    expect(page).toContain('v-if="workspaceErrorMessage"');
  });
});
