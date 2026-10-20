import { describe, expect, test } from "bun:test";

describe("admin media boundary", () => {
  test("uses media permissions, API helpers, and complete locale copy", async () => {
    const [router, shell, messages, page, api, landingEditor] =
      await Promise.all([
        Bun.file(new URL("../src/router.ts", import.meta.url)).text(),
        Bun.file(
          new URL("../src/layouts/AdminShell.vue", import.meta.url)
        ).text(),
        Bun.file(new URL("../src/core/i18n/i18n.ts", import.meta.url)).text(),
        Bun.file(
          new URL("../src/features/media/pages/MediaPage.vue", import.meta.url)
        ).text(),
        Bun.file(new URL("../src/core/api/media.ts", import.meta.url)).text(),
        Bun.file(
          new URL(
            "../src/features/settings/components/PublicLandingStructuredEditor.vue",
            import.meta.url
          )
        ).text()
      ]);

    expect(router).toContain('path: "/media"');
    expect(router).toContain('meta: adminPageMeta("media:read")');
    expect(shell).toContain('permission: "media:read"');
    expect(page).toContain("MediaLibraryCard");
    expect(page).toContain("MediaCleanupCard");
    expect(api).toContain("listMediaAssets");
    expect(api).toContain("listMediaAssetUsages");
    expect(api).toContain("updateMediaAsset");
    expect(api).toContain("apiClient.patchData");
    expect(landingEditor).toContain("PublicLandingHeroEditor");
    expect(landingEditor).toContain("PublicLandingServiceEditor");
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
      "media.usagesTitle",
      "media.usagesSubtitle",
      "media.usagesEmpty",
      "media.restrictConfirmTitle",
      "media.restrictConfirmBody",
      "media.restrictConfirmAction",
      "restricted",
      "life_post",
      "public_landing",
      "life_post_image",
      "landing_hero_image",
      "landing_service_image",
      "landing_person_image",
      "landing_gallery_image",
      "settings.landing.heroKicker",
      "settings.landing.primaryActions",
      "settings.landing.quickActions",
      "settings.landing.serviceFacts",
      "settings.landing.serviceActions",
      "settings.landing.addAction",
      "settings.landing.emptyActions",
      "settings.landing.addFact",
      "settings.landing.emptyFacts",
      "settings.landing.factLabel",
      "settings.landing.actionTitle",
      "settings.landing.actionSubtitle",
      "settings.landing.actionHref",
      "settings.landing.iconName",
      "settings.landing.actionKind",
      "settings.landing.actionTarget",
      "settings.landing.actionKind.anchor",
      "settings.landing.actionKind.external_link",
      "settings.landing.actionKind.map",
      "settings.landing.actionKind.phone",
      "settings.landing.actionKind.email",
      "settings.landing.actionTarget.same_tab",
      "settings.landing.actionTarget.new_tab",
      "relocated_source"
    ]) {
      expect(messages.match(new RegExp(`"${key}"`, "g"))?.length).toBe(4);
    }
  });
});
