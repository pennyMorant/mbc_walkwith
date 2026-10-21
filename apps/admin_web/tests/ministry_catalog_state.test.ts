import { describe, expect, test } from "bun:test";

const cases = [
  {
    component: "groups/components/GroupCatalogCard.vue",
    page: "groups/pages/GroupsPage.vue",
    query: "groupsQuery"
  },
  {
    component: "courses/components/CourseCatalogCard.vue",
    page: "courses/pages/CoursesPage.vue",
    query: "coursesQuery"
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

  test.each(cases)("keeps $page retry ownership", async ({ page, query }) => {
    const source = await Bun.file(
      new URL(`../src/features/${page}`, import.meta.url)
    ).text();

    expect(source).toContain(`@retry="${query}.refetch()"`);
  });
});
