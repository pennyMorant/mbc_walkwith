<script setup lang="ts">
import type {
  NotificationDeliveryStatus,
  NotificationDeliveryTask
} from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";

defineProps<{
  deliveries: NotificationDeliveryTask[];
  pending: boolean;
  errorMessage: string;
  statusColor: (status: NotificationDeliveryStatus) => string;
}>();
defineEmits<{ open: [delivery: NotificationDeliveryTask]; retry: [] }>();

const { locale, t } = useI18n();
</script>

<template>
  <AdminDataState
    :pending="pending"
    :error-message="errorMessage"
    :empty="deliveries.length === 0"
    :empty-title="t('notifications.empty')"
    empty-icon="mdi-bell-off-outline"
    :retry-label="t('Retry')"
    @retry="$emit('retry')"
  >
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
        <AdminTableActionRow
          v-for="delivery in deliveries"
          :key="delivery.id"
          @activate="$emit('open', delivery)"
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
        </AdminTableActionRow>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <AdminMobileRecord
        v-for="delivery in deliveries"
        :key="delivery.id"
        @activate="$emit('open', delivery)"
      >
        <strong>{{ delivery.payload.title }}</strong>
        <span>{{ delivery.type }} · {{ t(delivery.audience) }}</span>
        <span>{{ formatAdminDateTime(delivery.updatedAt, locale) }}</span>
        <template #trailing>
          <v-chip size="small" :color="statusColor(delivery.status)">
            {{ t(delivery.status) }}
          </v-chip>
          <span>{{ t("Attempts") }}: {{ delivery.attempts }}</span>
        </template>
      </AdminMobileRecord>
    </div>
  </AdminDataState>
</template>
