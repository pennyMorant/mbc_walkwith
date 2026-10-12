import type {
  GivingExportResponse,
  GivingFund,
  GivingFundStatus,
  GivingReconciliationStatus,
  GivingStatement,
  GivingStatementStatus,
  GivingTransaction,
  GivingTransactionStatus,
  PaymentProviderEvent,
  PaymentProviderEventStatus
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import {
  createGivingFund,
  downloadGivingStatement,
  exportGivingTransactions,
  generateGivingStatement,
  getGivingReconciliation,
  listGivingFunds,
  listGivingStatements,
  listGivingTransactions,
  listPaymentProviderEvents,
  updateGivingFund
} from "@/core/api/giving";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { downloadTextFile } from "@/core/files/download_text_file";
import { useI18n } from "@/core/i18n/i18n";
import {
  formatGivingCurrency,
  formatGivingDateTime,
  givingFundFilterItems as buildGivingFundFilterItems,
  givingFundName as resolveGivingFundName,
  givingFundProgress
} from "../giving_presenters";
import {
  createGivingFundForm,
  fillGivingFundForm,
  givingFundCreatePayload,
  givingFundUpdatePayload,
  isGivingFundCodeValid,
  isGivingFundFormValid,
  resetGivingFundForm
} from "../giving_workspace_models";

export function useGivingPageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { locale, optionItems, t } = useI18n();
  const currentYear = new Date().getFullYear();

  const selectedTransaction = ref<GivingTransaction | null>(null);
  const selectedFund = ref<GivingFund | null>(null);
  const selectedProviderEvent = ref<PaymentProviderEvent | null>(null);
  const fundDrawer = ref(false);
  const transactionDrawer = ref(false);
  const providerEventDrawer = ref(false);
  const exportedCsv = ref("");
  const exportedFilename = ref("");

  const filters = reactive({
    year: currentYear,
    status: "" as GivingTransactionStatus | "",
    category: "",
    fundId: "",
    query: ""
  });

  const statementFilters = reactive({
    year: currentYear,
    status: "" as GivingStatementStatus | "",
    query: ""
  });

  const providerEventFilters = reactive({
    provider: "stripe",
    status: "" as PaymentProviderEventStatus | "",
    query: ""
  });

  const fundFilters = reactive({
    status: "" as GivingFundStatus | "",
    query: ""
  });

  const reconciliationFilters = reactive({
    year: currentYear,
    provider: "stripe",
    status: "" as GivingReconciliationStatus | "",
    fundId: ""
  });

  const statementForm = reactive({
    year: currentYear,
    userId: "",
    donorName: "",
    donorEmail: ""
  });

  const fundForm = reactive(createGivingFundForm());

  const transactionsQuery = useQuery({
    queryKey: computed(() => ["giving-transactions", { ...filters, limit: 50 }]),
    queryFn: () => listGivingTransactions({ ...filters, limit: 50 })
  });

  const statementsQuery = useQuery({
    queryKey: computed(() => ["giving-statements", { ...statementFilters }]),
    queryFn: () => listGivingStatements({ ...statementFilters, limit: 50 })
  });

  const providerEventsQuery = useQuery({
    queryKey: computed(() => [
      "giving-provider-events",
      { ...providerEventFilters }
    ]),
    queryFn: () =>
      listPaymentProviderEvents({ ...providerEventFilters, limit: 50 })
  });

  const fundsQuery = useQuery({
    queryKey: computed(() => ["giving-funds", { ...fundFilters }]),
    queryFn: () => listGivingFunds({ ...fundFilters, limit: 50 })
  });

  const fundDirectoryQuery = useQuery({
    queryKey: ["giving-fund-directory"],
    queryFn: () => listGivingFunds({ limit: 200 })
  });

  const reconciliationQuery = useQuery({
    queryKey: computed(() => [
      "giving-reconciliation",
      { ...reconciliationFilters }
    ]),
    queryFn: () => getGivingReconciliation(reconciliationFilters)
  });

  const generateStatementMutation = useMutation({
    mutationFn: () => {
      requireCanExport();
      if (!canGenerateStatement.value) {
        throw new Error(t("Statement year is invalid."));
      }
      return generateGivingStatement(
        statementForm.year,
        buildStatementGeneratePayload()
      );
    },
    onSuccess: async (statement) => {
      statementFilters.year = statement.taxYear;
      await queryClient.invalidateQueries({ queryKey: ["giving-statements"] });
    }
  });

  const exportTransactionsMutation = useMutation({
    mutationFn: () => {
      requireCanExport();
      return exportGivingTransactions({ ...filters, limit: 200 });
    },
    onSuccess: applyExportResult
  });

  const downloadStatementMutation = useMutation({
    mutationFn: (statement: GivingStatement) => {
      requireCanExport();
      if (!canDownloadStatement(statement)) {
        throw new Error(t("Statement is not ready for download."));
      }
      return downloadGivingStatement(statement.id);
    },
    onSuccess: applyExportResult
  });

  const saveFundMutation = useMutation({
    mutationFn: () => {
      requireCanManageFunds();
      if (!canSaveFund.value) {
        throw new Error(t("Fund code and name are required."));
      }
      return selectedFund.value
        ? updateGivingFund(
            selectedFund.value.id,
            givingFundUpdatePayload(fundForm)
          )
        : createGivingFund(givingFundCreatePayload(fundForm));
    },
    onSuccess: async (fund) => {
      selectedFund.value = fund;
      fillFundForm(fund);
      await queryClient.invalidateQueries({ queryKey: ["giving-funds"] });
      await queryClient.invalidateQueries({ queryKey: ["giving-fund-directory"] });
      await queryClient.invalidateQueries({ queryKey: ["giving-transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["giving-reconciliation"] });
    }
  });

  const transactions = computed(() => transactionsQuery.data.value?.items ?? []);
  const summary = computed(() => transactionsQuery.data.value?.summary);
  const statements = computed(() => statementsQuery.data.value ?? []);
  const providerEvents = computed(() => providerEventsQuery.data.value ?? []);
  const funds = computed(() => fundsQuery.data.value ?? []);
  const fundDirectory = computed(
    () => fundDirectoryQuery.data.value ?? fundsQuery.data.value ?? []
  );
  const fundFilterItems = computed(() =>
    buildGivingFundFilterItems(fundDirectory.value, t("All funds"))
  );
  const reconciliation = computed(() => reconciliationQuery.data.value);
  const canExport = computed(() => authStore.can("giving:export"));
  const canManageFunds = computed(() => authStore.can("giving:manage"));
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
  const providerEventsFetching = computed(
    () => providerEventsQuery.isFetching.value
  );
  const reconciliationFetching = computed(
    () => reconciliationQuery.isFetching.value
  );
  const isExportingTransactions = computed(
    () => exportTransactionsMutation.isPending.value
  );
  const isGeneratingStatement = computed(
    () => generateStatementMutation.isPending.value
  );
  const isDownloadingStatement = computed(
    () => downloadStatementMutation.isPending.value
  );
  const isSavingFund = computed(() => saveFundMutation.isPending.value);
  const canGenerateStatement = computed(
    () =>
      canExport.value &&
      !isGeneratingStatement.value &&
      isValidYear(statementForm.year)
  );
  const fundCodeValid = computed(() => isGivingFundCodeValid(fundForm.code));
  const canSaveFund = computed(
    () =>
      canManageFunds.value &&
      !isSavingFund.value &&
      isGivingFundFormValid(fundForm)
  );

  function refreshAll() {
    refreshTransactions();
    refreshStatements();
    refreshReconciliation();
    refreshProviderEvents();
    refreshFunds();
    void fundDirectoryQuery.refetch();
  }

  function refreshTransactions() {
    void transactionsQuery.refetch();
  }

  function refreshStatements() {
    void statementsQuery.refetch();
  }

  function refreshProviderEvents() {
    void providerEventsQuery.refetch();
  }

  function refreshFunds() {
    void fundsQuery.refetch();
  }

  function refreshReconciliation() {
    void reconciliationQuery.refetch();
  }

  function exportTransactions() {
    if (canExport.value && !isExportingTransactions.value) {
      exportTransactionsMutation.mutate();
    }
  }

  function generateStatement() {
    if (canGenerateStatement.value) {
      generateStatementMutation.mutate();
    }
  }

  function downloadStatement(statement: GivingStatement) {
    if (!isDownloadingStatement.value && canDownloadStatement(statement)) {
      downloadStatementMutation.mutate(statement);
    }
  }

  function canDownloadStatement(statement: GivingStatement) {
    return canExport.value && ["ready", "sent"].includes(statement.status);
  }

  function newFund() {
    saveFundMutation.reset();
    selectedFund.value = null;
    resetFundForm();
    fundDrawer.value = true;
  }

  function openFund(fund: GivingFund) {
    saveFundMutation.reset();
    selectedFund.value = fund;
    fillFundForm(fund);
    fundDrawer.value = true;
  }

  function saveFund() {
    if (canSaveFund.value) {
      saveFundMutation.mutate();
    }
  }

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

  function requireCanExport() {
    if (!canExport.value) {
      throw new Error(t("You do not have permission to export giving data."));
    }
  }

  function requireCanManageFunds() {
    if (!canManageFunds.value) {
      throw new Error(t("You do not have permission to manage giving funds."));
    }
  }

  function buildStatementGeneratePayload() {
    return {
      userId: statementForm.userId.trim() || null,
      donorName: statementForm.donorName.trim() || undefined,
      donorEmail: statementForm.donorEmail.trim() || null
    };
  }

  function resetFundForm() {
    resetGivingFundForm(fundForm);
  }

  function fillFundForm(fund: GivingFund) {
    fillGivingFundForm(fundForm, fund);
  }

  function applyExportResult(result: GivingExportResponse) {
    exportedCsv.value = result.csv;
    exportedFilename.value = result.filename;
    downloadTextFile({
      content: result.csv,
      filename: result.filename,
      contentType: result.contentType
    });
  }

  function isValidYear(value: number) {
    return Number.isInteger(value) && value >= 2000 && value <= 2100;
  }

  return {
    canDownloadStatement,
    canExport,
    canGenerateStatement,
    canManageFunds,
    canSaveFund,
    dateTime,
    dollars,
    downloadStatement,
    downloadStatementError: downloadStatementMutation.error,
    eventStatusColor,
    exportedCsv,
    exportedFilename,
    exportTransactions,
    exportTransactionsError: exportTransactionsMutation.error,
    filters,
    fundDrawer,
    fundCodeValid,
    fundFilterItems,
    fundFilters,
    fundForm,
    fundName,
    fundProgress: givingFundProgress,
    fundSaveError: saveFundMutation.error,
    funds,
    fundsError: fundsQuery.error,
    fundsPending,
    generateStatement,
    generateStatementError: generateStatementMutation.error,
    isDownloadingStatement,
    isExportingTransactions,
    isGeneratingStatement,
    isRefreshing,
    isSavingFund,
    newFund,
    openFund,
    openProviderEvent,
    openTransaction,
    optionItems,
    providerEventDrawer,
    providerEventFilters,
    providerEvents,
    providerEventsError: providerEventsQuery.error,
    providerEventsFetching,
    providerEventsPending,
    reconciliation,
    reconciliationError: reconciliationQuery.error,
    reconciliationFetching,
    reconciliationFilters,
    reconciliationPending,
    refreshAll,
    refreshFunds,
    refreshProviderEvents,
    refreshReconciliation,
    refreshStatements,
    refreshTransactions,
    saveFund,
    selectedFund,
    selectedProviderEvent,
    selectedTransaction,
    statementFilters,
    statementForm,
    statements,
    statementsError: statementsQuery.error,
    statementsPending,
    statusColor,
    summary,
    t,
    transactionDrawer,
    transactions,
    transactionsError: transactionsQuery.error,
    transactionsPending
  };
}
