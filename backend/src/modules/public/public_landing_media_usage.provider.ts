import type {
  MediaAssetUsage,
  PublicLandingGallerySetting,
  PublicLandingHeroSetting,
  PublicLandingPeopleSetting,
  PublicLandingServiceSetting
} from "@mbc/api-contracts";

import type { MediaUsageProvider } from "../media/media_usage.service.js";
import type { SettingsRepository } from "../settings/settings.repository.js";
import {
  publicLandingSettingCategory,
  publicLandingSettingKeyParts
} from "./public_landing_defaults.js";
import { publicLandingSettingSchemaById } from "./public_landing_setting_schemas.js";

export class PublicLandingMediaUsageProvider implements MediaUsageProvider {
  constructor(private readonly repository: SettingsRepository) {}

  async listUsages(mediaId: string): Promise<MediaAssetUsage[]> {
    const settings = await this.repository.list({
      category: publicLandingSettingCategory,
      limit: 200
    });
    return settings.flatMap((setting) => {
      const parts = publicLandingSettingKeyParts(setting.key);
      const schema = parts
        ? publicLandingSettingSchemaById.get(parts.id)
        : undefined;
      const parsed = schema?.safeParse(setting.value);
      if (!parts || !parsed?.success) return [];
      return usagesForSetting(
        mediaId,
        setting.key,
        setting.label,
        parts.id,
        parsed.data
      );
    });
  }
}

function usagesForSetting(
  mediaId: string,
  sourceId: string,
  settingLabel: string,
  settingId: string,
  value: unknown
): MediaAssetUsage[] {
  if (settingId === "hero") {
    const hero = value as PublicLandingHeroSetting;
    return hero.imageMediaId === mediaId
      ? [usage(sourceId, settingLabel, "landing_hero_image")]
      : [];
  }
  if (settingId === "service") {
    const service = value as PublicLandingServiceSetting;
    return service.imageMediaId === mediaId
      ? [usage(sourceId, settingLabel, "landing_service_image")]
      : [];
  }
  if (settingId === "people") {
    const people = value as PublicLandingPeopleSetting;
    return people.items
      .filter((person) => person.imageMediaId === mediaId)
      .map((person) =>
        usage(
          `${sourceId}#${person.id}`,
          `${settingLabel}: ${person.name}`,
          "landing_person_image"
        )
      );
  }
  if (settingId === "gallery") {
    const gallery = value as PublicLandingGallerySetting;
    return gallery.items
      .filter((item) => item.mediaId === mediaId)
      .map((item) =>
        usage(
          `${sourceId}#${item.id}`,
          `${settingLabel}: ${item.title || item.altText || item.id}`,
          "landing_gallery_image"
        )
      );
  }
  return [];
}

function usage(
  sourceId: string,
  sourceLabel: string,
  slot: MediaAssetUsage["slot"]
): MediaAssetUsage {
  return {
    source: "public_landing",
    sourceId,
    sourceLabel,
    slot
  };
}
