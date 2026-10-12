<script setup lang="ts">
import type {
  GivingReconciliationResponse,
  GivingReconciliationStatus
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  filters: {
    year: number;
    provider: string;
    status: GivingReconciliationStatus | "";
    fundId: string;
  };
  fundItems: Array<{ title: string; value: string }>;
  reconciliation: GivingReconciliationResponse | undefined;
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  dollars: (amountCents: number | undefined) => string;
  refetch: () => unknown;
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <div class="pa-5 d-flex flex-column flex-lg-row align-start align-lg-center justify-space-between ga-4">
      <div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Reconciliation") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Fees, net deposits, refunds, disputes, and payout readiness.") }}
        </div>
      </div>
      <div class="d-flex flex-column flex-sm-row ga-2 w-100 w-lg-auto">
        <v-text-field
          v-model.number="filters.year"
          :label="t('Year')"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          style="min-width: 120px"
          @keyup.enter="refetch"
        />
        <v-select
          v-model="filters.fundId"
          :label="t('Fund')"
          :items="fundItems"
          density="compact"
          variant="outlined"
          hide-details
          style="min-width: 190px"
          @update:model-value="refetch"
        />
        <v-select
          v-model="filters.status"
          :label="t('Status')"
          :items="optionItems(['', 'unreconciled', 'reconciled', 'needs_review'])"
          density="compact"
          variant="outlined"
          hide-details
          style="min-width: 170px"
          @update:model-value="refetch"
        />
        <v-btn variant="tonal" :loading="isFetching" @click="refetch">
          {{ t("common.refresh") }}
        </v-btn>
      </div>
    </div>
    <v-divider />
    <v-progress-linear v-if="isPending" indeterminate color="primary" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <v-row v-else class="pa-5" dense>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">{{ t("Gross") }}</div>
          <div class="text-h6 font-weight-bold">
            {{ dollars(reconciliation?.grossAmountCents) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">{{ t("Fees") }}</div>
          <div class="text-h6 font-weight-bold">
            {{ dollars(reconciliation?.feeCents) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">{{ t("Net") }}</div>
          <div class="text-h6 font-weight-bold">
            {{ dollars(reconciliation?.netAmountCents) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">
            {{ t("Needs review") }}
          </div>
          <div class="text-h6 font-weight-bold">
            {{ reconciliation?.needsReviewCount ?? 0 }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <div class="text-caption text-medium-emphasis">{{ t("Refunded") }}</div>
        <div class="font-weight-bold">
          {{ dollars(reconciliation?.refundedAmountCents) }}
        </div>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <div class="text-caption text-medium-emphasis">{{ t("Disputed") }}</div>
        <div class="font-weight-bold">
          {{ dollars(reconciliation?.disputedAmountCents) }}
        </div>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <div class="text-caption text-medium-emphasis">{{ t("Payouts") }}</div>
        <div class="font-weight-bold">
          {{ reconciliation?.payoutCount ?? 0 }}
        </div>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <div class="text-caption text-medium-emphasis">
          {{ t("Unreconciled") }}
        </div>
        <div class="font-weight-bold">
          {{ reconciliation?.unreconciledCount ?? 0 }}
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>
