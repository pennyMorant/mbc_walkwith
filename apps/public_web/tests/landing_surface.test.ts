import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import { splitMissionPhrases } from "../src/core/mission_phrases";
import { stepGalleryIndex } from "../src/core/gallery_navigation";

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
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

describe("public landing surface", () => {
  test("keeps language selection outside a persistent app bar", () => {
    expect(app).toContain("LandingLanguageMenu");
    expect(app).toContain('@change="setLocale"');
    expect(languageMenu).toContain("mdi-translate");
    expect(languageMenu).not.toContain("v-app-bar");
  });

  test("preserves loaded content while locale refresh state stays recoverable", () => {
    expect(app).toContain(":is-loading=\"isLoading\"");
    expect(app).toContain("hasError ? t('refreshError') : ''");
    expect(app).toContain('@retry="retry"');
    expect(languageMenu).toContain("landing-language-error");
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
