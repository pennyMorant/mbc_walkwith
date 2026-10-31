<script setup lang="ts">
import type { DashboardActionItem } from "@mbc/api-contracts";
import { useI18n } from "@/core/i18n/i18n";
import { formatDashboardCount } from "../dashboard_presenters";

defineProps<{ items: DashboardActionItem[] }>();
defineEmits<{ open: [path: string] }>();
const { locale, t } = useI18n();
</script>

<template>
  <v-card class="dashboard-panel pa-5">
    <div class="section-heading">{{ t("dashboard.todayQueue") }}</div>
    <div v-if="items.length > 0" class="dashboard-queue mt-4">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="dashboard-queue__item"
        @click="$emit('open', item.path)"
      >
        <div :class="['dashboard-queue__icon', `dashboard-queue__icon--${item.tone}`]">
          <v-icon :icon="item.id === 'pending_prayers' ? 'mdi-hands-pray' : item.id === 'failed_jobs' ? 'mdi-alert-circle-outline' : 'mdi-clipboard-text-outline'" />
        </div>
        <div class="dashboard-queue__copy">
          <strong>{{ t(item.labelKey) }}</strong>
          <span>{{ t(item.summaryKey) }}</span>
        </div>
        <strong class="dashboard-queue__count">
          {{ formatDashboardCount(item.count, locale) }}
        </strong>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
    </div>
    <div v-else class="dashboard-empty mt-4">
      <v-icon icon="mdi-check-circle-outline" color="success" />
      <span>{{ t("dashboard.noPendingWork") }}</span>
    </div>
  </v-card>
</template>

<style scoped>
.dashboard-panel { border: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.dashboard-queue { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; overflow: hidden; border-radius: 12px; background: rgba(var(--v-theme-on-surface), 0.08); }
.dashboard-queue__item { display: grid; min-width: 0; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 12px; padding: 14px 18px; border: 0; color: inherit; background: rgb(var(--v-theme-surface)); text-align: start; font: inherit; cursor: pointer; }
.dashboard-queue__item:hover { background: rgb(var(--v-theme-surface-variant)); }
.dashboard-queue__item:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.dashboard-queue__icon { display: flex; width: 42px; height: 42px; align-items: center; justify-content: center; border-radius: 50%; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.1); }
.dashboard-queue__icon--warning { color: rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), 0.11); }
.dashboard-queue__icon--error { color: rgb(var(--v-theme-error)); background: rgba(var(--v-theme-error), 0.1); }
.dashboard-queue__copy { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.dashboard-queue__copy span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.dashboard-queue__count { font-size: 24px; }
.dashboard-empty { display: flex; min-height: 72px; align-items: center; gap: 10px; color: rgba(var(--v-theme-on-surface), 0.72); }
@media (max-width: 700px) { .dashboard-queue { grid-template-columns: 1fr; } }
</style>
