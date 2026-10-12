import type {
  AppSetting,
  AppSettingListQuery,
  AppSettingUpdateRequest
} from "@mbc/api-contracts";
import { and, eq, ilike, or } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { appSettings } from "../../shared/db/schema.js";
import type { SettingsRepository } from "./settings.repository.js";
import { seedSettingByKey, seedSettings } from "./settings_seed_data.js";

export class PostgresSettingsRepository implements SettingsRepository {
  constructor(private readonly db: AppDb) {}

  async list(query: AppSettingListQuery): Promise<AppSetting[]> {
    const filters = [
      query.category ? eq(appSettings.category, query.category) : undefined,
      query.query
        ? or(
            ilike(appSettings.key, `%${query.query}%`),
            ilike(appSettings.category, `%${query.query}%`),
            ilike(appSettings.label, `%${query.query}%`),
            ilike(appSettings.description, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(appSettings)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(appSettings.key)
      .limit(query.limit + seedSettings.length);
    return mergeSeedSettings(rows.map(settingFromRow), query);
  }

  async getByKey(key: string): Promise<AppSetting | null> {
    const [row] = await this.db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
    return row ? settingFromRow(row) : (seedSettingByKey.get(key) ?? null);
  }

  async update(
    key: string,
    input: AppSettingUpdateRequest
  ): Promise<AppSetting | null> {
    const seedSetting = seedSettingByKey.get(key);
    const timestamp = new Date();
    const [row] = seedSetting
      ? await this.db
          .insert(appSettings)
          .values({
            key,
            category: seedSetting.category,
            label: seedSetting.label,
            description: seedSetting.description,
            value: input.value,
            updatedAt: timestamp
          })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: {
              value: input.value,
              updatedAt: timestamp
            }
          })
          .returning()
      : await this.db
          .update(appSettings)
          .set({
            value: input.value,
            updatedAt: timestamp
          })
          .where(eq(appSettings.key, key))
          .returning();
    return row ? settingFromRow(row) : null;
  }
}

type AppSettingRow = typeof appSettings.$inferSelect;

function settingFromRow(row: AppSettingRow): AppSetting {
  return {
    key: row.key,
    category: row.category,
    label: row.label,
    description: row.description,
    value: row.value,
    updatedAt: row.updatedAt.toISOString()
  };
}

function mergeSeedSettings(
  rows: AppSetting[],
  query: AppSettingListQuery
): AppSetting[] {
  const merged = new Map(rows.map((setting) => [setting.key, setting]));
  for (const setting of seedSettings) {
    if (!merged.has(setting.key) && settingMatchesQuery(setting, query)) {
      merged.set(setting.key, setting);
    }
  }
  return [...merged.values()]
    .filter((setting) => settingMatchesQuery(setting, query))
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(0, query.limit);
}

function settingMatchesQuery(setting: AppSetting, query: AppSettingListQuery) {
  if (query.category && setting.category !== query.category) {
    return false;
  }
  const normalizedQuery = query.query?.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  return [setting.key, setting.category, setting.label, setting.description]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}
