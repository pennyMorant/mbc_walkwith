import { describe, expect, test } from "bun:test";

const paths = {
  controller: "../src/features/prayer/composables/use_prayer_page.ts",
  drawer: "../src/features/prayer/components/PrayerModerationDrawer.vue",
  listQuery: "../src/features/prayer/composables/use_prayer_list_query.ts",
  page: "../src/features/prayer/pages/PrayerPage.vue",
  table: "../src/features/prayer/components/PrayerRequestsTable.vue"
};

describe("prayer query and command state", () => {
  test("applies filter snapshots only through explicit intents", async () => {
    const [query, page, table] = await Promise.all([
      Bun.file(new URL(paths.listQuery, import.meta.url)).text(),
      Bun.file(new URL(paths.page, import.meta.url)).text(),
      Bun.file(new URL(paths.table, import.meta.url)).text()
    ]);

    expect(query).toContain('queryKey: ["prayer-requests", appliedFilters]');
    expect(query).toContain("prayerListFilterSnapshot(filters)");
    expect(query).toContain("samePrayerListFilters");
    expect(query).toContain("exact: true");
    expect(page).toContain('@apply="applyFilters"');
    expect(page).toContain('@clear="clearFilters"');
    expect(page).toContain('@retry="refreshList"');
    expect(table).not.toContain("@keyup.enter");
    expect(table).not.toContain("@update:model-value");
    expect(table).not.toContain("@/core/api");
    expect(table).toContain("AdminFilterToolbar");
    expect(table).toContain("admin-filter-control");
    expect(table).not.toContain("<v-form");
  });

  test("preserves canonical results when a refresh fails", async () => {
    const [query, page, table] = await Promise.all([
      Bun.file(new URL(paths.listQuery, import.meta.url)).text(),
      Bun.file(new URL(paths.page, import.meta.url)).text(),
      Bun.file(new URL(paths.table, import.meta.url)).text()
    ]);

    expect(query).toContain("data.value === undefined");
    expect(query).toContain("data.value !== undefined");
    expect(page).toContain(':error-message="listErrorMessage"');
    expect(page).toContain(':refresh-error-message="listRefreshErrorMessage"');
    expect(table).toContain("AdminDataState");
    expect(table).toContain("AdminRefreshAlert");
  });

  test("keeps responsive list presentation transport-free", async () => {
    const table = await Bun.file(new URL(paths.table, import.meta.url)).text();

    expect(table).toContain("AdminResponsiveTable");
    expect(table).toContain('<template #desktop>');
    expect(table).toContain('<template #mobile>');
    expect(table).not.toContain("d-none d-md-block");
    expect(table).not.toContain("d-md-none");
    expect(table.match(/v-for="request in requests"/g)).toHaveLength(2);
    expect(table).toContain("emit('open', request)");
    expect(table).not.toContain("auth_store");
  });

  test("guards moderation results and errors by active drawer context", async () => {
    const [controller, drawer, page] = await Promise.all([
      Bun.file(new URL(paths.controller, import.meta.url)).text(),
      Bun.file(new URL(paths.drawer, import.meta.url)).text(),
      Bun.file(new URL(paths.page, import.meta.url)).text()
    ]);

    expect(controller).toContain("prayerCommandTargetsSelection");
    expect(controller).toContain("commandPending");
    expect(controller).not.toContain("openRequest(request);");
    expect(controller).toContain("captureMutationError(error, intent.requestId)");
    expect(page).toContain(':error-message="mutationErrorMessage"');
    expect(page).toContain(':command-pending="commandPending"');
    expect(drawer).toContain(":disabled=\"!canModerate || commandPending\"");
  });
});
