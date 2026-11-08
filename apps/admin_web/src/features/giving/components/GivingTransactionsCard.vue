<script setup lang="ts">
import type {
  GivingTransaction,
  GivingTransactionStatus
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";

import type { GivingTransactionFilterForm } from "../giving_workspace_models";
import GivingRefreshError from "./GivingRefreshError.vue";

defineProps<{
  filters: GivingTransactionFilterForm;
  fundItems: Array<{ title: string; value: string }>;
  transactions: GivingTransaction[];
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  refreshError: unknown;
  dollars: (amountCents: number | undefined) => string;
  dateTime: (value: string | null | undefined) => string;
  fundName: (fundId: string | null) => string;
  statusColor: (status: GivingTransactionStatus) => string;
}>();

defineEmits<{
  apply: [];
  clear: [];
  open: [transaction: GivingTransaction];
  retry: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card>
    <v-form class="pa-5" @submit.prevent="$emit('apply')">
      <v-row dense>
        <v-col cols="12" sm="6" lg="2">
          <v-text-field
            v-model.number="filters.year"
            :label="t('Year')"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" lg="2">
          <v-select
            v-model="filters.status"
            :label="t('Status')"
            :items="optionItems(['', 'pending', 'succeeded', 'failed', 'refunded'])"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-select
            v-model="filters.fundId"
            :label="t('Fund')"
            :items="fundItems"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" lg="2">
          <v-text-field
            v-model="filters.category"
            :label="t('Category')"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>
      <AdminFilterActions
        class="mt-4"
        :apply-label="t('giving.applyFilters')"
        :clear-label="t('giving.clearFilters')"
        :loading="isFetching"
        @clear="$emit('clear')"
      />
    </v-form>
    <v-divider />
    <v-progress-linear v-if="isPending" indeterminate color="primary" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <template v-else>
      <GivingRefreshError :error="refreshError" @retry="$emit('retry')" />
      <AdminResponsiveTable>
        <template #desktop>
          <v-table density="comfortable">
      <thead>
        <tr>
          <th>{{ t("Donor") }}</th>
          <th>{{ t("Amount") }}</th>
          <th>{{ t("Fund") }}</th>
          <th>{{ t("Category") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Provider") }}</th>
          <th>{{ t("Given") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="transactions.length === 0">
          <td colspan="7" class="text-center text-medium-emphasis py-8">
            {{ t("No giving transactions match the current filters.") }}
          </td>
        </tr>
        <AdminTableActionRow
          v-for="transaction in transactions"
          :key="transaction.id"
          @activate="$emit('open', transaction)"
        >
          <td>
            <div class="font-weight-bold">
              {{ transaction.donorName || t("Anonymous") }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ transaction.donorEmail || transaction.userId || t("No ID") }}
            </div>
          </td>
          <td>{{ dollars(transaction.amountCents) }}</td>
          <td>{{ fundName(transaction.fundId) }}</td>
          <td>{{ t(transaction.category) }}</td>
          <td>
            <v-chip size="small" :color="statusColor(transaction.status)">
              {{ t(transaction.status) }}
            </v-chip>
          </td>
          <td>
            <div class="font-weight-bold">{{ transaction.provider }}</div>
            <div class="text-caption text-medium-emphasis">
              {{
                transaction.providerTransactionId ||
                transaction.providerCheckoutSessionId ||
                t("Pending")
              }}
            </div>
          </td>
          <td>{{ dateTime(transaction.givenAt) }}</td>
        </AdminTableActionRow>
      </tbody>
          </v-table>
        </template>
        <template #mobile>
          <div v-if="transactions.length === 0" class="text-center text-medium-emphasis py-8 px-4">
            {{ t("No giving transactions match the current filters.") }}
          </div>
          <AdminMobileRecord
            v-for="transaction in transactions"
            :key="transaction.id"
            @activate="$emit('open', transaction)"
          >
            <strong>{{ transaction.donorName || t("Anonymous") }}</strong>
            <span>{{ transaction.donorEmail || transaction.userId || t("No ID") }}</span>
            <span>{{ dollars(transaction.amountCents) }} · {{ fundName(transaction.fundId) }}</span>
            <span>{{ t(transaction.category) }} · {{ dateTime(transaction.givenAt) }}</span>
            <span>
              {{ transaction.provider }} ·
              {{
                transaction.providerTransactionId ||
                transaction.providerCheckoutSessionId ||
                t("Pending")
              }}
            </span>
            <template #trailing>
              <v-chip size="small" :color="statusColor(transaction.status)">
                {{ t(transaction.status) }}
              </v-chip>
            </template>
          </AdminMobileRecord>
        </template>
      </AdminResponsiveTable>
    </template>
  </v-card>
</template>
