<script setup lang="ts">
import type { AiUsageRecord } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

import { formatAiUsageTimestamp } from "../ai_management_presenters";

defineProps<{ records: AiUsageRecord[] }>();
const { locale, t } = useI18n();

function timestamp(value: string) {
  return formatAiUsageTimestamp(value, locale.value);
}

function statusColor(status: AiUsageRecord["status"]) {
  return status === "succeeded" ? "success" : "error";
}
</script>

<template>
  <v-card class="ai-usage-panel overflow-hidden">
    <div class="pa-5 pb-3 section-heading">{{ t("ai.usage") }}</div>

    <template v-if="records.length > 0">
      <v-table class="d-none d-md-block" hover>
        <thead>
          <tr>
            <th>{{ t("ai.time") }}</th>
            <th>{{ t("ai.task") }}</th>
            <th>{{ t("ai.provider") }}</th>
            <th>{{ t("ai.model") }}</th>
            <th>{{ t("ai.inputTokens") }}</th>
            <th>{{ t("ai.outputTokens") }}</th>
            <th>{{ t("ai.totalTokens") }}</th>
            <th>{{ t("ai.status") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id">
            <td class="text-no-wrap">{{ timestamp(record.createdAt) }}</td>
            <td>{{ record.task }}</td>
            <td>{{ record.provider ?? "-" }}</td>
            <td>{{ record.model ?? "-" }}</td>
            <td>{{ record.inputTokens ?? "-" }}</td>
            <td>{{ record.outputTokens ?? "-" }}</td>
            <td class="font-weight-bold">{{ record.totalTokens ?? "-" }}</td>
            <td>
              <v-chip size="small" variant="tonal" :color="statusColor(record.status)">
                {{ t(record.status) }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div class="d-md-none">
        <div v-for="record in records" :key="record.id" class="ai-usage-record">
          <div class="ai-usage-record__main">
            <strong>{{ record.task }}</strong>
            <span>{{ timestamp(record.createdAt) }}</span>
          </div>
          <v-chip size="small" variant="tonal" :color="statusColor(record.status)">
            {{ t(record.status) }}
          </v-chip>
          <div class="ai-usage-record__meta">
            <span>{{ record.provider ?? "-" }} / {{ record.model ?? "-" }}</span>
            <span>{{ t("ai.totalTokens") }}: {{ record.totalTokens ?? "-" }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="ai-usage-empty pa-5 pt-3">
      <v-icon icon="mdi-chart-timeline-variant" color="secondary" />
      <span>{{ t("ai.noUsage") }}</span>
    </div>
  </v-card>
</template>

<style scoped>
.ai-usage-panel { border: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.ai-usage-panel :deep(th) { color: rgba(var(--v-theme-on-surface), 0.58); font-size: 12px; font-weight: 700; }
.ai-usage-panel :deep(td) { height: 62px; }
.ai-usage-record { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; align-items: center; padding: 14px 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.ai-usage-record__main { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.ai-usage-record__main span, .ai-usage-record__meta { color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; }
.ai-usage-record__meta { display: flex; min-width: 0; grid-column: 1 / -1; flex-direction: column; gap: 3px; }
.ai-usage-empty { display: flex; min-height: 92px; align-items: center; gap: 10px; color: rgba(var(--v-theme-on-surface), 0.68); }
</style>
