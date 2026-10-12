import type { DashboardMetric } from "@mbc/api-contracts";

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

export function formatDashboardTimestamp(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
