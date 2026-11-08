<script setup lang="ts">
import type { MediaCleanupStatus, MediaCleanupTask } from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";

const status = defineModel<MediaCleanupStatus | "">("status", {
  required: true
});
defineProps<{
  tasks: MediaCleanupTask[];
  canRead: boolean;
  canRetry: boolean;
  pending: boolean;
  fetching: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  retryErrorMessage: string;
  retryingTaskId: string | null;
}>();
const emit = defineEmits<{
  apply: [];
  retryQuery: [];
  retryTask: [task: MediaCleanupTask];
}>();
const statuses = ["", "failed", "pending", "succeeded"] as const;
const { locale, optionItems, t } = useI18n();

function statusColor(value: MediaCleanupStatus) {
  if (value === "succeeded") return "success";
  if (value === "failed") return "error";
  return "warning";
}
</script>

<template>
  <v-card v-if="canRead" class="mt-6" variant="outlined">
    <AdminPanelHeader
      class="pa-5"
      :title="t('media.cleanupTitle')"
      :subtitle="t('media.cleanupSubtitle')"
    >
      <template #actions>
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
            icon="mdi-filter-check-outline"
            size="small"
            variant="tonal"
            :aria-label="t('media.applyFilters')"
            :title="t('media.applyFilters')"
            :loading="fetching"
            @click="emit('apply')"
          />
          <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            :aria-label="t('common.refresh')"
            :title="t('common.refresh')"
            :disabled="fetching"
            @click="emit('retryQuery')"
          />
        </div>
      </template>
    </AdminPanelHeader>
    <v-divider />
    <v-alert
      v-if="retryErrorMessage"
      type="error"
      variant="tonal"
      class="ma-4 mb-0"
    >
      {{ retryErrorMessage }}
    </v-alert>
    <AdminRefreshAlert
      class="ma-4 mb-0"
      :message="refreshErrorMessage"
      :retry-label="t('common.refresh')"
      @retry="emit('retryQuery')"
    />
    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="tasks.length === 0"
      :empty-title="t('media.cleanupEmpty')"
      empty-icon="mdi-delete-sweep-outline"
      :retry-label="t('common.refresh')"
      @retry="emit('retryQuery')"
    >
      <v-table class="d-none d-md-block" density="comfortable">
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
            <td class="text-no-wrap">
              {{ formatAdminDateTime(task.updatedAt, locale) }}
            </td>
            <td class="text-end">
              <v-btn
                v-if="task.retryable"
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="mdi-refresh"
                :disabled="!canRetry || retryingTaskId !== null"
                :loading="retryingTaskId === task.id"
                @click="emit('retryTask', task)"
              >
                {{ t("Retry") }}
              </v-btn>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div class="d-md-none">
        <div v-for="task in tasks" :key="task.id" class="cleanup-record">
          <div class="min-width-0">
            <div class="text-caption font-weight-medium task-id">
              {{ task.mediaAssetId }}
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ t(task.reason) }} · {{ task.attempts }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ formatAdminDateTime(task.updatedAt, locale) }}
            </div>
            <div v-if="task.lastError" class="text-caption text-error mt-1">
              {{ task.lastError }}
            </div>
          </div>
          <div class="d-flex flex-column align-end ga-2">
            <v-chip
              size="small"
              :color="statusColor(task.status)"
              variant="tonal"
            >
              {{ t(task.status) }}
            </v-chip>
            <v-btn
              v-if="task.retryable"
              icon="mdi-refresh"
              size="small"
              variant="text"
              :aria-label="t('Retry')"
              :disabled="!canRetry || retryingTaskId !== null"
              :loading="retryingTaskId === task.id"
              @click="emit('retryTask', task)"
            />
          </div>
        </div>
      </div>
    </AdminDataState>
  </v-card>
</template>

<style scoped>
.cleanup-actions {
  width: min(100%, 400px);
}

.status-filter {
  min-width: 150px;
}

.task-id {
  max-width: 360px;
  overflow-wrap: anywhere;
}

.cleanup-record {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 14px 16px;
}
</style>
