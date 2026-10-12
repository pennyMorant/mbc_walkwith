<script setup lang="ts">
import type {
  NotificationDeliveryStatus,
  NotificationDeliveryTask
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  cancelNotificationDelivery,
  listNotificationDeliveries,
  retryNotificationDelivery,
  retryDueNotificationDeliveries,
  type NotificationDeliveryListFilters
} from "@/core/api/notifications";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();
const selectedTask = ref<NotificationDeliveryTask | null>(null);
const drawer = ref(false);

const filters = reactive({
  status: "" as NotificationDeliveryStatus | "",
  type: "",
  cursor: null as string | null
});
const loadedPages = ref<
  Array<{ items: NotificationDeliveryTask[]; nextCursor: string | null }>
>([]);

const statuses: Array<NotificationDeliveryStatus | ""> = [
  "",
  "queued",
  "sent",
  "failed",
  "retrying",
  "cancelled"
];

const activeFilters = computed<NotificationDeliveryListFilters>(() => ({
  status: filters.status,
  type: filters.type,
  cursor: filters.cursor,
  limit: 50
}));

const deliveriesQuery = useQuery({
  queryKey: ["admin-notification-deliveries", activeFilters],
  queryFn: async () => {
    const page = await listNotificationDeliveries(activeFilters.value);
    if (filters.cursor) {
      loadedPages.value.push(page);
    } else {
      loadedPages.value = [page];
    }
    return page;
  }
});

const retryDueMutation = useMutation({
  mutationFn: () => {
    if (!canManage.value) {
      throw new Error(t("Notification manage access required"));
    }
    return retryDueNotificationDeliveries(20);
  },
  onSuccess: async () => {
    resetList();
  }
});

const retryTaskMutation = useMutation({
  mutationFn: (task: NotificationDeliveryTask) => {
    if (!canManage.value || !canRetry(task)) {
      throw new Error(t("Notification task cannot be retried"));
    }
    return retryNotificationDelivery(task.id);
  },
  onSuccess: async () => {
    drawer.value = false;
    selectedTask.value = null;
    resetList();
  }
});

const cancelTaskMutation = useMutation({
  mutationFn: (task: NotificationDeliveryTask) => {
    if (!canManage.value || !canCancel(task)) {
      throw new Error(t("Notification task cannot be cancelled"));
    }
    return cancelNotificationDelivery(task.id);
  },
  onSuccess: async (result) => {
    selectedTask.value = result.task;
    resetList();
  }
});

const deliveries = computed(() =>
  loadedPages.value.flatMap((page) => page.items)
);
const canManage = computed(() => authStore.can("notifications:manage"));
const nextCursor = computed(
  () => loadedPages.value[loadedPages.value.length - 1]?.nextCursor ?? null
);
const retryErrorMessage = computed(() =>
  formatApiErrorMessage(
    retryDueMutation.error.value ||
      retryTaskMutation.error.value ||
      cancelTaskMutation.error.value,
    t("common.error")
  )
);
const statusSummary = computed(() => {
  const counts: Record<NotificationDeliveryStatus, number> = {
    queued: 0,
    sent: 0,
    failed: 0,
    retrying: 0,
    cancelled: 0
  };
  for (const delivery of deliveries.value) {
    counts[delivery.status] += 1;
  }
  return counts;
});

function resetList() {
  filters.cursor = null;
  void queryClient.invalidateQueries({
    queryKey: ["admin-notification-deliveries"]
  });
}

function loadMore() {
  if (nextCursor.value && !deliveriesQuery.isFetching.value) {
    filters.cursor = nextCursor.value;
  }
}

function openTask(task: NotificationDeliveryTask) {
  selectedTask.value = task;
  drawer.value = true;
}

function statusColor(status: NotificationDeliveryStatus) {
  return {
    queued: "info",
    sent: "success",
    failed: "error",
    retrying: "warning",
    cancelled: "secondary"
  }[status];
}

function canRetry(task: NotificationDeliveryTask) {
  return task.status === "failed" || task.status === "retrying";
}

function canCancel(task: NotificationDeliveryTask) {
  return task.status === "queued" || task.status === "retrying";
}

function json(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function retryDueDeliveries() {
  if (!canManage.value || retryDueMutation.isPending.value) {
    return;
  }
  retryDueMutation.mutate();
}

function retryTask(task: NotificationDeliveryTask) {
  if (!canManage.value || !canRetry(task) || retryTaskMutation.isPending.value) {
    return;
  }
  retryTaskMutation.mutate(task);
}

function cancelTask(task: NotificationDeliveryTask) {
  if (
    !canManage.value ||
    !canCancel(task) ||
    cancelTaskMutation.isPending.value
  ) {
    return;
  }
  cancelTaskMutation.mutate(task);
}
</script>

<template>
  <div>
    <div
      class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
    >
      <div>
        <div class="page-title">{{ t("nav.notifications") }}</div>
        <div class="page-subtitle">
          {{ t("notifications.subtitle") }}
        </div>
      </div>
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          color="primary"
          variant="tonal"
          :loading="deliveriesQuery.isFetching.value"
          @click="resetList"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn
          v-if="canManage"
          color="warning"
          variant="tonal"
          :disabled="retryDueMutation.isPending.value"
          :loading="retryDueMutation.isPending.value"
          @click="retryDueDeliveries"
        >
          {{ t("notifications.retryDue") }}
        </v-btn>
      </div>
    </div>

    <v-alert
      v-if="retryDueMutation.data.value"
      type="success"
      variant="tonal"
      class="mt-4"
    >
      {{
        t("notifications.retryProcessed").replace(
          "{count}",
          String(retryDueMutation.data.value.processed)
        )
      }}
    </v-alert>
    <v-alert
      v-else-if="
        retryDueMutation.error.value ||
        retryTaskMutation.error.value ||
        cancelTaskMutation.error.value
      "
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ retryErrorMessage }}
    </v-alert>

    <v-row class="mt-6" dense>
      <v-col
        v-for="status in ['sent', 'retrying', 'failed', 'queued'] as NotificationDeliveryStatus[]"
        :key="status"
        cols="6"
        md="3"
      >
        <v-card class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div class="text-caption text-medium-emphasis text-uppercase">
              {{ t(status) }}
            </div>
            <v-chip size="x-small" :color="statusColor(status)" />
          </div>
          <div class="text-h5 font-weight-bold mt-2">
            {{ statusSummary[status] }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <div class="pa-5">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.status"
              :items="optionItems(statuses)"
              :label="t('Status')"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="resetList"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.type"
              :label="t('Type')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="resetList"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center justify-end">
            <v-chip color="primary" variant="tonal">
              {{ t("notifications.loaded") }} {{ deliveries.length }}
            </v-chip>
          </v-col>
        </v-row>
      </div>
      <v-divider />
      <v-progress-linear
        v-if="deliveriesQuery.isPending.value"
        indeterminate
        color="primary"
      />
      <v-alert
        v-else-if="deliveriesQuery.error.value"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        {{ formatApiErrorMessage(deliveriesQuery.error.value, t("common.error")) }}
      </v-alert>
      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>{{ t("Type") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("Audience") }}</th>
            <th>{{ t("Title") }}</th>
            <th>{{ t("Attempts") }}</th>
            <th>{{ t("Updated") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="delivery in deliveries"
            :key="delivery.id"
            class="cursor-pointer"
            @click="openTask(delivery)"
          >
            <td class="font-weight-bold">{{ delivery.type }}</td>
            <td>
              <v-chip size="small" :color="statusColor(delivery.status)">
                {{ t(delivery.status) }}
              </v-chip>
            </td>
            <td>{{ t(delivery.audience) }}</td>
            <td>
              <div class="font-weight-medium">{{ delivery.payload.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ delivery.payload.route || "-" }}
              </div>
            </td>
            <td>{{ delivery.attempts }}</td>
            <td>{{ delivery.updatedAt }}</td>
          </tr>
          <tr v-if="deliveries.length === 0">
            <td colspan="6" class="text-center text-medium-emphasis py-8">
              {{ t("notifications.empty") }}
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-divider v-if="nextCursor" />
      <div v-if="nextCursor" class="pa-4 text-center">
        <v-btn
          variant="tonal"
          color="primary"
          :loading="deliveriesQuery.isFetching.value"
          @click="loadMore"
        >
          {{ t("Load more") }}
        </v-btn>
      </div>
    </v-card>

    <v-navigation-drawer
      v-model="drawer"
      location="right"
      temporary
      width="520"
    >
      <div v-if="selectedTask" class="pa-5">
        <div class="d-flex align-center justify-space-between ga-3">
          <div>
            <div class="text-h6 font-weight-bold">
              {{ selectedTask.payload.title }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedTask.type }} · {{ selectedTask.id }}
            </div>
          </div>
          <v-chip :color="statusColor(selectedTask.status)">
            {{ t(selectedTask.status) }}
          </v-chip>
        </div>

        <v-list density="compact" class="mt-4">
          <v-list-item :title="t('Message ID')" :subtitle="selectedTask.messageId || '-'" />
          <v-list-item :title="t('Audience')" :subtitle="t(selectedTask.audience)" />
          <v-list-item :title="t('Preference')" :subtitle="selectedTask.preferenceKey || '-'" />
          <v-list-item :title="t('Recipients')" :subtitle="String(selectedTask.recipientCount)" />
          <v-list-item :title="t('Attempts')" :subtitle="String(selectedTask.attempts)" />
          <v-list-item :title="t('Next attempt')" :subtitle="selectedTask.nextAttemptAt || '-'" />
          <v-list-item :title="t('Last error')" :subtitle="selectedTask.lastErrorMessage || '-'" />
        </v-list>

        <div
          v-if="canManage"
          class="d-flex flex-wrap ga-2 mt-4"
        >
          <v-btn
            color="warning"
            variant="tonal"
            :disabled="!canRetry(selectedTask) || retryTaskMutation.isPending.value"
            :loading="retryTaskMutation.isPending.value"
            @click="retryTask(selectedTask)"
          >
            {{ t("notifications.retryOne") }}
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            :disabled="!canCancel(selectedTask) || cancelTaskMutation.isPending.value"
            :loading="cancelTaskMutation.isPending.value"
            @click="cancelTask(selectedTask)"
          >
            {{ t("notifications.cancel") }}
          </v-btn>
        </div>

        <div class="text-subtitle-2 font-weight-bold mt-6">
          {{ t("Payload JSON") }}
        </div>
        <pre class="json-block mt-2">{{ json(selectedTask.payload) }}</pre>

        <div class="text-subtitle-2 font-weight-bold mt-6">
          {{ t("Provider evidence") }}
        </div>
        <pre class="json-block mt-2">{{ json(selectedTask.providerEvidence) }}</pre>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.json-block {
  max-height: 260px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.32);
  padding: 12px;
  white-space: pre-wrap;
}
</style>
