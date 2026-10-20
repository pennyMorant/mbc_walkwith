import type {
  PublicLandingGallerySetting,
  PublicLandingHeroSetting,
  PublicLandingPeopleSetting,
  PublicLandingServiceSetting
} from "@mbc/api-contracts";

import type { PublicLandingSettingId } from "./public_landing_defaults.js";

export type PublicLandingMediaReference = {
  mediaId: string;
  itemId: string | null;
  itemLabel: string | null;
  slot:
    | "landing_hero_image"
    | "landing_service_image"
    | "landing_person_image"
    | "landing_gallery_image";
};

export function publicLandingMediaReferences(
  settingId: PublicLandingSettingId,
  value: unknown
): PublicLandingMediaReference[] {
  if (settingId === "hero") {
    const hero = value as PublicLandingHeroSetting;
    return hero.imageMediaId
      ? [reference(hero.imageMediaId, "landing_hero_image")]
      : [];
  }
  if (settingId === "service") {
    const service = value as PublicLandingServiceSetting;
    return service.imageMediaId
      ? [reference(service.imageMediaId, "landing_service_image")]
      : [];
  }
  if (settingId === "people") {
    const people = value as PublicLandingPeopleSetting;
    return people.items.flatMap((person) =>
      person.imageMediaId
        ? [
            reference(
              person.imageMediaId,
              "landing_person_image",
              person.id,
              person.name
            )
          ]
        : []
    );
  }
  if (settingId === "gallery") {
    const gallery = value as PublicLandingGallerySetting;
    return gallery.items.flatMap((item) =>
      item.mediaId
        ? [
            reference(
              item.mediaId,
              "landing_gallery_image",
              item.id,
              item.title || item.altText || item.id
            )
          ]
        : []
    );
  }
  return [];
}

function reference(
  mediaId: string,
  slot: PublicLandingMediaReference["slot"],
  itemId: string | null = null,
  itemLabel: string | null = null
): PublicLandingMediaReference {
  return { mediaId, itemId, itemLabel, slot };
}
