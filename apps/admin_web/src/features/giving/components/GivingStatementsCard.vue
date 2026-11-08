<script setup lang="ts">
import type {
  GivingStatementView,
  GivingStatementStatus
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

import type { GivingStatementFilterForm } from "../giving_workspace_models";
import GivingRefreshError from "./GivingRefreshError.vue";

defineProps<{
  filters: GivingStatementFilterForm;
  statements: GivingStatementView[];
  canDownloadStatement: (statement: GivingStatementView) => boolean;
  downloadStatement: (statement: GivingStatementView) => void;
  downloadingStatementId: string | null;
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
    <AdminFilterToolbar class="pa-5" @apply="$emit('apply')">
      <template #heading>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Annual statements") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("giving.statementsSubtitle") }}
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
        v-model="filters.status"
        class="admin-filter-control"
        :label="t('Status')"
        :items="optionItems(['', 'pending', 'ready', 'sent', 'failed'])"
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
      <AdminResponsiveTable>
        <template #desktop>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>{{ t("Donor") }}</th>
                <th>{{ t("Year") }}</th>
                <th>{{ t("Total") }}</th>
                <th>{{ t("Status") }}</th>
                <th>{{ t("Document") }}</th>
                <th>{{ t("Actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="statements.length === 0">
                <td colspan="6" class="text-center text-medium-emphasis py-8">
                  {{ t("giving.noStatements") }}
                </td>
              </tr>
              <tr v-for="statement in statements" :key="statement.id">
                <td>{{ statement.donorName || statement.userId || t("All donors") }}</td>
                <td>{{ statement.taxYear }}</td>
                <td>{{ dollars(statement.totalAmountCents) }}</td>
                <td>
                  <v-chip size="small" :color="statusColor(statement.status)">
                    {{ t(statement.status) }}
                  </v-chip>
                </td>
                <td>
                  {{ statement.downloadAvailable ? t("Ready") : t("Not generated") }}
                </td>
                <td>
                  <v-btn
                    size="small"
                    variant="tonal"
                    :disabled="isDownloadingStatement || !canDownloadStatement(statement)"
                    :loading="isDownloadingStatement && downloadingStatementId === statement.id"
                    @click="downloadStatement(statement)"
                  >
                    {{ t("Download") }}
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
        <template #mobile>
          <div class="px-4">
            <div
              v-if="statements.length === 0"
              class="text-center text-medium-emphasis py-8"
            >
              {{ t("giving.noStatements") }}
            </div>
            <AdminMobileDataRow
              v-for="statement in statements"
              :key="statement.id"
            >
              <strong>{{ statement.donorName || statement.userId || t("All donors") }}</strong>
              <span>{{ statement.taxYear }} · {{ dollars(statement.totalAmountCents) }}</span>
              <template #trailing>
                <v-chip size="small" :color="statusColor(statement.status)">
                  {{ t(statement.status) }}
                </v-chip>
              </template>
              <template #meta>
                <span>{{ statement.downloadAvailable ? t("Ready") : t("Not generated") }}</span>
              </template>
              <template #actions>
                <v-btn
                  block
                  size="small"
                  variant="tonal"
                  :disabled="isDownloadingStatement || !canDownloadStatement(statement)"
                  :loading="isDownloadingStatement && downloadingStatementId === statement.id"
                  @click="downloadStatement(statement)"
                >
                  {{ t("Download") }}
                </v-btn>
              </template>
            </AdminMobileDataRow>
          </div>
        </template>
      </AdminResponsiveTable>
    </template>
  </v-card>
</template>
