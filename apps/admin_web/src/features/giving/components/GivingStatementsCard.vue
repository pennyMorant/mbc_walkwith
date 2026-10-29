<script setup lang="ts">
import type {
  GivingStatement,
  GivingStatementStatus
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

import type { GivingStatementFilterForm } from "../giving_workspace_models";
import GivingFilterActions from "./GivingFilterActions.vue";
import GivingRefreshError from "./GivingRefreshError.vue";

defineProps<{
  filters: GivingStatementFilterForm;
  statements: GivingStatement[];
  canDownloadStatement: (statement: GivingStatement) => boolean;
  downloadStatement: (statement: GivingStatement) => void;
  isPending: boolean;
  isFetching: boolean;
  isDownloadingStatement: boolean;
  error: unknown;
  refreshError: unknown;
  dollars: (amountCents: number | undefined) => string;
  statusColor: (status: GivingStatementStatus) => string;
}>();

defineEmits<{ apply: []; clear: []; retry: [] }>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <div
      class="pa-5 d-flex flex-column flex-lg-row align-start align-lg-center justify-space-between ga-4"
    >
      <div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Annual statements") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("giving.statementsSubtitle") }}
        </div>
      </div>
      <v-form
        class="d-flex flex-column flex-sm-row align-sm-center ga-2 w-100 w-lg-auto"
        @submit.prevent="$emit('apply')"
      >
        <v-text-field
          v-model.number="filters.year"
          :label="t('Year')"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 120px"
        />
        <v-select
          v-model="filters.status"
          :label="t('Status')"
          :items="optionItems(['', 'pending', 'ready', 'sent', 'failed'])"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 150px"
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
          <th>{{ t("Donor") }}</th>
          <th>{{ t("Year") }}</th>
          <th>{{ t("Total") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("PDF key") }}</th>
          <th>{{ t("Actions") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="statements.length === 0">
          <td colspan="6" class="text-center text-medium-emphasis py-8">
            {{ t("giving.noStatements") }}
          </td>
        </tr>
        <tr
          v-for="statement in statements"
          :key="statement.id"
        >
          <td>{{ statement.donorName || statement.userId || t("All donors") }}</td>
          <td>{{ statement.taxYear }}</td>
          <td>{{ dollars(statement.totalAmountCents) }}</td>
          <td>
            <v-chip size="small" :color="statusColor(statement.status)">
              {{ t(statement.status) }}
            </v-chip>
          </td>
          <td>{{ statement.pdfObjectKey || t("Not generated") }}</td>
          <td>
            <v-btn
              size="small"
              variant="tonal"
              :disabled="isDownloadingStatement || !canDownloadStatement(statement)"
              :loading="isDownloadingStatement"
              @click="downloadStatement(statement)"
            >
              {{ t("Download") }}
            </v-btn>
          </td>
        </tr>
      </tbody>
      </v-table>
    </template>
  </v-card>
</template>
