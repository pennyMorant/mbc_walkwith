<script setup lang="ts">
import type { AdminDashboardResponse, DashboardHealthItem } from "@mbc/api-contracts";
import { useI18n } from "@/core/i18n/i18n";
import { formatDashboardTimestamp } from "../dashboard_presenters";

const props = defineProps<{ health: DashboardHealthItem[]; snapshot: AdminDashboardResponse["snapshot"] }>();
defineEmits<{ open: [path: string] }>();
const { locale, t } = useI18n();
function timestamp(value: string) { return formatDashboardTimestamp(value, locale.value); }
</script>

<template>
  <v-card class="dashboard-panel h-100 pa-5">
    <div class="d-flex align-start justify-space-between ga-3">
      <div class="section-heading">{{ t("dashboard.systemStatus") }}</div>
      <span class="text-caption text-medium-emphasis">{{ timestamp(props.snapshot.generatedAt) }}</span>
    </div>
    <div class="dashboard-health mt-4">
      <div class="dashboard-health__row">
        <div class="d-flex align-center ga-3"><v-icon icon="mdi-chart-timeline-variant" size="20" /><span>{{ t("dashboard.dataSnapshot") }}</span></div>
        <div class="d-flex align-center ga-2"><span :class="['status-dot', snapshot.status === 'fresh' ? 'status-dot--success' : 'status-dot--warning']" /><span class="text-body-2">{{ t(snapshot.status === "fresh" ? "dashboard.snapshotFresh" : "dashboard.snapshotStaleLabel") }}</span></div>
      </div>
      <button v-for="item in health" :key="item.id" type="button" class="dashboard-health__row dashboard-health__button" @click="item.path && $emit('open', item.path)">
        <div class="d-flex align-center ga-3"><v-icon :icon="item.id === 'failed_jobs' ? 'mdi-alert-circle-outline' : 'mdi-progress-clock'" size="20" /><span>{{ t(item.labelKey) }}</span></div>
        <div class="d-flex align-center ga-2"><span :class="['status-dot', `status-dot--${item.status}`]" /><strong>{{ item.value }}</strong></div>
      </button>
    </div>
  </v-card>
</template>

<style scoped>
.dashboard-panel { border: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.dashboard-health__row { display: flex; min-height: 52px; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.dashboard-health__row:first-child { border-top: 0; }
.dashboard-health__button { width: 100%; padding: 0; color: inherit; background: transparent; font: inherit; cursor: pointer; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: rgb(var(--v-theme-secondary)); }
.status-dot--success { background: rgb(var(--v-theme-success)); }
.status-dot--warning { background: rgb(var(--v-theme-warning)); }
.status-dot--error { background: rgb(var(--v-theme-error)); }
.status-dot--healthy { background: rgb(var(--v-theme-success)); }
</style>
