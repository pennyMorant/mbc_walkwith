<script setup lang="ts">
import type { MediaCleanupStatus, MediaCleanupTask } from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { listMediaCleanupTasks, retryMediaCleanupTask } from "@/core/api/media";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

const queryKey = ["admin-media-cleanup-tasks"];
const statuses = ["", "failed", "pending", "succeeded"] as const;
const authStore = useAdminAuthStore();
const queryClient = useQueryClient();
const { locale, optionItems, t } = useI18n();
const status = ref<MediaCleanupStatus | "">("failed");
const retryingId = ref<string | null>(null);
const canRead = computed(() => authStore.can("media:read"));
const canRetry = computed(() => authStore.can("media:manage"));

const cleanupQuery = useQuery({
  queryKey: [...queryKey, status],
  enabled: canRead,
  queryFn: () => listMediaCleanupTasks({ status: status.value, limit: 50 })
});
const retryMutation = useMutation({
  mutationFn: retryMediaCleanupTask,
  onSuccess: () => queryClient.invalidateQueries({ queryKey })
});
const tasks = computed(() => cleanupQuery.data.value ?? []);

async function retry(task: MediaCleanupTask) {
  if (!canRetry.value || retryMutation.isPending.value) return;
  retryingId.value = task.id;
  try {
    await retryMutation.mutateAsync(task.id);
  } finally {
    retryingId.value = null;
  }
}

function statusColor(value: MediaCleanupStatus) {
  if (value === "succeeded") return "success";
  if (value === "failed") return "error";
  return "warning";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
</script>

<template>
  <v-card v-if="canRead" class="mt-6">
    <div class="pa-5 d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="text-subtitle-1 font-weight-bold">{{ t("media.cleanupTitle") }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ t("media.cleanupSubtitle") }}</div>
      </div>
      <div class="d-flex align-center ga-2 cleanup-actions">
        <v-select
          v-model="status"
          :items="optionItems(statuses)"
          :label="t('Status')"
          density="compact"
          variant="outlined"
          hide-details
          class="status-filter"
        />
        <v-chip variant="tonal">{{ tasks.length }}</v-chip>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="tonal"
          :aria-label="t('common.refresh')"
          :loading="cleanupQuery.isFetching.value"
          @click="cleanupQuery.refetch()"
        />
      </div>
    </div>
    <v-divider />
    <v-progress-linear v-if="cleanupQuery.isPending.value" indeterminate color="primary" />
    <v-alert v-else-if="cleanupQuery.error.value" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(cleanupQuery.error.value, t("common.error")) }}
    </v-alert>
    <v-alert v-else-if="tasks.length === 0" type="info" variant="tonal" class="ma-4">
      {{ t("media.cleanupEmpty") }}
    </v-alert>
    <template v-else>
      <v-alert v-if="retryMutation.error.value" type="error" variant="tonal" class="ma-4">
        {{ formatApiErrorMessage(retryMutation.error.value, t("common.error")) }}
      </v-alert>
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>{{ t("media.asset") }}</th>
            <th>{{ t("Reason") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("Attempts") }}</th>
            <th>{{ t("Updated") }}</th>
            <th class="text-end">{{ t("common.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td class="task-id text-caption">
              {{ task.mediaAssetId }}
              <div v-if="task.lastError" class="text-error mt-1">
                {{ task.lastError }}
              </div>
            </td>
            <td>{{ t(task.reason) }}</td>
            <td>
              <v-chip
                size="small"
                :color="statusColor(task.status)"
                variant="tonal"
              >
                {{ t(task.status) }}
              </v-chip>
            </td>
            <td>{{ task.attempts }}</td>
            <td class="text-no-wrap">{{ formatDateTime(task.updatedAt) }}</td>
            <td class="text-end">
              <v-btn
                v-if="task.retryable"
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="mdi-refresh"
                :disabled="!canRetry"
                :loading="retryingId === task.id"
                @click="retry(task)"
              >
                {{ t("Retry") }}
              </v-btn>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
  </v-card>
</template>

<style scoped>
.cleanup-actions {
  width: min(100%, 320px);
}

.status-filter {
  min-width: 150px;
}

.task-id {
  max-width: 360px;
  overflow-wrap: anywhere;
}
</style>
