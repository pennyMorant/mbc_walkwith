<script setup lang="ts">
import type { DashboardMetric } from "@mbc/api-contracts";
import { useI18n } from "@/core/i18n/i18n";
import { formatDashboardMetricValue } from "../dashboard_presenters";

defineProps<{ metrics: DashboardMetric[] }>();
const { locale, t } = useI18n();
function metricValue(metric: DashboardMetric) { return formatDashboardMetricValue(metric, locale.value); }
function metricIcon(metric: DashboardMetric) {
  const icons: Record<string, string> = {
    draft_sermons: "mdi-file-document-edit-outline", published_sermons: "mdi-microphone-outline",
    review_queue: "mdi-clipboard-check-outline", life_posts: "mdi-newspaper-variant-outline",
    event_registrants: "mdi-calendar-account-outline", pending_prayers: "mdi-hands-pray",
    failed_jobs: "mdi-alert-circle-outline", giving_year_total: "mdi-hand-heart-outline",
    giving_transaction_count: "mdi-receipt-text-outline"
  };
  return icons[metric.id] ?? "mdi-chart-box-outline";
}
</script>

<template>
  <section>
    <div class="section-heading">{{ t("dashboard.metricsTitle") }}</div>
    <v-row class="mt-2" dense>
      <v-col v-for="metric in metrics" :key="metric.id" cols="12" sm="6" lg="3">
        <v-card class="dashboard-metric pa-5 h-100" :to="metric.path ?? undefined">
          <div class="d-flex align-start justify-space-between ga-4">
            <div>
              <div class="text-body-2 text-medium-emphasis">{{ t(metric.labelKey) }}</div>
              <div class="dashboard-metric__value mt-2">{{ metricValue(metric) }}</div>
            </div>
            <div :class="['dashboard-metric__icon', `dashboard-metric__icon--${metric.tone}`]">
              <v-icon :icon="metricIcon(metric)" size="23" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.dashboard-metric { border: 1px solid rgba(var(--v-theme-on-surface), 0.07); transition: transform 160ms ease, border-color 160ms ease; }
.dashboard-metric:hover { transform: translateY(-2px); border-color: rgba(var(--v-theme-primary), 0.28); }
.dashboard-metric__value { font-size: 28px; line-height: 1.15; font-weight: 800; }
.dashboard-metric__icon { display: flex; width: 44px; height: 44px; flex: 0 0 44px; align-items: center; justify-content: center; border-radius: 50%; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.1); }
.dashboard-metric__icon--warning { color: rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), 0.11); }
.dashboard-metric__icon--error { color: rgb(var(--v-theme-error)); background: rgba(var(--v-theme-error), 0.1); }
.dashboard-metric__icon--info { color: rgb(var(--v-theme-info)); background: rgba(var(--v-theme-info), 0.1); }
.dashboard-metric__icon--success { color: rgb(var(--v-theme-success)); background: rgba(var(--v-theme-success), 0.1); }
</style>
