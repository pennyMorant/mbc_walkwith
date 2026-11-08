<script setup lang="ts">
import type {
  PaymentProviderEvent,
  PaymentProviderEventStatus
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";

import type { GivingProviderEventFilterForm } from "../giving_workspace_models";
import GivingFilterActions from "./GivingFilterActions.vue";
import GivingRefreshError from "./GivingRefreshError.vue";

defineProps<{
  filters: GivingProviderEventFilterForm;
  events: PaymentProviderEvent[];
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  refreshError: unknown;
  dateTime: (value: string | null | undefined) => string;
  eventStatusColor: (status: PaymentProviderEventStatus) => string;
}>();

defineEmits<{
  apply: [];
  clear: [];
  open: [event: PaymentProviderEvent];
  retry: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <div
      class="pa-5 d-flex flex-column flex-lg-row align-start align-lg-center justify-space-between ga-4"
    >
      <div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Payment provider events") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Stripe webhook delivery and processing history.") }}
        </div>
      </div>
      <v-form
        class="d-flex flex-column flex-sm-row align-sm-center ga-2 w-100 w-lg-auto"
        @submit.prevent="$emit('apply')"
      >
        <v-text-field
          v-model="filters.query"
          :label="t('Search')"
          density="compact"
          variant="outlined"
          hide-details
          style="min-width: 180px"
        />
        <v-select
          v-model="filters.status"
          :label="t('Status')"
          :items="optionItems(['', 'received', 'processed', 'ignored', 'failed'])"
          density="compact"
          variant="outlined"
          hide-details
          style="min-width: 160px"
        />
        <GivingFilterActions
          :pending="isFetching"
          @clear="$emit('clear')"
        />
      </v-form>
    </div>
    <v-divider />
    <v-progress-linear v-if="isPending" indeterminate color="primary" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <template v-else>
      <GivingRefreshError :error="refreshError" @retry="$emit('retry')" />
      <v-table density="comfortable">
      <thead>
        <tr>
          <th>{{ t("Provider") }}</th>
          <th>{{ t("Event type") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Provider event ID") }}</th>
          <th>{{ t("Received") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="events.length === 0">
          <td colspan="5" class="text-center text-medium-emphasis py-8">
            {{ t("No payment provider events match the current filters.") }}
          </td>
        </tr>
        <AdminTableActionRow
          v-for="event in events"
          :key="event.id"
          @activate="$emit('open', event)"
        >
          <td>{{ event.provider }}</td>
          <td>{{ event.eventType }}</td>
          <td>
            <v-chip size="small" :color="eventStatusColor(event.status)">
              {{ t(event.status) }}
            </v-chip>
          </td>
          <td>
            <div>{{ event.providerEventId }}</div>
            <div v-if="event.errorMessage" class="text-caption text-error mt-1">
              {{ event.errorMessage }}
            </div>
          </td>
          <td>
            <div>{{ dateTime(event.receivedAt) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ t("Processed") }}:
              {{ dateTime(event.processedAt) }}
            </div>
          </td>
        </AdminTableActionRow>
      </tbody>
      </v-table>
    </template>
  </v-card>
</template>
