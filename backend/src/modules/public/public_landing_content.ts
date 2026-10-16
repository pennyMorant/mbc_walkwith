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
      items: events
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

  return orderLandingContent(content);
}

function orderLandingContent(
  content: ReturnType<typeof publicLandingContentSchema.parse>
) {
  return {
    ...content,
    navigation: byDisplayPriority(content.navigation),
    headerActions: byDisplayPriority(content.headerActions),
    mobileActions: byDisplayPriority(content.mobileActions),
    hero: {
      ...content.hero,
      primaryActions: byDisplayPriority(content.hero.primaryActions),
      quickActions: byDisplayPriority(content.hero.quickActions)
    },
    mission: {
      ...content.mission,
      pillars: byDisplayPriority(content.mission.pillars)
    },
    service: {
      ...content.service,
      facts: byDisplayPriority(content.service.facts),
      actions: byDisplayPriority(content.service.actions)
    },
    schedule: {
      ...content.schedule,
      items: byDisplayPriority(content.schedule.items)
    },
    people: {
      ...content.people,
      items: byDisplayPriority(content.people.items)
    },
    events: {
      ...content.events,
      items: orderLandingEvents(content.events.items).slice(
        0,
        content.events.maxItems
      )
    },
    entrance: {
      ...content.entrance,
      actions: byDisplayPriority(content.entrance.actions)
    },
    app: {
      ...content.app,
      highlights: byDisplayPriority(content.app.highlights),
      actions: byDisplayPriority(content.app.actions)
    },
    contact: {
      ...content.contact,
      links: byDisplayPriority(content.contact.links)
    },
    footerActions: byDisplayPriority(content.footerActions)
  };
}

export function orderLandingEvents(
  events: PublicLandingEvent[]
): PublicLandingEvent[] {
  return [...events].sort(
    (left, right) =>
      right.sort - left.sort ||
      nullableDateValue(left.startsAt) - nullableDateValue(right.startsAt) ||
      left.id.localeCompare(right.id)
  );
}

function byDisplayPriority<T extends { sort: number }>(items: T[]): T[] {
  return items
    .map((item, sourceIndex) => ({ item, sourceIndex }))
    .sort(
      (left, right) =>
        right.item.sort - left.item.sort ||
        left.sourceIndex - right.sourceIndex
    )
    .map(({ item }) => item);
}

function nullableDateValue(value: string | null) {
  return value === null ? Number.MAX_SAFE_INTEGER : Date.parse(value);
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
