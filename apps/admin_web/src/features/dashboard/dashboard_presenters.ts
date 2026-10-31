import type { DashboardMetric } from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import type { AppLocale } from "@/core/i18n/i18n";

export function formatDashboardMetricValue(
  metric: DashboardMetric,
  locale: string
) {
  if (metric.format === "currency" && metric.currency) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: metric.currency,
      maximumFractionDigits: 2
    }).format(metric.value / 100);
  }
  return new Intl.NumberFormat(locale).format(metric.value);
}

export function formatDashboardCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDashboardTimestamp(value: string, locale: AppLocale) {
  return formatAdminDateTime(value, locale);
}
