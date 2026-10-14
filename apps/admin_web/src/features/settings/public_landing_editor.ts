export type PublicLandingStructuredSection = "schedule" | "people" | "events";

export function publicLandingStructuredSection(
  settingKey: string
): PublicLandingStructuredSection | null {
  const match = settingKey.match(
    /^publicLanding(?:\.(?:en|es|zh-Hans|zh-Hant))?\.(schedule|people|events)$/
  );
  return (match?.[1] as PublicLandingStructuredSection | undefined) ?? null;
}

export function isPublicLandingStructuredSetting(settingKey: string) {
  return publicLandingStructuredSection(settingKey) !== null;
}

export function createLandingItemId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function cloneLandingSettingValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
