<script setup lang="ts">
import type { AdminDashboardResponse } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { formatDashboardTimestamp } from "../dashboard_presenters";

defineProps<{
  snapshot: AdminDashboardResponse["snapshot"];
  refreshErrorMessage: string;
  fetching: boolean;
}>();

defineEmits<{ retry: [] }>();

const { locale, t } = useI18n();

function timestamp(value: string) {
  return formatDashboardTimestamp(value, locale.value);
}
</script>

<template>
  <div class="d-flex flex-column ga-3">
    <v-alert v-if="refreshErrorMessage" type="warning" variant="tonal">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <span>{{ refreshErrorMessage }}</span>
        <v-btn
          size="small"
          variant="text"
          :loading="fetching"
          @click="$emit('retry')"
        >
          {{ t("common.retry") }}
        </v-btn>
      </div>
    </v-alert>

    <v-alert
      v-if="snapshot.status === 'stale'"
      type="warning"
      variant="tonal"
    >
      <div>{{ t("dashboard.snapshotStale") }}</div>
      <div class="dashboard-snapshot-facts mt-3 text-caption">
        <span>
          <strong>{{ t("dashboard.lastSuccessful") }}:</strong>
          {{ timestamp(snapshot.generatedAt) }}
        </span>
        <span>
          <strong>{{ t("dashboard.lastAttempted") }}:</strong>
          {{ timestamp(snapshot.attemptedAt) }}
        </span>
      </div>
    </v-alert>
  </div>
</template>

<style scoped>
.dashboard-snapshot-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
}
</style>
