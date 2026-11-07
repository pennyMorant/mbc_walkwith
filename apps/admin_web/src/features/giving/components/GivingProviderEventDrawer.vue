<script setup lang="ts">
import type {
  PaymentProviderEvent,
  PaymentProviderEventStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDrawerHeader from "@/core/ui/AdminDrawerHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

defineProps<{
  event: PaymentProviderEvent | null;
  dateTime: (value: string | null | undefined) => string;
  eventStatusColor: (status: PaymentProviderEventStatus) => string;
}>();

const drawer = defineModel<boolean>({ required: true });
const { t } = useI18n();
</script>

<template>
  <AdminResponsiveDrawer v-model="drawer" :desktop-width="460">
    <div v-if="event" class="pa-5">
      <AdminDrawerHeader
        :title="t('Payment provider event')"
        :subtitle="event.id"
        :close-label="t('common.close')"
        @close="drawer = false"
      >
        <template #meta>
          <v-chip size="small" :color="eventStatusColor(event.status)">
            {{ t(event.status) }}
          </v-chip>
        </template>
      </AdminDrawerHeader>

      <v-card class="pa-4 mt-5" variant="outlined">
        <div>
          <div class="text-caption text-medium-emphasis">
            {{ t("Event type") }}
          </div>
          <div class="font-weight-bold">
            {{ event.eventType }}
          </div>
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
  </AdminResponsiveDrawer>
</template>
