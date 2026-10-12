<script setup lang="ts">
import { formatApiErrorMessage } from "@/core/api/api_errors";

import GivingCategoryReportCard from "../components/GivingCategoryReportCard.vue";
import GivingFundDrawer from "../components/GivingFundDrawer.vue";
import GivingFundsCard from "../components/GivingFundsCard.vue";
import GivingProviderEventDrawer from "../components/GivingProviderEventDrawer.vue";
import GivingProviderEventsCard from "../components/GivingProviderEventsCard.vue";
import GivingReconciliationCard from "../components/GivingReconciliationCard.vue";
import GivingStatementGeneratorCard from "../components/GivingStatementGeneratorCard.vue";
import GivingStatementsCard from "../components/GivingStatementsCard.vue";
import GivingSummaryCards from "../components/GivingSummaryCards.vue";
import GivingTransactionDrawer from "../components/GivingTransactionDrawer.vue";
import GivingTransactionsCard from "../components/GivingTransactionsCard.vue";
import { useGivingPageController } from "../composables/use_giving_page_controller";

const {
  canExport,
  canDownloadStatement,
  canGenerateStatement,
  canManageFunds,
  canSaveFund,
  dateTime,
  dollars,
  downloadStatement,
  downloadStatementError,
  eventStatusColor,
  exportedCsv,
  exportedFilename,
  exportTransactions,
  exportTransactionsError,
  filters,
  fundDrawer,
  fundCodeValid,
  fundFilterItems,
  fundFilters,
  fundForm,
  fundName,
  fundProgress,
  fundSaveError,
  funds,
  fundsError,
  fundsPending,
  generateStatement,
  generateStatementError,
  isDownloadingStatement,
  isExportingTransactions,
  isGeneratingStatement,
  isRefreshing,
  isSavingFund,
  newFund,
  providerEventDrawer,
  providerEventFilters,
  providerEvents,
  providerEventsError,
  providerEventsFetching,
  providerEventsPending,
  reconciliation,
  reconciliationError,
  reconciliationFetching,
  reconciliationFilters,
  reconciliationPending,
  refreshFunds,
  refreshProviderEvents,
  refreshReconciliation,
  refreshStatements,
  refreshTransactions,
  saveFund,
  selectedProviderEvent,
  selectedFund,
  selectedTransaction,
  statementFilters,
  statementForm,
  statements,
  statementsError,
  statementsPending,
  summary,
  t,
  transactionDrawer,
  transactions,
  transactionsError,
  transactionsPending,
  openFund,
  openProviderEvent,
  openTransaction,
  refreshAll,
  statusColor
} = useGivingPageController();
</script>

<template>
  <div>
    <div
      class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
    >
      <div>
        <div class="page-title">{{ t("nav.giving") }}</div>
        <div class="page-subtitle">
          {{ t("giving.pageSubtitle") }}
        </div>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          color="primary"
          variant="tonal"
          :loading="isRefreshing"
          @click="refreshAll"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!canExport"
          :loading="isExportingTransactions"
          @click="exportTransactions"
        >
          {{ t("Export CSV") }}
        </v-btn>
      </div>
    </div>

    <GivingSummaryCards :summary="summary" :dollars="dollars" />

    <GivingReconciliationCard
      :filters="reconciliationFilters"
      :fund-items="fundFilterItems"
      :reconciliation="reconciliation"
      :is-pending="reconciliationPending"
      :is-fetching="reconciliationFetching"
      :error="reconciliationError"
      :dollars="dollars"
      :refetch="refreshReconciliation"
    />

    <v-row class="mt-6" dense>
      <v-col cols="12" lg="8">
        <GivingTransactionsCard
          :filters="filters"
          :fund-items="fundFilterItems"
          :transactions="transactions"
          :is-pending="transactionsPending"
          :error="transactionsError"
          :dollars="dollars"
          :date-time="dateTime"
          :fund-name="fundName"
          :status-color="statusColor"
          :refetch="refreshTransactions"
          :open-transaction="openTransaction"
        />
      </v-col>

      <v-col cols="12" lg="4">
        <GivingFundsCard
          :filters="fundFilters"
          :funds="funds"
          :can-manage="canManageFunds"
          :is-pending="fundsPending"
          :error="fundsError"
          :dollars="dollars"
          :fund-progress="fundProgress"
          :refetch="refreshFunds"
          :new-fund="newFund"
          :open-fund="openFund"
        />

        <GivingCategoryReportCard :summary="summary" :dollars="dollars" />

        <GivingStatementGeneratorCard
          :can-export="canExport"
          :can-generate="canGenerateStatement"
          :error="generateStatementError"
          :form="statementForm"
          :generate="generateStatement"
          :is-generating="isGeneratingStatement"
        />
      </v-col>
    </v-row>

    <GivingStatementsCard
      :filters="statementFilters"
      :statements="statements"
      :can-download-statement="canDownloadStatement"
      :download-statement="downloadStatement"
      :is-downloading-statement="isDownloadingStatement"
      :is-pending="statementsPending"
      :error="statementsError || downloadStatementError"
      :dollars="dollars"
      :status-color="statusColor"
      :refetch="refreshStatements"
    />

    <v-alert
      v-if="exportTransactionsError"
      class="mt-6"
      type="error"
      variant="tonal"
    >
      {{ formatApiErrorMessage(exportTransactionsError, t("common.error")) }}
    </v-alert>

    <v-card v-if="exportedCsv" class="pa-5 mt-6">
      <div class="text-subtitle-1 font-weight-bold">
        {{ exportedFilename || t("Latest CSV export") }}
      </div>
      <v-textarea
        v-model="exportedCsv"
        rows="8"
        readonly
        density="comfortable"
        variant="outlined"
        class="mt-4"
      />
    </v-card>

    <GivingProviderEventsCard
      :filters="providerEventFilters"
      :events="providerEvents"
      :date-time="dateTime"
      :is-pending="providerEventsPending"
      :is-fetching="providerEventsFetching"
      :error="providerEventsError"
      :event-status-color="eventStatusColor"
      :refetch="refreshProviderEvents"
      :open-provider-event="openProviderEvent"
    />

    <GivingTransactionDrawer
      v-model="transactionDrawer"
      :transaction="selectedTransaction"
      :date-time="dateTime"
      :dollars="dollars"
      :fund-name="fundName"
      :status-color="statusColor"
    />

    <GivingProviderEventDrawer
      v-model="providerEventDrawer"
      :event="selectedProviderEvent"
      :date-time="dateTime"
      :event-status-color="eventStatusColor"
    />

    <GivingFundDrawer
      v-model="fundDrawer"
      :fund="selectedFund"
      :can-manage="canManageFunds"
      :can-save="canSaveFund"
      :code-valid="fundCodeValid"
      :dollars="dollars"
      :error="fundSaveError"
      :form="fundForm"
      :is-saving="isSavingFund"
      :save="saveFund"
    />
  </div>
</template>
