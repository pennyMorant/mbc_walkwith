<script setup lang="ts">
import type {
  PaymentProviderEvent,
  PaymentProviderEventStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  event: PaymentProviderEvent | null;
  dateTime: (value: string | null | undefined) => string;
  eventStatusColor: (status: PaymentProviderEventStatus) => string;
}>();

const drawer = defineModel<boolean>({ required: true });
const { t } = useI18n();
</script>

<template>
  <v-navigation-drawer v-model="drawer" location="right" temporary width="460">
    <div v-if="event" class="pa-5">
      <div class="text-h6 font-weight-bold">
        {{ t("Payment provider event") }}
      </div>
      <div class="text-body-2 text-medium-emphasis mt-1">
        {{ event.id }}
      </div>

      <v-card class="pa-4 mt-5" variant="outlined">
        <div class="d-flex justify-space-between ga-4">
          <div>
            <div class="text-caption text-medium-emphasis">
              {{ t("Event type") }}
            </div>
            <div class="font-weight-bold">
              {{ event.eventType }}
            </div>
          </div>
          <v-chip size="small" :color="eventStatusColor(event.status)">
            {{ t(event.status) }}
          </v-chip>
        </div>
      </v-card>

      <v-list class="mt-4" density="compact">
        <v-list-item :title="t('Provider')" :subtitle="event.provider" />
        <v-list-item
          :title="t('Provider event ID')"
          :subtitle="event.providerEventId"
        />
        <v-list-item :title="t('Received')" :subtitle="dateTime(event.receivedAt)" />
        <v-list-item
          :title="t('Processed')"
          :subtitle="dateTime(event.processedAt)"
        />
        <v-list-item
          :title="t('Error message')"
          :subtitle="event.errorMessage || t('common.notSet')"
        />
      </v-list>
    </div>
  </v-navigation-drawer>
</template>
