import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { PublicLandingMediaUsageProvider } from "../src/modules/public/public_landing_media_usage.provider.js";
import { MediaUsageService } from "../src/modules/media/media_usage.service.js";
import { InMemorySettingsRepository } from "../src/modules/settings/in-memory-settings.repository.js";

describe("public landing media usage provider", () => {
  it("finds every supported canonical landing image slot", async () => {
    const mediaId = randomUUID();
    const repository = new InMemorySettingsRepository();
    await setMediaId(repository, "publicLanding.hero", (value) => ({
      ...value,
      imageMediaId: mediaId
    }));
    await setMediaId(repository, "publicLanding.service", (value) => ({
      ...value,
      imageMediaId: mediaId
    }));
    await setMediaId(repository, "publicLanding.people", (value) => ({
      ...value,
      items: [
        {
          id: "pastor",
          name: "Pastor",
          role: "Pastor",
          summary: "",
          imageMediaId: mediaId,
          sort: 0
        },
        {
          id: "leader",
          name: "Leader",
          role: "Leader",
          summary: "",
          imageMediaId: mediaId,
          sort: 0
        }
      ]
    }));
    await setMediaId(repository, "publicLanding.gallery", (value) => ({
      ...value,
      items: [
        {
          id: "worship",
          mediaId,
          altText: "Worship",
          title: "Worship",
          body: "",
          sort: 0
        }
      ]
    }));

    const usages = await new MediaUsageService([
      new PublicLandingMediaUsageProvider(repository)
    ]).list(mediaId);

    expect(usages.map((usage) => usage.slot).sort()).toEqual([
      "landing_gallery_image",
      "landing_hero_image",
      "landing_person_image",
      "landing_person_image",
      "landing_service_image"
    ]);
    expect(usages.map((usage) => usage.sourceId)).toEqual(
      expect.arrayContaining([
        "publicLanding.people#pastor",
        "publicLanding.people#leader"
      ])
    );
  });
});

async function setMediaId(
  repository: InMemorySettingsRepository,
  key: string,
  update: (value: Record<string, unknown>) => Record<string, unknown>
) {
  const setting = await repository.getByKey(key);
  expect(setting).not.toBeNull();
  await repository.update(key, {
    value: update(setting!.value as Record<string, unknown>)
  });
}
