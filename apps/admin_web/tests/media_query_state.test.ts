import { describe, expect, test } from "bun:test";

const paths = {
  cleanup: "../src/features/media/components/MediaCleanupCard.vue",
  controller:
    "../src/features/media/composables/use_media_page_controller.ts",
  dialog: "../src/features/media/components/MediaAssetEditDialog.vue",
  library: "../src/features/media/components/MediaLibraryCard.vue",
  page: "../src/features/media/pages/MediaPage.vue",
  queries: "../src/features/media/composables/use_media_queries.ts",
  table: "../src/features/media/components/MediaAssetTable.vue"
};

describe("media query and command state", () => {
  test("applies filter snapshots only through explicit intents", async () => {
    const [queries, page] = await Promise.all([
      Bun.file(new URL(paths.queries, import.meta.url)).text(),
      Bun.file(new URL(paths.page, import.meta.url)).text()
    ]);

    expect(queries).toContain('queryKey: ["admin-media-assets", appliedFilters]');
    expect(queries).toContain("mediaLibraryFilterSnapshot(filters)");
    expect(queries).toContain("sameMediaLibraryFilters");
    expect(queries.match(/exact: true/g)).toHaveLength(2);
    expect(page).toContain('@apply="applyLibraryFilters"');
    expect(page).toContain('@clear="clearLibraryFilters"');
    expect(page).toContain('@retry="refreshLibrary"');
  });

  test("preserves canonical results when refreshes fail", async () => {
    const [queries, page, dialog] = await Promise.all([
      Bun.file(new URL(paths.queries, import.meta.url)).text(),
      Bun.file(new URL(paths.page, import.meta.url)).text(),
      Bun.file(new URL(paths.dialog, import.meta.url)).text()
    ]);

    expect(queries.match(/data.value === undefined/g)).toHaveLength(2);
    expect(queries.match(/data.value !== undefined/g)).toHaveLength(2);
    expect(page).toContain(':refresh-error-message="libraryRefreshErrorMessage"');
    expect(page).toContain(':refresh-error-message="cleanupRefreshErrorMessage"');
    expect(page).toContain(':usages-refresh-error="usagesRefreshErrorMessage"');
    expect(dialog).toContain("usagesRefreshError");
    expect(dialog).toContain("emit('retryUsages')");
  });

  test("keeps query and command ownership outside presentation components", async () => {
    const [controller, library, cleanup, dialog] = await Promise.all([
      Bun.file(new URL(paths.controller, import.meta.url)).text(),
      Bun.file(new URL(paths.library, import.meta.url)).text(),
      Bun.file(new URL(paths.cleanup, import.meta.url)).text(),
      Bun.file(new URL(paths.dialog, import.meta.url)).text()
    ]);

    for (const component of [library, cleanup, dialog]) {
      expect(component).not.toContain("@/core/api");
      expect(component).not.toContain("auth_store");
      expect(component).not.toContain("useQuery(");
      expect(component).not.toContain("useMutation(");
    }
    expect(controller).toContain("mediaCommandTargetsSelection");
    expect(controller).toContain("input: { ...input }");
    expect(controller).toContain("uploadErrorMessage");
    expect(controller).toContain("cleanupRetryErrorMessage");
  });

  test("provides desktop and mobile media projections", async () => {
    const [table, cleanup] = await Promise.all([
      Bun.file(new URL(paths.table, import.meta.url)).text(),
      Bun.file(new URL(paths.cleanup, import.meta.url)).text()
    ]);

    for (const component of [table, cleanup]) {
      expect(component).toContain("d-none d-md-block");
      expect(component).toContain("d-md-none");
    }
    expect(table.match(/v-for="asset in assets"/g)).toHaveLength(2);
    expect(cleanup.match(/v-for="task in tasks"/g)).toHaveLength(2);
  });
});
