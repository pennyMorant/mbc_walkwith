import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../src/features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue", import.meta.url),
  "utf8"
);
const controllerSource = readFileSync(
  new URL(
    "../src/features/sermon-discussion-guides/composables/use_sermon_discussion_guides_page.ts",
    import.meta.url
  ),
  "utf8"
);
const presentationSources = [
  "SermonDiscussionGuideFiltersCard.vue",
  "SermonDiscussionGuideListCard.vue"
].map((fileName) =>
  readFileSync(
    new URL(`../src/features/sermon-discussion-guides/components/${fileName}`, import.meta.url),
    "utf8"
  )
);

describe("sermon discussion guide page composition", () => {
  it("keeps revision-safe mutations and response moderation controller-owned", () => {
    expect(controllerSource).toContain("createSermonDiscussionGuide");
    expect(controllerSource).toContain("updateSermonDiscussionGuide");
    expect(controllerSource).toContain("expectedRevision");
    expect(controllerSource).toContain("hideSermonDiscussionResponse");
    expect(controllerSource).toContain("sermonDiscussionGuidePayload");
    expect(controllerSource).toContain("authStore.can");
    expect(pageSource).toContain("useSermonDiscussionGuidesPage");
    expect(pageSource).not.toContain("useMutation");
    expect(pageSource).not.toContain("useQuery");
  });

  it("delegates filters and results without moving transport ownership", () => {
    expect(pageSource).toContain("<SermonDiscussionGuideFiltersCard");
    expect(pageSource).toContain("<SermonDiscussionGuideListCard");
    for (const source of presentationSources) {
      expect(source).not.toContain("@/core/api/");
      expect(source).not.toContain("useMutation");
      expect(source).not.toContain("useAdminAuthStore");
    }
  });
});
