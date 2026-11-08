<script setup lang="ts">
import type { GivingReconciliationResponse } from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

import type { GivingReconciliationFilterForm } from "../giving_workspace_models";
import GivingRefreshError from "./GivingRefreshError.vue";

defineProps<{
  filters: GivingReconciliationFilterForm;
  fundItems: Array<{ title: string; value: string }>;
  reconciliation: GivingReconciliationResponse | undefined;
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  refreshError: unknown;
  dollars: (amountCents: number | undefined) => string;
}>();

defineEmits<{ apply: []; clear: []; retry: [] }>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <AdminFilterToolbar class="pa-5" @apply="$emit('apply')">
      <template #heading>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Reconciliation") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Fees, net deposits, refunds, disputes, and payout readiness.") }}
        </div>
      </template>
      <v-text-field
        v-model.number="filters.year"
        class="admin-filter-control"
        :label="t('Year')"
        type="number"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="filters.fundId"
        class="admin-filter-control"
        :label="t('Fund')"
        :items="fundItems"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="filters.status"
        class="admin-filter-control"
        :label="t('Status')"
        :items="optionItems(['', 'unreconciled', 'reconciled', 'needs_review'])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <template #actions>
        <AdminFilterActions
          :apply-label="t('giving.applyFilters')"
          :clear-label="t('giving.clearFilters')"
          :loading="isFetching"
          @clear="$emit('clear')"
        />
      </template>
    </AdminFilterToolbar>
    <v-divider />
    <v-progress-linear v-if="isPending" indeterminate color="primary" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <template v-else>
      <GivingRefreshError :error="refreshError" @retry="$emit('retry')" />
      <v-row class="pa-5" dense>
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
    </template>
  </v-card>
</template>
