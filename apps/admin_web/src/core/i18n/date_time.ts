import type { AppLocale } from "./i18n";

const localeTags: Record<AppLocale, string> = {
  en: "en-US",
  es: "es-US",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW"
};

export function formatAdminDate(value: string, locale: AppLocale): string {
  return format(value, locale, { dateStyle: "medium" });
}

export function formatAdminDateTime(value: string, locale: AppLocale): string {
  return format(value, locale, { dateStyle: "medium", timeStyle: "short" });
}

function format(
  value: string,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(localeTags[locale], options).format(date);
}
