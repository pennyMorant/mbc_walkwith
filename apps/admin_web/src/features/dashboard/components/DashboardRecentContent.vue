<script setup lang="ts">
import type { DashboardRecentContent } from "@mbc/api-contracts";
import { useI18n } from "@/core/i18n/i18n";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import { formatDashboardTimestamp } from "../dashboard_presenters";

defineProps<{ items: DashboardRecentContent[] }>();
defineEmits<{ open: [path: string] }>();
const { locale, t } = useI18n();
function timestamp(value: string) { return formatDashboardTimestamp(value, locale.value); }
function statusColor(status: string) {
  if (status === "published") return "success";
  if (status === "needs_review") return "warning";
  if (status === "failed") return "error";
  return "secondary";
}
</script>

<template>
  <v-card class="dashboard-panel h-100 overflow-hidden">
    <div class="pa-5 pb-3 section-heading">{{ t("dashboard.recentContent") }}</div>
    <v-table v-if="items.length > 0" class="dashboard-recent d-none d-md-block" hover>
      <thead><tr><th>{{ t("dashboard.column.title") }}</th><th>{{ t("dashboard.column.type") }}</th><th>{{ t("dashboard.column.language") }}</th><th>{{ t("dashboard.column.status") }}</th><th>{{ t("dashboard.column.updated") }}</th><th /></tr></thead>
      <tbody>
        <tr v-for="item in items" :key="`${item.resourceType}:${item.id}`">
          <td><strong>{{ item.title }}</strong></td>
          <td>{{ t(`dashboard.resource.${item.resourceType}`) }}</td>
          <td>{{ t(`locale.${item.sourceLocale}`) }}</td>
          <td><v-chip size="small" variant="tonal" :color="statusColor(item.status)">{{ t(item.status) }}</v-chip></td>
          <td class="text-medium-emphasis">{{ timestamp(item.updatedAt) }}</td>
          <td><v-btn icon="mdi-chevron-right" variant="text" size="small" :aria-label="t('common.go')" @click="$emit('open', item.path)" /></td>
        </tr>
      </tbody>
    </v-table>
    <div v-if="items.length > 0" class="dashboard-recent-mobile d-md-none">
      <AdminMobileRecord
        v-for="item in items"
        :key="`${item.resourceType}:${item.id}`"
        @activate="$emit('open', item.path)"
      >
        <strong class="dashboard-recent-mobile__title">{{ item.title }}</strong>
        <div class="dashboard-recent-mobile__meta">
          <span>{{ t(`dashboard.resource.${item.resourceType}`) }}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{{ t(`locale.${item.sourceLocale}`) }}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{{ timestamp(item.updatedAt) }}</span>
        </div>
        <template #trailing>
          <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
            {{ t(item.status) }}
          </v-chip>
        </template>
      </AdminMobileRecord>
    </div>
    <div v-else class="dashboard-empty pa-5 pt-3">{{ t("dashboard.noRecentContent") }}</div>
  </v-card>
</template>

<style scoped>
.dashboard-panel { border: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.dashboard-recent :deep(th) { color: rgba(var(--v-theme-on-surface), 0.58); font-size: 12px; font-weight: 700; }
.dashboard-recent :deep(td) { height: 66px; }
.dashboard-recent-mobile__title { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dashboard-recent-mobile__meta { display: flex; min-width: 0; flex-wrap: wrap; gap: 4px; margin-top: 4px; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; }
.dashboard-empty { min-height: 96px; color: rgba(var(--v-theme-on-surface), 0.62); }
</style>
