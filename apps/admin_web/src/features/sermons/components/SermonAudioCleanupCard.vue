<script setup lang="ts">
import type {
  SermonAudioCleanupStatus,
  SermonAudioCleanupTask
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  listAdminSermonAudioCleanups,
  retryAdminSermonAudioCleanup
} from "@/core/api/sermons";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";
import SermonAudioCleanupResults from "./SermonAudioCleanupResults.vue";

const cleanupQueryKey = ["admin-sermon-audio-cleanups"];
const cleanupStatuses = ["", "failed", "pending", "succeeded"] as const;

const authStore = useAdminAuthStore();
const queryClient = useQueryClient();
const { optionItems, t } = useI18n();
const status = ref<SermonAudioCleanupStatus | "">("failed");
const retryingTaskId = ref<string | null>(null);
const canRead = computed(() => authStore.can("sermons:read"));
const canRetry = computed(() => authStore.can("sermons:update"));
const statusItems = computed(() => optionItems(cleanupStatuses));

const cleanupQuery = useQuery({
  queryKey: [...cleanupQueryKey, status],
  enabled: canRead,
  queryFn: () =>
    listAdminSermonAudioCleanups({
      status: status.value,
      limit: 50
    })
});

const retryMutation = useMutation({
  mutationFn: retryAdminSermonAudioCleanup,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: cleanupQueryKey });
  }
});

const tasks = computed(() => cleanupQuery.data.value ?? []);
const actionError = computed(() =>
  formatApiErrorMessage(retryMutation.error.value, t("common.error"))
);
const queryError = computed(() =>
  cleanupQuery.error.value
    ? formatApiErrorMessage(cleanupQuery.error.value, t("common.error"))
    : ""
);

async function retryTask(task: SermonAudioCleanupTask) {
  if (!canRetry.value || retryMutation.isPending.value) {
    return;
  }
  retryingTaskId.value = task.id;
  try {
    await retryMutation.mutateAsync(task.id);
  } finally {
    retryingTaskId.value = null;
  }
}

</script>

<template>
  <v-card v-if="canRead" class="mt-4">
    <div class="pa-5">
      <AdminPanelHeader
        :title="t('sermons.audioCleanupTitle')"
        :subtitle="t('sermons.audioCleanupSubtitle')"
      >
        <template #actions>
          <div class="d-flex align-center ga-2 cleanup-actions">
            <v-select
              v-model="status"
              :items="statusItems"
              :label="t('Status')"
              density="compact"
              variant="outlined"
              hide-details
              class="status-filter"
            />
            <v-chip variant="tonal">{{ tasks.length }}</v-chip>
            <v-tooltip :text="t('common.refresh')">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-refresh"
                  size="small"
                  variant="tonal"
                  :aria-label="t('common.refresh')"
                  :loading="cleanupQuery.isFetching.value"
                  @click="cleanupQuery.refetch()"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </AdminPanelHeader>
    </div>

    <v-divider />
    <AdminDataState
      :pending="cleanupQuery.isPending.value"
      :error-message="tasks.length === 0 ? queryError : ''"
      :empty="!cleanupQuery.isPending.value && tasks.length === 0"
      :empty-title="t('sermons.audioCleanupEmpty')"
      :retry-label="t('common.refresh')"
      @retry="cleanupQuery.refetch()"
    >
      <SermonAudioCleanupResults
        :tasks="tasks"
        :can-retry="canRetry"
        :retrying-task-id="retryingTaskId"
        :action-error="retryMutation.error.value ? actionError : ''"
        :refresh-error="tasks.length > 0 ? queryError : ''"
        :is-fetching="cleanupQuery.isFetching.value"
        @refresh="cleanupQuery.refetch()"
        @retry="retryTask"
      />
    </AdminDataState>
  </v-card>
</template>

<style scoped>
.cleanup-actions {
  width: min(100%, 320px);
}

.status-filter {
  min-width: 150px;
}

@media (max-width: 600px) {
  .cleanup-actions {
    width: 100%;
  }

  .status-filter {
    min-width: 0;
  }
}
</style>
