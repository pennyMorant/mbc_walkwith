<script setup lang="ts">
import type { GivingFund, GivingFundStatus } from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  filters: {
    status: GivingFundStatus | "";
    query: string;
  };
  funds: GivingFund[];
  canManage: boolean;
  isPending: boolean;
  error: unknown;
  dollars: (amountCents: number | undefined) => string;
  fundProgress: (fund: GivingFund) => number | null;
  refetch: () => unknown;
  newFund: () => void;
  openFund: (fund: GivingFund) => void;
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card class="pa-5">
    <div class="d-flex align-center justify-space-between ga-3">
      <div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Giving funds") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Active purposes and restricted funds.") }}
        </div>
      </div>
      <v-chip size="small" variant="tonal">
        {{ canManage ? t("Manageable") : t("Read only") }}
      </v-chip>
      <v-btn
        v-if="canManage"
        color="primary"
        size="small"
        variant="tonal"
        @click="newFund"
      >
        {{ t("New fund") }}
      </v-btn>
    </div>

    <v-row class="mt-4" dense>
      <v-col cols="12" sm="6">
        <v-select
          v-model="filters.status"
          :label="t('Status')"
          :items="optionItems(['', 'draft', 'active', 'paused', 'archived'])"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="refetch"
        />
      </v-col>
      <v-col cols="12" sm="6">
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

    <v-progress-linear v-if="isPending" class="mt-4" indeterminate />
    <v-alert v-else-if="error" type="error" variant="tonal" class="mt-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <v-alert
      v-else-if="funds.length === 0"
      type="info"
      variant="tonal"
      class="mt-4"
    >
      {{ t("No giving funds match the current filters.") }}
    </v-alert>
    <v-list v-else density="compact" class="mt-3">
      <v-list-item
        v-for="fund in funds"
        :key="fund.id"
        class="px-0"
        @click="openFund(fund)"
      >
        <template #title>
          <div class="d-flex align-center ga-2">
            <span class="font-weight-bold">{{ fund.name }}</span>
            <v-chip size="x-small" variant="tonal">
              {{ t(fund.status) }}
            </v-chip>
          </div>
        </template>
        <template #subtitle>
          <div>{{ fund.description || fund.code }}</div>
          <div v-if="fundProgress(fund) !== null" class="mt-2">
            <v-progress-linear
              :model-value="fundProgress(fund) ?? 0"
              color="primary"
              height="5"
              rounded
            />
            <div class="text-caption text-medium-emphasis mt-1">
              {{ dollars(fund.totalAmountCents) }} / {{ dollars(fund.targetAmountCents ?? 0) }}
            </div>
          </div>
        </template>
        <template #append>
          <div class="text-right">
            <div class="font-weight-bold">
              {{ dollars(fund.totalAmountCents) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ fund.transactionCount }} {{ t("Transactions") }}
            </div>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>
