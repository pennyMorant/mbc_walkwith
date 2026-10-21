import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../src/features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue", import.meta.url),
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
  it("keeps revision-safe mutations and response moderation page-owned", () => {
    expect(pageSource).toContain("createSermonDiscussionGuide");
    expect(pageSource).toContain("updateSermonDiscussionGuide");
    expect(pageSource).toContain("expectedRevision");
    expect(pageSource).toContain("hideSermonDiscussionResponse");
    expect(pageSource).toContain("buildGuideCreatePayload");
    expect(pageSource).toContain("authStore.can");
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
