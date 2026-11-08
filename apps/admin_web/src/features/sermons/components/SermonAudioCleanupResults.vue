<script setup lang="ts">
import type {
  SermonAudioCleanupStatus,
  SermonAudioCleanupTask
} from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

defineProps<{
  tasks: SermonAudioCleanupTask[];
  canRetry: boolean;
  retryingTaskId: string | null;
  actionError: string;
  refreshError: string;
  isFetching: boolean;
}>();
defineEmits<{
  refresh: [];
  retry: [task: SermonAudioCleanupTask];
}>();

const { locale, t } = useI18n();

function statusColor(value: SermonAudioCleanupStatus) {
  if (value === "succeeded") {
    return "success";
  }
  if (value === "failed") {
    return "error";
  }
  return "warning";
}
</script>

<template>
  <v-progress-linear v-if="isFetching" indeterminate color="primary" />
  <AdminRetryAlert
    :message="refreshError"
    :retry-label="t('common.refresh')"
    class="ma-4"
    @retry="$emit('refresh')"
  />
  <v-alert v-if="actionError" type="error" variant="tonal" class="ma-4">
    {{ actionError }}
  </v-alert>

  <AdminResponsiveTable>
    <template #desktop>
  <v-table density="comfortable">
    <thead>
      <tr>
        <th>{{ t("Sermon") }}</th>
        <th>{{ t("Reason") }}</th>
        <th>{{ t("Status") }}</th>
        <th>{{ t("Attempts") }}</th>
        <th>{{ t("Updated") }}</th>
        <th class="text-end">{{ t("common.actions") }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="task in tasks" :key="task.id">
        <td class="task-id text-caption">{{ task.sermonId }}</td>
        <td>
          <div>{{ t(task.reason) }}</div>
          <div
            v-if="task.lastError"
            class="error-copy text-caption text-error mt-1"
          >
            {{ task.lastError }}
          </div>
        </td>
        <td>
          <v-chip size="small" :color="statusColor(task.status)" variant="tonal">
            {{ t(task.status) }}
          </v-chip>
        </td>
        <td>{{ task.attempts }}</td>
        <td class="text-no-wrap">
          {{ formatAdminDateTime(task.updatedAt, locale) }}
        </td>
        <td class="text-end">
          <v-btn
            v-if="task.status !== 'succeeded'"
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-refresh"
            :disabled="!canRetry"
            :loading="retryingTaskId === task.id"
            @click="$emit('retry', task)"
          >
            {{ t("Retry") }}
          </v-btn>
          <span v-else class="text-medium-emphasis">-</span>
        </td>
      </tr>
    </tbody>
  </v-table>

    </template>
    <template #mobile>
  <div class="cleanup-mobile-list">
    <article v-for="task in tasks" :key="task.id" class="cleanup-mobile-task">
      <div class="cleanup-mobile-task__heading">
        <span class="task-id text-caption text-medium-emphasis">
          {{ task.sermonId }}
        </span>
        <v-chip size="small" :color="statusColor(task.status)" variant="tonal">
          {{ t(task.status) }}
        </v-chip>
      </div>
      <strong>{{ t(task.reason) }}</strong>
      <p v-if="task.lastError" class="error-copy text-caption text-error mb-0">
        {{ task.lastError }}
      </p>
      <div class="cleanup-mobile-task__meta text-caption text-medium-emphasis">
        <span>{{ t("Attempts") }}: {{ task.attempts }}</span>
        <span>{{ formatAdminDateTime(task.updatedAt, locale) }}</span>
      </div>
      <v-btn
        v-if="task.status !== 'succeeded'"
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-refresh"
        :disabled="!canRetry"
        :loading="retryingTaskId === task.id"
        @click="$emit('retry', task)"
      >
        {{ t("Retry") }}
      </v-btn>
    </article>
  </div>
    </template>
  </AdminResponsiveTable>
</template>

<style scoped>
.task-id {
  max-width: 220px;
  overflow-wrap: anywhere;
}

.error-copy {
  max-width: 360px;
  overflow-wrap: anywhere;
}

.cleanup-mobile-task {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  border-top: 1px solid rgba(var(--v-theme-outline-variant), 0.48);
  padding: 16px;
}

.cleanup-mobile-task:first-child {
  border-top: 0;
}

.cleanup-mobile-task__heading,
.cleanup-mobile-task__meta {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cleanup-mobile-task__heading .task-id {
  flex: 1;
}

.cleanup-mobile-task__meta {
  flex-wrap: wrap;
}
</style>
