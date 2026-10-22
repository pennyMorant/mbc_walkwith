import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL(
    "../src/features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue",
    import.meta.url
  ),
  "utf8"
);
const list = readFileSync(
  new URL(
    "../src/features/sermon-discussion-guides/components/SermonDiscussionGuideListCard.vue",
    import.meta.url
  ),
  "utf8"
);
const responses = readFileSync(
  new URL(
    "../src/features/sermon-discussion-guides/components/SermonDiscussionResponsesPanel.vue",
    import.meta.url
  ),
  "utf8"
);

describe("sermon discussion guide query states", () => {
  test("keeps guide filters separate from applied query values", () => {
    expect(page).toContain("const appliedFilters = ref<SermonDiscussionGuideFilters>");
    expect(page).toContain("function applyGuideFilters()");
    expect(page).toContain('@refresh="applyGuideFilters"');
  });

  test("keeps guide catalog query state presentation-only", () => {
    expect(list).toContain("AdminDataState");
    expect(list).toContain("$emit('retry')");
    expect(list).not.toContain("@/core/api/");
    expect(list).not.toContain("useQuery");
    expect(page).toContain('@retry="guidesQuery.refetch()"');
  });

  test("preserves responses while a background refresh fails", () => {
    expect(responses).toContain(
      ':pending="(pending || fetching) && responses.length === 0"'
    );
    expect(responses).toContain('v-if="responses.length > 0 && errorMessage"');
    expect(responses).toContain("$emit('refresh')");
    expect(responses).not.toContain("@/core/api/");
    expect(page).toContain(":fetching=\"Boolean(selectedGuide) && responsesQuery.isFetching.value\"");
  });

  test("keeps query and command failures separate", () => {
    expect(page).toContain('v-if="mutationErrorMessage"');
    expect(page).toContain(':error-message="guideErrorMessage"');
    expect(page).toContain(':error-message="responseErrorMessage"');
    expect(page).not.toContain("guideErrorMessage.value || mutationErrorMessage.value");
  });
});
