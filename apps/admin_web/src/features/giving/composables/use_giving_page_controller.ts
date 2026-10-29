import type {
  GivingStatementStatus,
  GivingTransaction,
  GivingTransactionStatus,
  PaymentProviderEvent,
  PaymentProviderEventStatus
} from "@mbc/api-contracts";
import { useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import {
  formatGivingCurrency,
  formatGivingDateTime,
  givingFundFilterItems as buildGivingFundFilterItems,
  givingFundName as resolveGivingFundName,
  givingFundProgress
} from "../giving_presenters";
import { useGivingCommands } from "./use_giving_commands";
import { useGivingQueries } from "./use_giving_queries";

export function useGivingPageController() {
  const queryClient = useQueryClient();
  const { locale, t } = useI18n();
  const currentYear = new Date().getFullYear();

  const selectedTransaction = ref<GivingTransaction | null>(null);
  const selectedProviderEvent = ref<PaymentProviderEvent | null>(null);
  const transactionDrawer = ref(false);
  const providerEventDrawer = ref(false);

  const {
    filters,
    statementFilters,
    providerEventFilters,
    fundFilters,
    reconciliationFilters,
    appliedTransactionFilters,
    transactionsQuery,
    statementsQuery,
    providerEventsQuery,
    fundsQuery,
    fundDirectoryQuery,
    reconciliationQuery,
    applyTransactionFilters,
    applyStatementFilters,
    applyProviderEventFilters,
    applyFundFilters,
    applyReconciliationFilters,
    clearTransactionFilters,
    clearStatementFilters,
    clearProviderEventFilters,
    clearFundFilters,
    clearReconciliationFilters,
    refreshTransactions,
    refreshStatements,
    refreshProviderEvents,
    refreshFunds,
    refreshReconciliation,
    refreshFundDirectory,
    refreshAll
  } = useGivingQueries(queryClient, currentYear);

  const commands = useGivingCommands({
    appliedTransactionFilters,
    applyStatementFilters,
    currentYear,
    queryClient,
    statementFilters
  });

  const transactions = computed(() => transactionsQuery.data.value?.items ?? []);
  const summary = computed(() => transactionsQuery.data.value?.summary);
  const statements = computed(() => statementsQuery.data.value ?? []);
  const providerEvents = computed(() => providerEventsQuery.data.value ?? []);
  const funds = computed(() => fundsQuery.data.value ?? []);
  const fundDirectory = computed(
    () => fundDirectoryQuery.data.value ?? fundsQuery.data.value ?? []
  );
  const fundDirectoryError = computed(() => fundDirectoryQuery.error.value);
  const fundFilterItems = computed(() =>
    buildGivingFundFilterItems(fundDirectory.value, t("All funds"))
  );
  const reconciliation = computed(() => reconciliationQuery.data.value);
  const isRefreshing = computed(
    () =>
      transactionsQuery.isFetching.value ||
      statementsQuery.isFetching.value ||
      reconciliationQuery.isFetching.value ||
      providerEventsQuery.isFetching.value ||
      fundsQuery.isFetching.value ||
      fundDirectoryQuery.isFetching.value
  );
  const transactionsPending = computed(() => transactionsQuery.isPending.value);
  const statementsPending = computed(() => statementsQuery.isPending.value);
  const providerEventsPending = computed(
    () => providerEventsQuery.isPending.value
  );
  const fundsPending = computed(() => fundsQuery.isPending.value);
  const reconciliationPending = computed(
    () => reconciliationQuery.isPending.value
  );
  const transactionsFetching = computed(
    () => transactionsQuery.isFetching.value
  );
  const statementsFetching = computed(() => statementsQuery.isFetching.value);
  const fundsFetching = computed(() => fundsQuery.isFetching.value);
  const providerEventsFetching = computed(
    () => providerEventsQuery.isFetching.value
  );
  const reconciliationFetching = computed(
    () => reconciliationQuery.isFetching.value
  );
  const transactionsError = initialError(
    transactionsQuery.error,
    () => transactionsQuery.data.value !== undefined
  );
  const transactionsRefreshError = backgroundError(
    transactionsQuery.error,
    () => transactionsQuery.data.value !== undefined
  );
  const statementsError = initialError(
    statementsQuery.error,
    () => statementsQuery.data.value !== undefined
  );
  const statementsRefreshError = backgroundError(
    statementsQuery.error,
    () => statementsQuery.data.value !== undefined
  );
  const providerEventsError = initialError(
    providerEventsQuery.error,
    () => providerEventsQuery.data.value !== undefined
  );
  const providerEventsRefreshError = backgroundError(
    providerEventsQuery.error,
    () => providerEventsQuery.data.value !== undefined
  );
  const fundsError = initialError(
    fundsQuery.error,
    () => fundsQuery.data.value !== undefined
  );
  const fundsRefreshError = backgroundError(
    fundsQuery.error,
    () => fundsQuery.data.value !== undefined
  );
  const reconciliationError = initialError(
    reconciliationQuery.error,
    () => reconciliation.value !== undefined
  );
  const reconciliationRefreshError = backgroundError(
    reconciliationQuery.error,
    () => reconciliation.value !== undefined
  );

  function dollars(amountCents: number | undefined) {
    return formatGivingCurrency(
      amountCents,
      summary.value?.currency ?? reconciliation.value?.currency ?? "USD",
      locale.value
    );
  }

  function dateTime(value: string | null | undefined) {
    return formatGivingDateTime(value, locale.value);
  }

  function fundName(fundId: string | null) {
    return resolveGivingFundName(
      fundDirectory.value,
      fundId,
      t("common.notSet")
    );
  }

  function statusColor(
    status: GivingTransactionStatus | GivingStatementStatus
  ) {
    if (status === "succeeded" || status === "ready" || status === "sent") {
      return "success";
    }
    if (status === "refunded") {
      return "info";
    }
    if (status === "pending") {
      return "warning";
    }
    return "error";
  }

  function eventStatusColor(status: PaymentProviderEventStatus) {
    if (status === "processed") {
      return "success";
    }
    if (status === "received") {
      return "info";
    }
    if (status === "ignored") {
      return "secondary";
    }
    return "error";
  }

  function openTransaction(transaction: GivingTransaction) {
    selectedTransaction.value = transaction;
    transactionDrawer.value = true;
  }

  function openProviderEvent(event: PaymentProviderEvent) {
    selectedProviderEvent.value = event;
    providerEventDrawer.value = true;
  }

  return {
    ...commands,
    applyFundFilters,
    applyProviderEventFilters,
    applyReconciliationFilters,
    applyStatementFilters,
    applyTransactionFilters,
    clearFundFilters,
    clearProviderEventFilters,
    clearReconciliationFilters,
    clearStatementFilters,
    clearTransactionFilters,
    dateTime,
    dollars,
    eventStatusColor,
    filters,
    fundFilterItems,
    fundDirectoryError,
    fundFilters,
    fundName,
    fundProgress: givingFundProgress,
    funds,
    fundsError,
    fundsFetching,
    fundsPending,
    fundsRefreshError,
    isRefreshing,
    openProviderEvent,
    openTransaction,
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
    refreshFunds,
    refreshFundDirectory,
    refreshAll,
    refreshProviderEvents,
    refreshReconciliation,
    refreshStatements,
    refreshTransactions,
    selectedProviderEvent,
    selectedTransaction,
    statementFilters,
    statements,
    statementsError,
    statementsFetching,
    statementsPending,
    statementsRefreshError,
    statusColor,
    summary,
    t,
    transactionDrawer,
    transactions,
    transactionsError,
    transactionsFetching,
    transactionsRefreshError,
    transactionsPending
  };
}

function initialError(
  error: { readonly value: unknown },
  hasData: () => boolean
) {
  return computed(() => (hasData() ? null : error.value));
}

function backgroundError(
  error: { readonly value: unknown },
  hasData: () => boolean
) {
  return computed(() => (hasData() ? error.value : null));
}
