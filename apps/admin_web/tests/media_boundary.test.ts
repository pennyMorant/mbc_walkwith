import { describe, expect, test } from "bun:test";

describe("admin media boundary", () => {
  test("uses media permissions, API helpers, and complete locale copy", async () => {
    const [router, shell, messages, page, api] = await Promise.all([
      Bun.file(new URL("../src/router.ts", import.meta.url)).text(),
      Bun.file(new URL("../src/layouts/AdminShell.vue", import.meta.url)).text(),
      Bun.file(new URL("../src/core/i18n/i18n.ts", import.meta.url)).text(),
      Bun.file(
        new URL("../src/features/media/pages/MediaPage.vue", import.meta.url)
      ).text(),
      Bun.file(new URL("../src/core/api/media.ts", import.meta.url)).text()
    ]);

    expect(router).toContain('path: "/media"');
    expect(router).toContain('meta: adminPageMeta("media:read")');
    expect(shell).toContain('permission: "media:read"');
    expect(page).toContain("MediaLibraryCard");
    expect(page).toContain("MediaCleanupCard");
    expect(api).toContain("listMediaAssets");
    expect(api).toContain("updateMediaAsset");
    expect(api).toContain("apiClient.patchData");
    for (const key of [
      "nav.media",
      "media.title",
      "media.subtitle",
      "media.cleanupTitle",
      "media.cleanupSubtitle",
      "media.cleanupEmpty",
      "media.asset",
      "media.libraryTitle",
      "media.librarySubtitle",
      "media.libraryEmpty",
      "media.editTitle",
      "media.upload",
      "media.visibility",
      "media.consentStatus",
      "media.altText",
      "media.caption",
      "media.copyrightSource",
      "media.focalX",
      "media.focalY",
      "media.size",
      "restricted",
      "relocated_source"
    ]) {
      expect(messages.match(new RegExp(`"${key}"`, "g"))?.length).toBe(4);
    }
  });
});
