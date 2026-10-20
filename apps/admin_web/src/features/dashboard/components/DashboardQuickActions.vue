<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
export type DashboardQuickAction = { titleKey: string; icon: string; path: string; tone: "primary" | "info" | "secondary" | "warning" };
defineProps<{ actions: DashboardQuickAction[] }>();
defineEmits<{ open: [path: string] }>();
const { t } = useI18n();
</script>

<template>
  <v-card class="dashboard-panel pa-5">
    <div class="section-heading">{{ t("dashboard.quickActions") }}</div>
    <div class="dashboard-actions mt-4">
      <button v-for="action in actions" :key="action.path" type="button" :class="['dashboard-action', `dashboard-action--${action.tone}`]" @click="$emit('open', action.path)">
        <v-icon :icon="action.icon" size="24" /><span>{{ t(action.titleKey) }}</span>
      </button>
    </div>
  </v-card>
</template>

<style scoped>
.dashboard-panel { border: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.dashboard-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.dashboard-action { display: flex; min-height: 92px; flex-direction: column; align-items: center; justify-content: center; gap: 9px; border: 0; border-radius: 14px; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.09); font: inherit; font-weight: 700; cursor: pointer; }
.dashboard-action--info { color: rgb(var(--v-theme-info)); background: rgba(var(--v-theme-info), 0.09); }
.dashboard-action--secondary { color: rgb(var(--v-theme-secondary)); background: rgba(var(--v-theme-secondary), 0.1); }
.dashboard-action--warning { color: rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), 0.1); }
.dashboard-action:hover { filter: brightness(0.97); }
</style>
