import { describe, expect, test } from "bun:test";

const paths = {
  controller: "../src/features/newcomers/composables/use_newcomer_page.ts",
  filters: "../src/features/newcomers/components/NewcomerFiltersCard.vue",
  listQuery: "../src/features/newcomers/composables/use_newcomer_list_query.ts",
  page: "../src/features/newcomers/pages/NewcomersPage.vue",
  results: "../src/features/newcomers/components/NewcomerResults.vue"
};

describe("newcomer query state", () => {
  test("keeps draft filters separate from the applied query snapshot", async () => {
    const [query, page, filters] = await Promise.all([
      Bun.file(new URL(paths.listQuery, import.meta.url)).text(),
      Bun.file(new URL(paths.page, import.meta.url)).text(),
      Bun.file(new URL(paths.filters, import.meta.url)).text()
    ]);

    expect(query).toContain('queryKey: ["newcomers", appliedFilters]');
    expect(query).toContain("newcomerListFilterSnapshot(filters)");
    expect(query).toContain("sameNewcomerListFilters");
    expect(query).toContain("exact: true");
    expect(page).toContain("<NewcomerFiltersCard");
    expect(page).toContain('@apply="applyFilters"');
    expect(page).toContain('@clear="clearFilters"');
    expect(page).toContain('@retry="refreshList"');
    expect(page).not.toContain("@keyup.enter");
    expect(filters).not.toContain("@/core/api");
    expect(filters).not.toContain("refetch");
    expect(filters).not.toContain("@update:model-value");
  });

  test("preserves the last successful list during refresh failures", async () => {
    const [query, results, page] = await Promise.all([
      Bun.file(new URL(paths.listQuery, import.meta.url)).text(),
      Bun.file(new URL(paths.results, import.meta.url)).text(),
      Bun.file(new URL(paths.page, import.meta.url)).text()
    ]);

    expect(query).toContain("data.value === undefined");
    expect(query).toContain("data.value !== undefined");
    expect(results).toContain('v-if="refreshErrorMessage"');
    expect(page).toContain(':refresh-error-message="listRefreshErrorMessage"');
  });

  test("keeps follow-up recovery and async form ownership in the drawer flow", async () => {
    const [controller, page] = await Promise.all([
      Bun.file(new URL(paths.controller, import.meta.url)).text(),
      Bun.file(new URL(paths.page, import.meta.url)).text()
    ]);

    expect(controller).toContain("followUpsInitialErrorMessage");
    expect(controller).toContain("followUpsRefreshErrorMessage");
    expect(controller).toContain(
      "context?.newcomerId === selectedNewcomer.value?.id"
    );
    expect(page).toContain("<AdminDataState");
    expect(page).toContain(':error-message="followUpsInitialErrorMessage"');
    expect(page).toContain('v-if="followUpsRefreshErrorMessage"');
    expect(page).toContain('v-if="mutationErrorMessage"');
  });

  test("localizes filter actions and refresh failure in every locale", async () => {
    const messages = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();

    expect(messages.match(/newcomers\.applyFilters/g)).toHaveLength(4);
    expect(messages.match(/newcomers\.clearFilters/g)).toHaveLength(4);
    expect(messages.match(/newcomers\.refreshFailed/g)).toHaveLength(4);
  });
});
