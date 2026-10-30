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
const queries = readFileSync(
  new URL(
    "../src/features/discipleship/composables/use_discipleship_queries.ts",
    import.meta.url
  ),
  "utf8"
);
const filters = readFileSync(
  new URL(
    "../src/features/discipleship/components/DiscipleshipFiltersCard.vue",
    import.meta.url
  ),
  "utf8"
);
const assignments = readFileSync(
  new URL(
    "../src/features/discipleship/components/DiscipleshipAssignmentsPanel.vue",
    import.meta.url
  ),
  "utf8"
);
const editor = readFileSync(
  new URL(
    "../src/features/discipleship/components/DiscipleshipJourneyEditor.vue",
    import.meta.url
  ),
  "utf8"
);
const progress = readFileSync(
  new URL(
    "../src/features/discipleship/components/DiscipleshipProgressDrawer.vue",
    import.meta.url
  ),
  "utf8"
);
const i18n = readFileSync(
  new URL("../src/core/i18n/i18n.ts", import.meta.url),
  "utf8"
);

describe("discipleship query states", () => {
  test("keeps the journey catalog presentation-only", () => {
    expect(catalog).toContain("AdminDataState");
    expect(catalog).toContain("$emit('retry')");
    expect(catalog).not.toContain("@/core/api");
    expect(catalog).not.toContain("auth_store");
  });

  test("keeps retry and selection ownership at the composition boundary", () => {
    expect(page).toContain("<DiscipleshipJourneyCatalogCard");
    expect(page).toContain('@retry="refreshJourneys"');
    expect(page).toContain('@select="selectJourney"');
  });

  test("applies filter drafts through explicit immutable snapshots", () => {
    expect(queries).toContain("snapshotDiscipleshipJourneyFilters(filters)");
    expect(queries).toContain(
      "snapshotDiscipleshipAssignmentFilters(assignmentFilters)"
    );
    expect(page).toContain('@apply="applyJourneyFilters"');
    expect(page).toContain('@apply="applyAssignmentFilters"');
    expect(filters).not.toContain("@update:model-value");
    expect(assignments).not.toContain("@update:model-value");
  });

  test("preserves loaded data when background refreshes fail", () => {
    expect(queries).toContain("query.data.value === undefined");
    expect(queries).toContain("query.data.value !== undefined");
    expect(page).toContain(':refresh-error-message="listRefreshErrorMessage"');
    expect(page).toContain(
      ':structure-refresh-error-message="structureRefreshErrorMessage"'
    );
    expect(page).toContain(
      ':refresh-error-message="assignmentsRefreshErrorMessage"'
    );
  });

  test("separates query regions and command failures", () => {
    expect(controller).toContain("journeyCommandError");
    expect(controller).toContain("structureCommandError");
    expect(controller).toContain("assignmentCommandError");
    expect(controller).toContain("progressCommandError");
    expect(page).toContain(':error-message="listErrorMessage"');
    expect(page).toContain(':structure-error-message="structureErrorMessage"');
    expect(page).toContain(':error-message="assignmentsErrorMessage"');
  });

  test("freezes every write intent and guards asynchronous results", () => {
    expect(controller).toContain("mutationFn: (intent: JourneySaveIntent)");
    expect(controller).toContain("mutationFn: (intent: StageCreateIntent)");
    expect(controller).toContain("mutationFn: (intent: TaskCreateIntent)");
    expect(controller).toContain(
      "mutationFn: (intent: AssignmentCreateIntent)"
    );
    expect(controller).toContain("mutationFn: (intent: ProgressUpdateIntent)");
    expect(controller).toContain("discipleshipCommandTargetsJourney(");
    expect(controller).toContain(
      "progressCommandErrorAssignmentId.value = intent.assignmentId"
    );
    expect(assignments).toContain(
      "selectedAssignmentId === progressErrorAssignmentId"
    );
    expect(controller).not.toContain("mutationFn: () =>");
  });

  test("keeps presentation components outside transport ownership", () => {
    for (const source of [catalog, filters, assignments, editor, progress]) {
      expect(source).not.toContain("@/core/api");
      expect(source).not.toContain("useQuery");
      expect(source).not.toContain("useMutation");
    }
  });

  test("localizes refresh recovery copy for every supported locale", () => {
    expect(i18n.match(/"discipleship\.libraryRefreshFailed"/g)).toHaveLength(
      4
    );
    expect(
      i18n.match(/"discipleship\.structureRefreshFailed"/g)
    ).toHaveLength(4);
    expect(
      i18n.match(/"discipleship\.assignmentsRefreshFailed"/g)
    ).toHaveLength(4);
  });
});
