<script setup lang="ts">
import type {
  NotificationDeliveryStatus,
  NotificationDeliveryTask
} from "@mbc/api-contracts";
import { computed, ref, watch } from "vue";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

const drawer = defineModel<boolean>({ required: true });
const props = defineProps<{
  task: NotificationDeliveryTask | null;
  canManage: boolean;
  canRetry: boolean;
  canCancel: boolean;
  retryPending: boolean;
  cancelPending: boolean;
  commandsDisabled: boolean;
  errorMessage: string;
  statusColor: (status: NotificationDeliveryStatus) => string;
}>();

const emit = defineEmits<{ retry: []; cancel: [] }>();
const { locale, t } = useI18n();
const confirmCancel = ref(false);
const busy = computed(() => props.retryPending || props.cancelPending);
const commandUnavailable = computed(
  () => busy.value || props.commandsDisabled
);
const drawerProxy = computed({
  get: () => drawer.value,
  set: (open: boolean) => {
    if (open || !busy.value) {
      drawer.value = open;
    }
  }
});

watch(drawer, (open) => {
  if (!open) {
    confirmCancel.value = false;
  }
});

function requestCancel() {
  if (props.canManage && props.canCancel && !commandUnavailable.value) {
    confirmCancel.value = true;
  }
}

function confirmCancellation() {
  confirmCancel.value = false;
  emit("cancel");
}

function json(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function dateTime(value: string | null) {
  return value ? formatAdminDateTime(value, locale.value) : t("common.notSet");
}
</script>

<template>
  <AdminResponsiveDrawer v-model="drawerProxy" :desktop-width="560">
    <div v-if="task" class="pa-5">
      <div class="d-flex align-start justify-space-between ga-3">
        <div class="min-width-0">
          <div class="text-h6 font-weight-bold text-wrap">
            {{ task.payload.title || task.type }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1 id-text">
            {{ task.type }} · {{ task.id }}
          </div>
        </div>
        <div class="d-flex align-center ga-1">
          <v-chip :color="statusColor(task.status)">
            {{ t(task.status) }}
          </v-chip>
          <v-btn
            icon="mdi-close"
            variant="text"
            :aria-label="t('common.close')"
            :disabled="busy"
            @click="drawerProxy = false"
          />
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-5">
        {{ errorMessage }}
      </v-alert>

      <v-list density="compact" class="mt-4 detail-list">
        <v-list-item
          :title="t('notifications.messageId')"
          :subtitle="task.messageId || t('common.notSet')"
        />
        <v-list-item
          :title="t('notifications.audience')"
          :subtitle="t(task.audience)"
        />
        <v-list-item
          :title="t('notifications.preference')"
          :subtitle="task.preferenceKey || t('common.notSet')"
        />
        <v-list-item
          :title="t('notifications.recipients')"
          :subtitle="String(task.recipientCount)"
        />
        <v-list-item
          :title="t('notifications.attempts')"
          :subtitle="String(task.attempts)"
        />
        <v-list-item
          :title="t('notifications.nextAttempt')"
          :subtitle="dateTime(task.nextAttemptAt)"
        />
        <v-list-item
          :title="t('notifications.lastErrorCode')"
          :subtitle="task.lastErrorCode || t('common.notSet')"
        />
        <v-list-item
          :title="t('notifications.lastError')"
          :subtitle="task.lastErrorMessage || t('common.notSet')"
        />
        <v-list-item
          :title="t('notifications.updatedAt')"
          :subtitle="dateTime(task.updatedAt)"
        />
      </v-list>

      <div v-if="canManage" class="d-flex flex-wrap ga-2 mt-5">
        <v-btn
          color="warning"
          variant="tonal"
          prepend-icon="mdi-reload"
          :disabled="!canRetry || commandUnavailable"
          :loading="retryPending"
          @click="$emit('retry')"
        >
          {{ t("notifications.retryOne") }}
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-cancel"
          :disabled="!canCancel || commandUnavailable"
          :loading="cancelPending"
          @click="requestCancel"
        >
          {{ t("notifications.cancel") }}
        </v-btn>
      </div>

      <div class="text-subtitle-2 font-weight-bold mt-7">
        {{ t("notifications.payload") }}
      </div>
      <div class="text-body-2 text-medium-emphasis mt-1">
        {{ t("notifications.payloadHelp") }}
      </div>
      <pre class="json-block mt-3">{{ json(task.payload) }}</pre>

      <div class="text-subtitle-2 font-weight-bold mt-7">
        {{ t("notifications.providerEvidence") }}
      </div>
      <div class="text-body-2 text-medium-emphasis mt-1">
        {{ t("notifications.providerEvidenceHelp") }}
      </div>
      <pre class="json-block mt-3">{{ json(task.providerEvidence) }}</pre>
    </div>
  </AdminResponsiveDrawer>

  <v-dialog v-model="confirmCancel" max-width="440" :persistent="cancelPending">
    <v-card>
      <v-card-title class="text-h6 px-6 pt-6">
        {{ t("notifications.cancelConfirmTitle") }}
      </v-card-title>
      <v-card-text class="px-6 pt-4">
        {{ t("notifications.cancelConfirmBody") }}
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="cancelPending"
          @click="confirmCancel = false"
        >
          {{ t("common.cancel") }}
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :disabled="cancelPending"
          @click="confirmCancellation"
        >
          {{ t("notifications.cancel") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.min-width-0 {
  min-width: 0;
}

.id-text,
.detail-list :deep(.v-list-item-subtitle) {
  overflow-wrap: anywhere;
  white-space: normal;
}

.json-block {
  max-height: 260px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.32);
  padding: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
