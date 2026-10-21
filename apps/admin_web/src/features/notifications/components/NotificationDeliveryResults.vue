<script setup lang="ts">
import type {
  NotificationDeliveryStatus,
  NotificationDeliveryTask
} from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  deliveries: NotificationDeliveryTask[];
  pending: boolean;
  errorMessage: string;
  statusColor: (status: NotificationDeliveryStatus) => string;
}>();
defineEmits<{ open: [delivery: NotificationDeliveryTask] }>();

const { locale, t } = useI18n();
</script>

<template>
  <v-progress-linear v-if="pending" indeterminate color="primary" />
  <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="ma-4">
    {{ errorMessage }}
  </v-alert>
  <template v-else>
    <v-table class="d-none d-md-block" density="comfortable" hover>
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
          @click="$emit('open', delivery)"
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
          <td>{{ formatAdminDateTime(delivery.updatedAt, locale) }}</td>
        </tr>
        <tr v-if="deliveries.length === 0">
          <td colspan="6" class="text-center text-medium-emphasis py-8">
            {{ t("notifications.empty") }}
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <button
        v-for="delivery in deliveries"
        :key="delivery.id"
        class="notification-record"
        type="button"
        @click="$emit('open', delivery)"
      >
        <span class="notification-record__main">
          <strong>{{ delivery.payload.title }}</strong>
          <span>{{ delivery.type }} · {{ t(delivery.audience) }}</span>
          <span>{{ formatAdminDateTime(delivery.updatedAt, locale) }}</span>
        </span>
        <span class="notification-record__status">
          <v-chip size="small" :color="statusColor(delivery.status)">
            {{ t(delivery.status) }}
          </v-chip>
          <span>{{ t("Attempts") }}: {{ delivery.attempts }}</span>
        </span>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
      <div v-if="deliveries.length === 0" class="notification-record-empty">
        {{ t("notifications.empty") }}
      </div>
    </div>
  </template>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.notification-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.notification-record__main, .notification-record__status { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: 4px; }
.notification-record__main span, .notification-record__status > span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.notification-record-empty { padding: 28px 16px; color: rgba(var(--v-theme-on-surface), 0.62); text-align: center; }
</style>
