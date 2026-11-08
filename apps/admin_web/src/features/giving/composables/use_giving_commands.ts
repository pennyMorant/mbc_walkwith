import type {
  GivingExportResponse,
  GivingFund,
  GivingStatementView
} from "@mbc/api-contracts";
import { useMutation, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, type Ref } from "vue";

import {
  createGivingFund,
  downloadGivingStatement,
  exportGivingTransactions,
  generateGivingStatement,
  updateGivingFund
} from "@/core/api/giving";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { downloadTextFile } from "@/core/files/download_text_file";
import { useI18n } from "@/core/i18n/i18n";
import {
  createGivingFundForm,
  fillGivingFundForm,
  givingFundCreatePayload,
  givingFundUpdatePayload,
  isGivingFundCodeValid,
  isGivingFundFormValid,
  resetGivingFundForm,
  type GivingStatementFilterForm,
  type GivingTransactionFilterForm
} from "../giving_workspace_models";

interface GivingCommandOptions {
  appliedTransactionFilters: Readonly<
    Ref<Readonly<GivingTransactionFilterForm>>
  >;
  applyStatementFilters: () => void | Promise<unknown>;
  currentYear: number;
  queryClient: QueryClient;
  statementFilters: GivingStatementFilterForm;
}

export function useGivingCommands(options: GivingCommandOptions) {
  const authStore = useAdminAuthStore();
  const { t } = useI18n();
  const selectedFund = ref<GivingFund | null>(null);
  const fundDrawer = ref(false);
  const exportedCsv = ref("");
  const exportedFilename = ref("");
  const statementForm = reactive({
    year: options.currentYear,
    userId: "",
    donorName: "",
    donorEmail: ""
  });
  const fundForm = reactive(createGivingFundForm());

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
      options.statementFilters.year = statement.taxYear;
      await options.applyStatementFilters();
    }
  });

  const exportTransactionsMutation = useMutation({
    mutationFn: () => {
      requireCanExport();
      return exportGivingTransactions({
        ...options.appliedTransactionFilters.value,
        limit: 200
      });
    },
    onSuccess: applyExportResult
  });

  const downloadStatementMutation = useMutation({
    mutationFn: (statement: GivingStatementView) => {
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
      fillGivingFundForm(fundForm, fund);
      await options.queryClient.invalidateQueries({
        queryKey: ["giving-funds"]
      });
      await options.queryClient.invalidateQueries({
        queryKey: ["giving-fund-directory"]
      });
      await options.queryClient.invalidateQueries({
        queryKey: ["giving-transactions"]
      });
      await options.queryClient.invalidateQueries({
        queryKey: ["giving-reconciliation"]
      });
    }
  });

  const canExport = computed(() => authStore.can("giving:export"));
  const canManageFunds = computed(() => authStore.can("giving:manage"));
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

  function downloadStatement(statement: GivingStatementView) {
    if (!isDownloadingStatement.value && canDownloadStatement(statement)) {
      downloadStatementMutation.mutate(statement);
    }
  }

  function canDownloadStatement(statement: GivingStatementView) {
    return canExport.value && statement.downloadAvailable;
  }

  function newFund() {
    saveFundMutation.reset();
    selectedFund.value = null;
    resetGivingFundForm(fundForm);
    fundDrawer.value = true;
  }

  function openFund(fund: GivingFund) {
    saveFundMutation.reset();
    selectedFund.value = fund;
    fillGivingFundForm(fundForm, fund);
    fundDrawer.value = true;
  }

  function saveFund() {
    if (canSaveFund.value) {
      saveFundMutation.mutate();
    }
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

  function applyExportResult(result: GivingExportResponse) {
    exportedCsv.value = result.csv;
    exportedFilename.value = result.filename;
    downloadTextFile({
      content: result.csv,
      filename: result.filename,
      contentType: result.contentType
    });
  }

  return {
    canDownloadStatement,
    canExport,
    canGenerateStatement,
    canManageFunds,
    canSaveFund,
    downloadStatement,
    downloadStatementError: downloadStatementMutation.error,
    exportedCsv,
    exportedFilename,
    exportTransactions,
    exportTransactionsError: exportTransactionsMutation.error,
    fundCodeValid,
    fundDrawer,
    fundForm,
    fundSaveError: saveFundMutation.error,
    generateStatement,
    generateStatementError: generateStatementMutation.error,
    isDownloadingStatement,
    isExportingTransactions,
    isGeneratingStatement,
    isSavingFund,
    newFund,
    openFund,
    saveFund,
    selectedFund,
    statementForm
  };
}

function isValidYear(value: number) {
  return Number.isInteger(value) && value >= 2000 && value <= 2100;
}
