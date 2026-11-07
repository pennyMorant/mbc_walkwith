<script setup lang="ts">
import { formatApiErrorMessage } from "@/core/api/api_errors";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminRefreshButton from "@/core/ui/AdminRefreshButton.vue";

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
  applyFundFilters,
  applyProviderEventFilters,
  applyReconciliationFilters,
  applyStatementFilters,
  applyTransactionFilters,
  canExport,
  canDownloadStatement,
  canGenerateStatement,
  canManageFunds,
  canSaveFund,
  clearFundFilters,
  clearProviderEventFilters,
  clearReconciliationFilters,
  clearStatementFilters,
  clearTransactionFilters,
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
  fundDirectoryError,
  fundFilterItems,
  fundFilters,
  fundForm,
  fundName,
  fundProgress,
  fundSaveError,
  funds,
  fundsError,
  fundsFetching,
  fundsPending,
  fundsRefreshError,
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
  providerEventsRefreshError,
  reconciliation,
  reconciliationError,
  reconciliationFetching,
  reconciliationFilters,
  reconciliationPending,
  reconciliationRefreshError,
  refreshFundDirectory,
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
  statementsFetching,
  statementsPending,
  statementsRefreshError,
  summary,
  t,
  transactionDrawer,
  transactions,
  transactionsError,
  transactionsFetching,
  transactionsRefreshError,
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
    <AdminPageHeader :title="t('nav.giving')" :subtitle="t('giving.pageSubtitle')">
      <template #actions>
        <AdminRefreshButton
          :label="t('common.refresh')"
          :loading="isRefreshing"
          @refresh="refreshAll"
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-download"
          :disabled="!canExport"
          :loading="isExportingTransactions"
          @click="exportTransactions"
        >
          {{ t("Export CSV") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <GivingSummaryCards :summary="summary" :dollars="dollars" />

    <v-alert
      v-if="fundDirectoryError"
      class="mt-6"
      type="warning"
      variant="tonal"
    >
      <div
        class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
      >
        <span>
          {{ t("giving.fundDirectoryFailed") }}
          {{ formatApiErrorMessage(fundDirectoryError, t("common.error")) }}
        </span>
        <v-btn
          color="warning"
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          @click="refreshFundDirectory"
        >
          {{ t("Retry") }}
        </v-btn>
      </div>
    </v-alert>

    <GivingReconciliationCard
      :filters="reconciliationFilters"
      :fund-items="fundFilterItems"
      :reconciliation="reconciliation"
      :is-pending="reconciliationPending"
      :is-fetching="reconciliationFetching"
      :error="reconciliationError"
      :refresh-error="reconciliationRefreshError"
      :dollars="dollars"
      @apply="applyReconciliationFilters"
      @clear="clearReconciliationFilters"
      @retry="refreshReconciliation"
    />

    <v-row class="mt-6" dense>
      <v-col cols="12" lg="8">
        <GivingTransactionsCard
          :filters="filters"
          :fund-items="fundFilterItems"
          :transactions="transactions"
          :is-pending="transactionsPending"
          :is-fetching="transactionsFetching"
          :error="transactionsError"
          :refresh-error="transactionsRefreshError"
          :dollars="dollars"
          :date-time="dateTime"
          :fund-name="fundName"
          :status-color="statusColor"
          @apply="applyTransactionFilters"
          @clear="clearTransactionFilters"
          @open="openTransaction"
          @retry="refreshTransactions"
        />
      </v-col>

      <v-col cols="12" lg="4">
        <GivingFundsCard
          :filters="fundFilters"
          :funds="funds"
          :can-manage="canManageFunds"
          :is-pending="fundsPending"
          :is-fetching="fundsFetching"
          :error="fundsError"
          :refresh-error="fundsRefreshError"
          :dollars="dollars"
          :fund-progress="fundProgress"
          @apply="applyFundFilters"
          @clear="clearFundFilters"
          @create="newFund"
          @open="openFund"
          @retry="refreshFunds"
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
      :is-fetching="statementsFetching"
      :error="statementsError"
      :refresh-error="statementsRefreshError"
      :dollars="dollars"
      :status-color="statusColor"
      @apply="applyStatementFilters"
      @clear="clearStatementFilters"
      @retry="refreshStatements"
    />

    <v-alert
      v-if="downloadStatementError"
      class="mt-6"
      type="error"
      variant="tonal"
    >
      {{ formatApiErrorMessage(downloadStatementError, t("common.error")) }}
    </v-alert>

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
      :refresh-error="providerEventsRefreshError"
      :event-status-color="eventStatusColor"
      @apply="applyProviderEventFilters"
      @clear="clearProviderEventFilters"
      @open="openProviderEvent"
      @retry="refreshProviderEvents"
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
