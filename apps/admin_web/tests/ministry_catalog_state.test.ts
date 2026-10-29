import { describe, expect, test } from "bun:test";

const cases = [
  {
    component: "groups/components/GroupCatalogCard.vue",
    composable: "groups/composables/use_group_catalog_query.ts",
    page: "groups/pages/GroupsPage.vue",
    refresh: "refreshGroups"
  },
  {
    component: "courses/components/CourseCatalogCard.vue",
    composable: "courses/composables/use_course_catalog_query.ts",
    page: "courses/pages/CoursesPage.vue",
    refresh: "refreshCourses"
  }
];

describe("ministry catalog query states", () => {
  test.each(cases)("keeps $component presentation-only", async ({ component }) => {
    const source = await Bun.file(
      new URL(`../src/features/${component}`, import.meta.url)
    ).text();

    expect(source).toContain("AdminDataState");
    expect(source).toContain("$emit('retry')");
    expect(source).not.toContain("@/core/api");
    expect(source).not.toContain("auth_store");
  });

  test.each(cases)("keeps $page retry ownership", async ({ page, refresh }) => {
    const source = await Bun.file(
      new URL(`../src/features/${page}`, import.meta.url)
    ).text();

    expect(source).toContain(`@retry="${refresh}"`);
    expect(source).toContain("<AdminCatalogFilters");
    expect(source).not.toContain("@keyup.enter");
  });

  test.each(cases)(
    "keeps $composable filters explicit and preserves refresh snapshots",
    async ({ composable }) => {
      const source = await Bun.file(
        new URL(`../src/features/${composable}`, import.meta.url)
      ).text();

      expect(source).toContain("appliedFilters");
      expect(source).toContain("data.value !== undefined");
      expect(source).toContain("exact: true");
    }
  );

  test("keeps the shared filters presentation-only", async () => {
    const source = await Bun.file(
      new URL("../src/core/ui/AdminCatalogFilters.vue", import.meta.url)
    ).text();

    expect(source).not.toContain("@/core/api");
    expect(source).not.toContain("refetch");
    expect(source).not.toContain("@update:model-value");
  });

  test("localizes shared catalog recovery copy", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();
    for (const key of catalogKeys) {
      expect(source.split(`${JSON.stringify(key)}:`).length - 1).toBe(4);
    }
  });
});

const catalogKeys = [
  "catalog.applyFilters",
  "catalog.clearFilters",
  "courses.refreshFailed",
  "groups.refreshFailed"
] as const;
