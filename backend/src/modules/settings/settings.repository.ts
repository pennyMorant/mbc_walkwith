import type {
  AppSetting,
  AppSettingListQuery,
  AppSettingUpdateRequest
} from "@mbc/api-contracts";

export interface SettingsRepository {
  list(query: AppSettingListQuery): Promise<AppSetting[]>;
  getByKey(key: string): Promise<AppSetting | null>;
  update(key: string, input: AppSettingUpdateRequest): Promise<AppSetting | null>;
}
