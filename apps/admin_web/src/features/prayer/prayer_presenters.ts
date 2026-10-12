import type { PrayerStatus, PrayerVisibility } from "@mbc/api-contracts";

export function prayerStatusColor(status: PrayerStatus) {
  if (status === "approved") return "success";
  if (status === "hidden") return "error";
  if (status === "archived") return "secondary";
  return "warning";
}

export function prayerVisibilityColor(visibility: PrayerVisibility) {
  if (visibility === "public" || visibility === "members") return "success";
  if (visibility === "private") return "error";
  return "primary";
}

export function formatPrayerDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
