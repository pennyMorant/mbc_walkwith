import { describe, expect, test } from "bun:test";

import {
  createLifePostLibraryFilterForm,
  lifePostLibraryFilterSnapshot,
  resetLifePostLibraryFilterForm,
  sameLifePostLibraryFilters
} from "../src/features/life-posts/life_post_library_models";

describe("life post library query state", () => {
  test("keeps editable filters separate from the applied snapshot", () => {
    const form = createLifePostLibraryFilterForm();
    form.query = "  Sunday gathering  ";
    form.visibility = "members";

    const snapshot = lifePostLibraryFilterSnapshot(form);

    expect(snapshot).toEqual({
      query: "Sunday gathering",
      visibility: "members",
      status: ""
    });
    expect(form.query).toBe("  Sunday gathering  ");
    expect(
      sameLifePostLibraryFilters(
        snapshot,
        lifePostLibraryFilterSnapshot(form)
      )
    ).toBeTrue();
  });

  test("clears filters without replacing reactive identity", () => {
    const form = createLifePostLibraryFilterForm();
    const identity = form;
    form.query = "bulletin";
    form.status = "published";

    resetLifePostLibraryFilterForm(form);

    expect(form).toBe(identity);
    expect(form).toEqual(createLifePostLibraryFilterForm());
  });

  test("keeps query intents page-owned and presentation transport-free", async () => {
    const [query, page, card, filters] = await Promise.all([
      Bun.file(
        new URL(
          "../src/features/life-posts/composables/use_life_post_library_query.ts",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/life-posts/pages/LifePostsPage.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/life-posts/components/LifePostLibraryCard.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/life-posts/components/LifePostLibraryFilters.vue",
          import.meta.url
        )
      ).text()
    ]);

    expect(query).toContain('queryKey: ["life-posts", appliedFilters]');
    expect(query).toContain("postsQuery.data.value !== undefined");
    expect(page).toContain('@apply="applyPostFilters"');
    expect(page).toContain('@clear="clearPostFilters"');
    expect(page).toContain('@retry="refreshPosts"');
    for (const source of [card, filters]) {
      expect(source).not.toContain("@/core/api/life_posts");
      expect(source).not.toContain("@update:model-value");
      expect(source).not.toContain("@keyup.enter");
      expect(source).not.toContain("refetch");
    }
    expect(card).toContain("AdminResponsiveTable");
    expect(card).toContain('<template #desktop>');
    expect(card).toContain('<template #mobile>');
    expect(card).not.toContain('class="d-none d-md-block"');
    expect(card).not.toContain('class="d-md-none"');
    expect(card).toContain("<AdminMobileRecord");
    expect(card).toContain("@activate=\"emit('open', post)\"");
  });

  test("localizes library recovery copy for every supported locale", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();

    for (const key of lifeLibraryKeys) {
      expect(source.split(`${JSON.stringify(key)}:`).length - 1).toBe(4);
    }
  });
});

const lifeLibraryKeys = [
  "life.applyFilters",
  "life.clearFilters",
  "life.noPosts",
  "life.refreshFailed"
] as const;
