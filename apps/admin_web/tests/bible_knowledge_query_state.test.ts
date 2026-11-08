import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL(
    "../src/features/bible-knowledge/pages/BibleKnowledgePage.vue",
    import.meta.url
  ),
  "utf8"
);
const query = readFileSync(
  new URL(
    "../src/features/bible-knowledge/composables/use_bible_knowledge_query.ts",
    import.meta.url
  ),
  "utf8"
);
const controller = readFileSync(
  new URL(
    "../src/features/bible-knowledge/composables/use_bible_knowledge_page.ts",
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
const messages = readFileSync(
  new URL("../src/core/i18n/i18n.ts", import.meta.url),
  "utf8"
);

describe("Bible knowledge query state", () => {
  test("keeps draft filters separate from applied query values", () => {
    expect(query).toContain("const appliedFilters = ref(");
    expect(query).toContain("function applyFilters()");
    expect(query).toContain("queryFn: ({ queryKey })");
    expect(page).toContain('@apply-filters="applyFilters"');
    expect(list).not.toContain('@update:model-value="$emit(\'applyFilters\')"');
  });

  test("keeps list query presentation component-owned", () => {
    expect(list).toContain("AdminDataState");
    expect(list).toContain("AdminResponsiveTable");
    expect(list).toContain('<template #desktop>');
    expect(list).toContain('<template #mobile>');
    expect(list).not.toContain("d-none d-md-block");
    expect(list).not.toContain("d-md-none");
    expect(list).toContain("$emit('retry')");
    expect(list).not.toContain("@/core/api/");
    expect(list).not.toContain("useQuery");
    expect(page).toContain('@retry="entitiesQuery.refetch()"');
  });

  test("keeps existing entities visible when background refresh fails", () => {
    expect(list).toContain(
      ':pending="(isPending || isFetching) && entities.length === 0"'
    );
    expect(list).toContain(':message="refreshErrorMessage"');
    expect(list).toContain("AdminRetryAlert");
    expect(list).toContain("!refreshErrorMessage && entities.length === 0");
    expect(query).toContain("const initialError = computed");
    expect(query).toContain("const refreshError = computed");
    expect(page).toContain(':refresh-error-message="refreshErrorMessage"');
  });

  test("targets update and delete by the selected canonical locale key", () => {
    expect(controller).toContain("locale: intent.key.locale");
    expect(controller).toContain("translationId: intent.key.translationId");
    expect(controller).toContain("commandTargetsCurrentEditor");
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
    expect(controller).toContain("initialErrorMessage");
    expect(controller).toContain("commandErrorMessage");
    expect(page).toContain(':error-message="commandErrorMessage"');
  });

  test("localizes refresh recovery copy for every supported locale", () => {
    expect(
      messages.match(/"bibleKnowledge\.libraryRefreshFailed"/g)
    ).toHaveLength(4);
  });
});
