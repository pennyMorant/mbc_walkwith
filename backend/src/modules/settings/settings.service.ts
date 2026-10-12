import type {
  AppSetting,
  AppSettingListQuery,
  AppSettingUpdateRequest
} from "@mbc/api-contracts";

import { parsePublicLandingSettingValue } from "../public/public_landing_setting_schemas.js";
import { settingValueInvalid } from "./settings-errors.js";
import type { SettingsRepository } from "./settings.repository.js";

export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  list(query: AppSettingListQuery) {
    return this.repository.list(query);
  }

  async listPublic(query: AppSettingListQuery) {
    const settings = (
      await Promise.all(
        publicSettingKeys.map((key) => this.repository.getByKey(key))
      )
    ).filter(isAppSetting);
    return settings
      .filter((setting) => settingMatchesPublicQuery(setting, query))
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(0, query.limit);
  }

  getByKey(key: string) {
    return this.repository.getByKey(key);
  }

  update(key: string, input: AppSettingUpdateRequest) {
    if (key === "church.timezone") {
      return this.repository.update(key, {
        ...input,
        value: parseTimeZone(input.value)
      });
    }
    const publicLandingValue = parsePublicLandingSettingValue(key, input.value);
    if (publicLandingValue.handled) {
      return this.repository.update(key, {
        ...input,
        value: publicLandingValue.value
      });
    }

    return this.repository.update(key, input);
  }
}

function parseTimeZone(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw settingValueInvalid("church.timezone", {
      formErrors: ["Timezone must be a non-empty IANA timezone name."]
    });
  }
  const timeZone = value.trim();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(0));
  } catch {
    throw settingValueInvalid("church.timezone", {
      formErrors: ["Timezone must be a valid IANA timezone name."]
    });
  }
  return timeZone;
}

const publicSettingKeys = [
  "church.name",
  "church.timezone",
  "church.about",
  "church.address",
  "church.mapUrl",
  "church.contactPhone",
  "church.contactEmail",
  "app.defaultLocale",
  "features.prayerEnabled",
  "features.givingEnabled",
  "member.registrationMode",
  "member.requireEmailVerification",
  "member.requireAdminApproval",
  "member.registrationHelpText",
  "legal.privacyPolicyUrl",
  "legal.termsOfUseUrl"
];

function isAppSetting(setting: AppSetting | null): setting is AppSetting {
  return setting !== null;
}

function settingMatchesPublicQuery(
  setting: AppSetting,
  query: AppSettingListQuery
) {
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
