import type { MediaAssetUsage } from "@mbc/api-contracts";

import type { MediaUsageProvider } from "../media/media_usage.service.js";
import type { SettingsRepository } from "../settings/settings.repository.js";
import {
  publicLandingSettingCategory,
  publicLandingSettingKeyParts
} from "./public_landing_defaults.js";
import { publicLandingSettingSchemaById } from "./public_landing_setting_schemas.js";
import { publicLandingMediaReferences } from "./public_landing_media_references.js";

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
      return publicLandingMediaReferences(parts.id, parsed.data)
        .filter((reference) => reference.mediaId === mediaId)
        .map((reference) => ({
          source: "public_landing" as const,
          sourceId: reference.itemId
            ? `${setting.key}#${reference.itemId}`
            : setting.key,
          sourceLabel: reference.itemLabel
            ? `${setting.label}: ${reference.itemLabel}`
            : setting.label,
          slot: reference.slot
        }));
    });
  }
}
