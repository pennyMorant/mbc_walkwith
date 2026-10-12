<script setup lang="ts">
import type {
  GivingStatement,
  GivingStatementStatus
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  filters: {
    year: number;
    status: GivingStatementStatus | "";
  };
  statements: GivingStatement[];
  canDownloadStatement: (statement: GivingStatement) => boolean;
  downloadStatement: (statement: GivingStatement) => void;
  isPending: boolean;
  isDownloadingStatement: boolean;
  error: unknown;
  dollars: (amountCents: number | undefined) => string;
  statusColor: (status: GivingStatementStatus) => string;
  refetch: () => unknown;
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <div class="pa-5 d-flex align-center justify-space-between">
      <div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Annual statements") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("giving.statementsSubtitle") }}
        </div>
      </div>
      <div class="d-flex ga-2">
        <v-text-field
          v-model.number="filters.year"
          :label="t('Year')"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 120px"
          @keyup.enter="refetch"
        />
        <v-select
          v-model="filters.status"
          :label="t('Status')"
          :items="optionItems(['', 'pending', 'ready', 'sent', 'failed'])"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 150px"
          @update:model-value="refetch"
        />
      </div>
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
          <th>{{ t("Year") }}</th>
          <th>{{ t("Total") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("PDF key") }}</th>
          <th>{{ t("Actions") }}</th>
        </tr>
      </thead>
      <tbody>
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
  </v-card>
</template>
