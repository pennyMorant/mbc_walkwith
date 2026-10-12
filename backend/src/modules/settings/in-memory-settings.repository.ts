import type {
  AppSetting,
  AppSettingListQuery,
  AppSettingUpdateRequest
} from "@mbc/api-contracts";

import type { SettingsRepository } from "./settings.repository.js";
import { seedSettings } from "./settings_seed_data.js";

export class InMemorySettingsRepository implements SettingsRepository {
  private settings = new Map<string, AppSetting>(
    seedSettings.map((setting) => [setting.key, setting])
  );

  async list(query: AppSettingListQuery): Promise<AppSetting[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.settings.values()]
      .filter((setting) => {
        if (query.category && setting.category !== query.category) {
          return false;
        }
        if (normalizedQuery) {
          return [
            setting.key,
            setting.category,
            setting.label,
            setting.description
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(0, query.limit);
  }

  async getByKey(key: string): Promise<AppSetting | null> {
    return this.settings.get(key) ?? null;
  }

  async update(
    key: string,
    input: AppSettingUpdateRequest
  ): Promise<AppSetting | null> {
    const existing = this.settings.get(key);
    if (!existing) {
      return null;
    }
    const updated: AppSetting = {
      ...existing,
      value: input.value,
      updatedAt: new Date().toISOString()
    };
    this.settings.set(key, updated);
    return updated;
  }
}
