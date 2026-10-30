import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const paths = {
  controller:
    "../src/features/sermon-discussion-guides/composables/use_sermon_discussion_guides_page.ts",
  filters:
    "../src/features/sermon-discussion-guides/components/SermonDiscussionGuideFiltersCard.vue",
  list: "../src/features/sermon-discussion-guides/components/SermonDiscussionGuideListCard.vue",
  messages: "../src/core/i18n/i18n.ts",
  page: "../src/features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue",
  queries:
    "../src/features/sermon-discussion-guides/composables/use_sermon_discussion_guide_queries.ts",
  responses:
    "../src/features/sermon-discussion-guides/components/SermonDiscussionResponsesPanel.vue"
};

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("sermon discussion guide query states", () => {
  test("keeps draft filters separate from explicitly applied snapshots", () => {
    const queries = source(paths.queries);
    const page = source(paths.page);
    const filters = source(paths.filters);
    const responses = source(paths.responses);

    expect(queries).toContain("sermonDiscussionGuideFilterSnapshot(filters)");
    expect(queries).toContain("appliedResponseFilters");
    expect(page).toContain('@apply="applyGuideFilters"');
    expect(page).toContain('@apply="applyResponseFilters"');
    expect(filters).not.toContain("@update:model-value");
    expect(responses).not.toContain("@update:model-value");
  });

  test("preserves canonical data during background refresh failures", () => {
    const queries = source(paths.queries);
    const page = source(paths.page);
    const list = source(paths.list);
    const responses = source(paths.responses);

    expect(queries.match(/data.value === undefined/g)).toHaveLength(2);
    expect(queries.match(/data.value !== undefined/g)).toHaveLength(2);
    expect(page).toContain(':refresh-error-message="guideRefreshErrorMessage"');
    expect(page).toContain(':refresh-error-message="responseRefreshErrorMessage"');
    expect(list).toContain('v-if="refreshErrorMessage"');
    expect(responses).toContain('v-else-if="refreshErrorMessage"');
    expect(responses).toContain('v-if="selectedGuide"');
  });

  test("keeps query and command failures separate", () => {
    const controller = source(paths.controller);
    const page = source(paths.page);
    const responses = source(paths.responses);

    expect(controller).toContain("saveErrorMessage");
    expect(controller).toContain("hideResponseErrorMessage");
    expect(page).toContain('v-if="activePanel === \'guide\' && saveErrorMessage"');
    expect(page).toContain(':command-error-message="hideResponseErrorMessage"');
    expect(responses).toContain('v-if="commandErrorMessage"');
  });

  test("guards saved results with frozen resource intents", () => {
    const controller = source(paths.controller);

    expect(controller).toContain("sermonDiscussionGuidePayload(guideForm");
    expect(controller).toContain("expectedRevision: guide.revision");
    expect(controller).toContain("sermonDiscussionCommandTargetsSelection");
    expect(controller).toContain("guideId: selectedGuide.value.id");
    expect(controller).not.toContain("mutationFn: () =>");
  });

  test("keeps transport ownership outside presentation components", () => {
    for (const path of [paths.filters, paths.list, paths.responses]) {
      const component = source(path);
      expect(component).not.toContain("@/core/api/");
      expect(component).not.toContain("useQuery");
      expect(component).not.toContain("useMutation");
      expect(component).not.toContain("useAdminAuthStore");
    }
  });

  test("localizes refresh recovery copy for every supported locale", () => {
    const messages = source(paths.messages);

    expect(messages.match(/sermonGuides\.libraryRefreshFailed/g)).toHaveLength(
      4
    );
    expect(
      messages.match(/sermonGuides\.responsesRefreshFailed/g)
    ).toHaveLength(4);
  });
});
