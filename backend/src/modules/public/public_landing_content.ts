import {
  publicLandingActionSchema,
  publicLandingAppSectionSchema,
  publicLandingContactSectionSchema,
  publicLandingContentSchema,
  publicLandingEntranceSectionSchema,
  publicLandingEventsConfigSchema,
  publicLandingHeroSchema,
  publicLandingIdentitySchema,
  publicLandingMissionSectionSchema,
  publicLandingPeopleSectionSchema,
  publicLandingScheduleSectionSchema,
  publicLandingServiceSectionSchema,
  type AppSetting,
  type PublicLandingEvent,
  type SupportedLocale
} from "@mbc/api-contracts";
import { z, type ZodType } from "zod";

import { settingValueInvalid } from "../settings/settings-errors.js";
import type { SettingsService } from "../settings/settings.service.js";
import {
  publicLandingDefaultContent,
  publicLandingDefaultContentByLocale,
  publicLandingDefaultLocale,
  publicLandingSettingCategory,
  publicLandingSettingKey
} from "./public_landing_defaults.js";

const actionListSchema = z.array(publicLandingActionSchema);

export async function getPublicLandingContent(
  settingsService: SettingsService,
  locale: SupportedLocale = publicLandingDefaultLocale,
  events: PublicLandingEvent[] = []
) {
  const fallbackContent =
    publicLandingDefaultContentByLocale[locale] ?? publicLandingDefaultContent;
  const [settings, timeZoneSetting] = await Promise.all([
    settingsService.list({
      category: publicLandingSettingCategory,
      limit: 300
    }),
    settingsService.getByKey("church.timezone")
  ]);
  const settingByKey = new Map(settings.map((setting) => [setting.key, setting]));
  const sourceSchedule = settingValue(
    settingByKey,
    publicLandingSettingKey(publicLandingDefaultLocale, "schedule"),
    publicLandingScheduleSectionSchema,
    publicLandingDefaultContent.schedule
  );
  const sourcePeople = settingValue(
    settingByKey,
    publicLandingSettingKey(publicLandingDefaultLocale, "people"),
    publicLandingPeopleSectionSchema,
    publicLandingDefaultContent.people
  );
  const localizedSchedule = settingValue(
    settingByKey,
    publicLandingSettingKey(locale, "schedule"),
    publicLandingScheduleSectionSchema,
    fallbackContent.schedule
  );
  const localizedPeople = settingValue(
    settingByKey,
    publicLandingSettingKey(locale, "people"),
    publicLandingPeopleSectionSchema,
    fallbackContent.people
  );
  const { items: _fallbackEventItems, ...fallbackEventsConfig } =
    fallbackContent.events;
  const eventsConfig = settingValue(
    settingByKey,
    publicLandingSettingKey(locale, "events"),
    publicLandingEventsConfigSchema,
    fallbackEventsConfig
  );

  const content = publicLandingContentSchema.parse({
    locale,
    timeZone: settingString(timeZoneSetting, "America/Los_Angeles"),
    identity: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "identity"),
      publicLandingIdentitySchema,
      fallbackContent.identity
    ),
    brandAction: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "brandAction"),
      publicLandingActionSchema,
      fallbackContent.brandAction
    ),
    navigation: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "navigation"),
      actionListSchema,
      fallbackContent.navigation
    ),
    headerActions: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "headerActions"),
      actionListSchema,
      fallbackContent.headerActions
    ),
    mobileActions: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "mobileActions"),
      actionListSchema,
      fallbackContent.mobileActions
    ),
    hero: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "hero"),
      publicLandingHeroSchema,
      fallbackContent.hero
    ),
    mission: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "mission"),
      publicLandingMissionSectionSchema,
      fallbackContent.mission
    ),
    service: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "service"),
      publicLandingServiceSectionSchema,
      fallbackContent.service
    ),
    schedule: withSourceItems(localizedSchedule, sourceSchedule),
    people: withSourceItems(localizedPeople, sourcePeople),
    events: {
      ...eventsConfig,
      items: events.slice(0, eventsConfig.maxItems)
    },
    entrance: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "entrance"),
      publicLandingEntranceSectionSchema,
      fallbackContent.entrance
    ),
    app: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "app"),
      publicLandingAppSectionSchema,
      fallbackContent.app
    ),
    contact: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "contact"),
      publicLandingContactSectionSchema,
      fallbackContent.contact
    ),
    footerActions: settingValue(
      settingByKey,
      publicLandingSettingKey(locale, "footerActions"),
      actionListSchema,
      fallbackContent.footerActions
    ),
    updatedAt: latestUpdatedAt(
      timeZoneSetting ? [...settings, timeZoneSetting] : settings,
      fallbackContent.updatedAt
    )
  });

  return content;
}

function withSourceItems<T extends { items: unknown[] }>(
  localized: T,
  source: T
): T {
  return localized.items.length > 0
    ? localized
    : { ...localized, items: source.items };
}

function settingString(setting: AppSetting | null, fallback: string) {
  return typeof setting?.value === "string" && setting.value.trim()
    ? setting.value.trim()
    : fallback;
}

function settingValue<T>(
  settings: Map<string, AppSetting>,
  key: string,
  schema: ZodType<T>,
  fallback: T
): T {
  const setting = settings.get(key);
  if (!setting) {
    return fallback;
  }
  const parsed = schema.safeParse(setting.value);
  if (!parsed.success) {
    throw settingValueInvalid(key, parsed.error.flatten());
  }
  return parsed.data;
}

function latestUpdatedAt(settings: AppSetting[], fallbackUpdatedAt: string) {
  return settings.reduce((latest, setting) => {
    return new Date(setting.updatedAt) > new Date(latest)
      ? setting.updatedAt
      : latest;
  }, fallbackUpdatedAt);
}
