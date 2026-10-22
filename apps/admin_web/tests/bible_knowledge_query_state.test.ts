import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL(
    "../src/features/bible-knowledge/pages/BibleKnowledgePage.vue",
    import.meta.url
  ),
  "utf8"
);
const list = readFileSync(
  new URL(
    "../src/features/bible-knowledge/components/BibleKnowledgeEntityListCard.vue",
    import.meta.url
  ),
  "utf8"
);

describe("Bible knowledge query state", () => {
  test("keeps draft filters separate from applied query values", () => {
    expect(page).toContain("const appliedFilters = ref<BibleKnowledgeListFilters>");
    expect(page).toContain("function applyFilters()");
    expect(page).toContain('@apply-filters="applyFilters"');
  });

  test("keeps list query presentation component-owned", () => {
    expect(list).toContain("AdminDataState");
    expect(list).toContain("$emit('retry')");
    expect(list).not.toContain("@/core/api/");
    expect(list).not.toContain("useQuery");
    expect(page).toContain('@retry="entitiesQuery.refetch()"');
  });

  test("keeps existing entities visible when background refresh fails", () => {
    expect(list).toContain(
      ':pending="(isPending || isFetching) && entities.length === 0"'
    );
    expect(list).toContain('v-if="entities.length > 0 && errorMessage"');
    expect(page).toContain(':error-message="entitiesErrorMessage"');
  });

  test("targets update and delete by the selected canonical locale key", () => {
    expect(page).toContain("locale: entity.locale");
    expect(page).toContain("translationId: entity.translationId");
    expect(page).not.toContain("locale: filters.locale,");
    expect(page).not.toContain("translationId: filters.translationId\n    });");
  });

  test("offers every canonical knowledge status in the directory filter", () => {
    for (const status of [
      "draft",
      "processing",
      "needs_review",
      "published",
      "archived",
      "failed"
    ]) {
      expect(list).toContain(`'${status}'`);
    }
  });

  test("keeps query failures separate from editor command failures", () => {
    expect(page).toContain("entitiesErrorMessage");
    expect(page).toContain("entityMutationErrorMessage");
    expect(page).toContain(':error-message="entityMutationErrorMessage"');
  });
});
