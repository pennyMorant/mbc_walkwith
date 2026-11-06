import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const component = readFileSync(
  new URL("../src/components/LandingSectionHeading.vue", import.meta.url),
  "utf8"
);

const consumers = [
  "PeopleSection.vue",
  "MissionSection.vue",
  "UpcomingEventsSection.vue",
  "ChurchEntranceSection.vue",
  "GallerySection.vue",
  "ScheduleSection.vue"
].map((file) =>
  readFileSync(new URL(`../src/components/${file}`, import.meta.url), "utf8")
);

describe("landing section heading", () => {
  test("owns the shared heading hierarchy and existing style variants", () => {
    expect(component).toContain('class="eyebrow"');
    expect(component).toContain("<h2>{{ title }}</h2>");
    expect(component).toContain("'gallery-heading'");
    expect(component).toContain("'section-heading'");
    expect(component).toContain("{ narrow }");
  });

  test("is reused by standard landing sections", () => {
    for (const source of consumers) {
      expect(source).toContain("LandingSectionHeading");
      expect(source).not.toContain('<p class="eyebrow">');
    }
  });
});
