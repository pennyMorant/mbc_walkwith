<script setup lang="ts">
import type {
  NotificationDeliveryStatus,
  NotificationDeliveryTask
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  cancelNotificationDelivery,
  retryNotificationDelivery,
  retryDueNotificationDeliveries
} from "@/core/api/notifications";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import NotificationDeliveryDetailDrawer from "../components/NotificationDeliveryDetailDrawer.vue";
import NotificationDeliveryFiltersCard from "../components/NotificationDeliveryFiltersCard.vue";
import NotificationDeliveryResults from "../components/NotificationDeliveryResults.vue";
import { useNotificationDeliveryQuery } from "../composables/use_notification_delivery_query";
import {
  canCancelNotificationDelivery,
  canRetryNotificationDelivery,
  isCurrentNotificationTaskContext,
  notificationDeliveryStatuses,
  type NotificationTaskCommandContext
} from "../notification_delivery_workspace_models";

type TaskCommandIntent = NotificationTaskCommandContext;

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { t } = useI18n();
const selectedTask = ref<NotificationDeliveryTask | null>(null);
const drawer = ref(false);
const taskCommandError = ref("");
const retryDueError = ref("");
const successMessage = ref("");
const successVisible = ref(false);
let taskContextVersion = 0;

const {
  filters,
  deliveriesQuery,
  deliveries,
  applyFilters,
  clearFilters,
  refreshList,
  restartList,
  loadMore
} = useNotificationDeliveryQuery(queryClient);

const retryDueMutation = useMutation({
  onMutate: () => {
    retryDueError.value = "";
  },
  mutationFn: () => retryDueNotificationDeliveries(20),
  onSuccess: async (result) => {
    showSuccess(
      t("notifications.retryProcessed").replace(
        "{count}",
        String(result.processed)
      )
    );
    await restartList();
  },
  onError: (error) => {
    retryDueError.value = formatApiErrorMessage(error, t("common.error"));
  }
});

const retryTaskMutation = useMutation({
  onMutate: (intent: TaskCommandIntent) => {
    taskCommandError.value = "";
    return intent;
  },
  mutationFn: (intent: TaskCommandIntent) =>
    retryNotificationDelivery(intent.taskId),
  onSuccess: async (_result, _variables, context) => {
    if (isCurrentTaskContext(context)) {
      drawer.value = false;
      showSuccess(t("notifications.retrySuccess"));
    }
    await restartList();
  },
  onError: (error, _variables, context) => {
    if (isCurrentTaskContext(context)) {
      taskCommandError.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }
});

const cancelTaskMutation = useMutation({
  onMutate: (intent: TaskCommandIntent) => {
    taskCommandError.value = "";
    return intent;
  },
  mutationFn: (intent: TaskCommandIntent) =>
    cancelNotificationDelivery(intent.taskId),
  onSuccess: async (result, _variables, context) => {
    if (isCurrentTaskContext(context)) {
      selectedTask.value = result.task;
      showSuccess(t("notifications.cancelSuccess"));
    }
    await restartList();
  },
  onError: (error, _variables, context) => {
    if (isCurrentTaskContext(context)) {
      taskCommandError.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }
});

const canManage = computed(() => authStore.can("notifications:manage"));
const taskCommandPending = computed(
  () =>
    retryTaskMutation.isPending.value || cancelTaskMutation.isPending.value
);
const anyCommandPending = computed(
  () => taskCommandPending.value || retryDueMutation.isPending.value
);
const canRetrySelectedTask = computed(() => {
  const task = selectedTask.value;
  return task ? canRetryNotificationDelivery(task) : false;
});
const canCancelSelectedTask = computed(() => {
  const task = selectedTask.value;
  return task ? canCancelNotificationDelivery(task) : false;
});
const queryErrorMessage = computed(() =>
  deliveriesQuery.error.value
    ? formatApiErrorMessage(deliveriesQuery.error.value, t("common.error"))
    : ""
);
const initialQueryError = computed(() =>
  deliveries.value.length === 0 ? queryErrorMessage.value : ""
);
const backgroundQueryError = computed(() =>
  deliveries.value.length > 0 ? queryErrorMessage.value : ""
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

function openTask(task: NotificationDeliveryTask) {
  if (anyCommandPending.value) {
    return;
  }
  taskContextVersion += 1;
  taskCommandError.value = "";
  retryTaskMutation.reset();
  cancelTaskMutation.reset();
  selectedTask.value = task;
  drawer.value = true;
}

function isCurrentTaskContext(
  context: NotificationTaskCommandContext | undefined
) {
  return isCurrentNotificationTaskContext(
    context,
    selectedTask.value?.id,
    taskContextVersion
  );
}

function retryDueDeliveries() {
  if (!canManage.value || anyCommandPending.value) {
    return;
  }
  retryDueMutation.mutate();
}

function retryTask() {
  const task = selectedTask.value;
  if (
    !task ||
    !canManage.value ||
    !canRetryNotificationDelivery(task) ||
    anyCommandPending.value
  ) {
    return;
  }
  retryTaskMutation.mutate({
    taskId: task.id,
    contextVersion: taskContextVersion
  });
}

function cancelTask() {
  const task = selectedTask.value;
  if (
    !task ||
    !canManage.value ||
    !canCancelNotificationDelivery(task) ||
    anyCommandPending.value
  ) {
    return;
  }
  cancelTaskMutation.mutate({
    taskId: task.id,
    contextVersion: taskContextVersion
  });
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

function showSuccess(message: string) {
  successMessage.value = message;
  successVisible.value = true;
}

watch(drawer, (open) => {
  if (!open) {
    taskContextVersion += 1;
    selectedTask.value = null;
    taskCommandError.value = "";
  }
});
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('nav.notifications')"
      :subtitle="t('notifications.subtitle')"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="deliveriesQuery.isFetching.value"
          :disabled="anyCommandPending"
          @click="refreshList"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn
          v-if="canManage"
          color="warning"
          variant="tonal"
          prepend-icon="mdi-reload-alert"
          :disabled="anyCommandPending"
          :loading="retryDueMutation.isPending.value"
          @click="retryDueDeliveries"
        >
          {{ t("notifications.retryDue") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-alert
      v-if="retryDueError"
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ retryDueError }}
    </v-alert>
    <v-alert
      v-if="backgroundQueryError"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      <div
        class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
      >
        <span>{{ t("notifications.refreshFailed") }}</span>
        <v-btn
          color="warning"
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          @click="refreshList"
        >
          {{ t("Retry") }}
        </v-btn>
      </div>
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
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t("notifications.loadedResults") }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <NotificationDeliveryFiltersCard
      class="mt-6"
      :filters="filters"
      :statuses="notificationDeliveryStatuses"
      :loaded-count="deliveries.length"
      :pending="deliveriesQuery.isFetching.value"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <v-card class="mt-4">
      <NotificationDeliveryResults
        :deliveries="deliveries"
        :pending="deliveriesQuery.isPending.value"
        :error-message="initialQueryError"
        :status-color="statusColor"
        @open="openTask"
        @retry="refreshList"
      />
      <v-divider v-if="deliveriesQuery.hasNextPage.value" />
      <div
        v-if="deliveriesQuery.hasNextPage.value"
        class="pa-4 text-center"
      >
        <v-btn
          variant="tonal"
          color="primary"
          :loading="deliveriesQuery.isFetchingNextPage.value"
          @click="loadMore"
        >
          {{ t("Load more") }}
        </v-btn>
      </div>
    </v-card>

    <NotificationDeliveryDetailDrawer
      v-model="drawer"
      :task="selectedTask"
      :can-manage="canManage"
      :can-retry="canRetrySelectedTask"
      :can-cancel="canCancelSelectedTask"
      :retry-pending="retryTaskMutation.isPending.value"
      :cancel-pending="cancelTaskMutation.isPending.value"
      :commands-disabled="retryDueMutation.isPending.value"
      :error-message="taskCommandError"
      :status-color="statusColor"
      @retry="retryTask"
      @cancel="cancelTask"
    />

    <v-snackbar v-model="successVisible" color="success" timeout="2800">
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>
