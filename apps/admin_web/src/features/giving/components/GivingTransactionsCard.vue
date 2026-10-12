<script setup lang="ts">
import type {
  GivingTransaction,
  GivingTransactionStatus
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  filters: {
    year: number;
    status: GivingTransactionStatus | "";
    category: string;
    fundId: string;
    query: string;
  };
  fundItems: Array<{ title: string; value: string }>;
  transactions: GivingTransaction[];
  isPending: boolean;
  error: unknown;
  dollars: (amountCents: number | undefined) => string;
  dateTime: (value: string | null | undefined) => string;
  fundName: (fundId: string | null) => string;
  statusColor: (status: GivingTransactionStatus) => string;
  refetch: () => unknown;
  openTransaction: (transaction: GivingTransaction) => void;
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card>
    <div class="pa-5">
      <v-row dense>
        <v-col cols="12" sm="6" lg="2">
          <v-text-field
            v-model.number="filters.year"
            :label="t('Year')"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="refetch"
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
            @update:model-value="refetch"
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
            @update:model-value="refetch"
          />
        </v-col>
        <v-col cols="12" sm="6" lg="2">
          <v-text-field
            v-model="filters.category"
            :label="t('Category')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="refetch"
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="refetch"
          />
        </v-col>
      </v-row>
    </div>
    <v-divider />
    <v-progress-linear v-if="isPending" indeterminate color="primary" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <v-table v-else density="comfortable">
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
        <tr
          v-for="transaction in transactions"
          :key="transaction.id"
          class="cursor-pointer"
          @click="openTransaction(transaction)"
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
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
