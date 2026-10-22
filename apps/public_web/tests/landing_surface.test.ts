import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import { splitMissionPhrases } from "../src/core/mission_phrases";
import { stepGalleryIndex } from "../src/core/gallery_navigation";
import { createLandingDocumentMetadata } from "../src/core/document_metadata";

const app = readFileSync(new URL("../src/App.vue", import.meta.url), "utf8");
const languageMenu = readFileSync(
  new URL("../src/components/LandingLanguageMenu.vue", import.meta.url),
  "utf8"
);
const intro = readFileSync(
  new URL("../src/components/OpeningIntro.vue", import.meta.url),
  "utf8"
);
const gallery = readFileSync(
  new URL("../src/components/GallerySection.vue", import.meta.url),
  "utf8"
);
const mediaImage = readFileSync(
  new URL("../src/components/LandingMediaImage.vue", import.meta.url),
  "utf8"
);
const loadState = readFileSync(
  new URL("../src/components/LandingLoadState.vue", import.meta.url),
  "utf8"
);
const loadBackdrop = readFileSync(
  new URL("../src/components/LandingLoadBackdrop.vue", import.meta.url),
  "utf8"
);
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

describe("public landing surface", () => {
  test("keeps language selection outside a persistent app bar", () => {
    expect(app).toContain("LandingLanguageMenu");
    expect(app).toContain('@change="setLocale"');
    expect(languageMenu).toContain("mdi-translate");
    expect(languageMenu).not.toContain("v-app-bar");
  });

  test("provides a localized keyboard path to the main landing content", () => {
    expect(app).toContain('class="landing-skip-link"');
    expect(app).toContain('href="#main-content"');
    expect(app).toContain('id="main-content"');
    expect(app).toContain('tabindex="-1"');
    expect(styles).toContain(".landing-skip-link:focus");
    expect(styles).toContain(".quick-action:focus-visible");
    expect(styles).toContain(".gallery-item:focus-visible");
  });

  test("uses stable action identity for hero quick links", () => {
    const hero = readFileSync(
      new URL("../src/components/HeroSection.vue", import.meta.url),
      "utf8"
    );
    expect(hero).toContain(':key="action.id"');
    expect(hero).not.toContain(':key="action.href"');
  });

  test("builds locale-aware share and search metadata from landing content", () => {
    const metadata = createLandingDocumentMetadata(
      {
        hero: { imageUrl: "/hero.jpg" },
        identity: {
          englishName: "Example Church",
          logoUrl: "/logo.png",
          mission: "Formar discípulos, enviar obreros y guiar personas a Cristo",
          name: "Iglesia de Ejemplo"
        },
        locale: "es",
        updatedAt: "2026-10-21T00:00:00.000Z"
      },
      "https://example.org/?intro=1#mission"
    );

    expect(metadata.canonicalUrl).toBe("https://example.org/");
    expect(metadata.description).toBe(
      "Iglesia de Ejemplo. Formar discípulos, enviar obreros y guiar personas a Cristo."
    );
    expect(metadata.openGraphLocale).toBe("es_US");
    expect(metadata.iconUrl).toContain("https://example.org/logo.png?v=");
    expect(metadata.shareImageUrl).toContain("https://example.org/hero.jpg?v=");
    expect(metadata.structuredData).toMatchObject({
      "@type": "Church",
      name: "Iglesia de Ejemplo",
      url: "https://example.org/"
    });
  });

  test("uses the public logo when no hero share image is configured", () => {
    const metadata = createLandingDocumentMetadata(
      {
        hero: { imageUrl: "" },
        identity: {
          englishName: "Example Church",
          logoUrl: "/logo.png",
          mission: "造就门徒，差派工人，领人归主。",
          name: "示例教会"
        },
        locale: "zh-Hans",
        updatedAt: "2026-10-21T00:00:00.000Z"
      },
      "https://example.org/"
    );

    expect(metadata.description).toBe("示例教会，造就门徒，差派工人，领人归主。");
    expect(metadata.shareImageUrl).toBe(metadata.iconUrl);
  });

  test("preserves loaded content while locale refresh state stays recoverable", () => {
    expect(app).toContain(":is-loading=\"isLoading\"");
    expect(app).toContain("hasError ? t('refreshError') : ''");
    expect(app).toContain('@retry="retry"');
    expect(languageMenu).toContain("landing-language-error");
  });

  test("keeps locale choice available while the first request is pending or failed", () => {
    expect(app.indexOf("<LandingLanguageMenu")).toBeLessThan(
      app.indexOf('<template v-if="content">')
    );
    expect(app).toContain("content && hasError ? t('refreshError') : ''");
    expect(loadState).toContain(':aria-busy="isLoading"');
    expect(loadState).toContain(":role=\"isLoading ? 'status' : 'alert'\"");
  });

  test("uses presentation-only loading media frames without fake content", () => {
    expect(loadState).toContain("LandingLoadBackdrop");
    expect(loadBackdrop).toContain("landing-load-frame--left");
    expect(loadBackdrop).toContain("prefers-reduced-motion: reduce");
    expect(loadBackdrop).not.toContain("fetch(");
    expect(loadBackdrop).not.toContain("href=");
  });

  test("does not hold reduced-motion visitors behind the opening overlay", () => {
    expect(intro).toContain('reduceMotion ? 120 : 4860');
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("keeps the language control compact across desktop and mobile", () => {
    expect(styles).toContain(".landing-language-control");
    expect(styles).toContain(".landing-language-button");
    expect(styles).toContain("env(safe-area-inset-top)");
    expect(styles).not.toContain("padding-bottom: 70px");
  });

  test("keeps the three mission directions separate in every supported language", () => {
    expect(splitMissionPhrases("Make disciples, send workers, lead people to Christ")).toEqual([
      "Make disciples",
      "send workers",
      "lead people to Christ"
    ]);
    expect(splitMissionPhrases("Formar discípulos, enviar obreros y guiar personas a Cristo")).toEqual([
      "Formar discípulos",
      "enviar obreros",
      "guiar personas a Cristo"
    ]);
    expect(splitMissionPhrases("造就门徒，差派工人，领人归主")).toEqual([
      "造就门徒",
      "差派工人",
      "领人归主"
    ]);
  });

  test("provides cyclic keyboard-friendly gallery navigation", () => {
    expect(stepGalleryIndex(0, 3, -1)).toBe(2);
    expect(stepGalleryIndex(2, 3, 1)).toBe(0);
    expect(stepGalleryIndex(0, 0, 1)).toBe(-1);
    expect(gallery).toContain('event.key === "ArrowLeft"');
    expect(gallery).toContain('event.key === "ArrowRight"');
    expect(gallery).toContain("v-dialog");
  });

  test("uses a shared visual fallback without changing media ownership", () => {
    expect(mediaImage).toContain('@error="failed = true"');
    expect(mediaImage).not.toContain("fetch(");
    expect(mediaImage).not.toContain("@/core/api/");
  });
});
