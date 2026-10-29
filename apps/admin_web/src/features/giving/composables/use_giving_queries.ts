import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { reactive, ref, type Ref } from "vue";

import {
  getGivingReconciliation,
  listGivingFunds,
  listGivingStatements,
  listGivingTransactions,
  listPaymentProviderEvents
} from "@/core/api/giving";

import {
  createGivingFundFilters,
  createGivingProviderEventFilters,
  createGivingReconciliationFilters,
  createGivingStatementFilters,
  createGivingTransactionFilters,
  givingFilterSnapshot,
  resetGivingFilters,
  sameGivingFilters
} from "../giving_workspace_models";

type GivingQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useGivingQueries(
  queryClient: GivingQueryClient,
  currentYear: number
) {
  const filters = reactive(createGivingTransactionFilters(currentYear));
  const statementFilters = reactive(createGivingStatementFilters(currentYear));
  const providerEventFilters = reactive(createGivingProviderEventFilters());
  const fundFilters = reactive(createGivingFundFilters());
  const reconciliationFilters = reactive(
    createGivingReconciliationFilters(currentYear)
  );

  const appliedTransactionFilters = ref(givingFilterSnapshot(filters));
  const appliedStatementFilters = ref(givingFilterSnapshot(statementFilters));
  const appliedProviderEventFilters = ref(
    givingFilterSnapshot(providerEventFilters)
  );
  const appliedFundFilters = ref(givingFilterSnapshot(fundFilters));
  const appliedReconciliationFilters = ref(
    givingFilterSnapshot(reconciliationFilters)
  );

  const transactionsQuery = useQuery({
    queryKey: ["giving-transactions", appliedTransactionFilters],
    queryFn: ({ queryKey }) =>
      listGivingTransactions({
        ...(queryKey[1] as typeof appliedTransactionFilters.value),
        limit: 50
      })
  });
  const statementsQuery = useQuery({
    queryKey: ["giving-statements", appliedStatementFilters],
    queryFn: ({ queryKey }) =>
      listGivingStatements({
        ...(queryKey[1] as typeof appliedStatementFilters.value),
        limit: 50
      })
  });
  const providerEventsQuery = useQuery({
    queryKey: ["giving-provider-events", appliedProviderEventFilters],
    queryFn: ({ queryKey }) =>
      listPaymentProviderEvents({
        ...(queryKey[1] as typeof appliedProviderEventFilters.value),
        limit: 50
      })
  });
  const fundsQuery = useQuery({
    queryKey: ["giving-funds", appliedFundFilters],
    queryFn: ({ queryKey }) =>
      listGivingFunds({
        ...(queryKey[1] as typeof appliedFundFilters.value),
        limit: 50
      })
  });
  const fundDirectoryQuery = useQuery({
    queryKey: ["giving-fund-directory"],
    queryFn: () => listGivingFunds({ limit: 200 })
  });
  const reconciliationQuery = useQuery({
    queryKey: ["giving-reconciliation", appliedReconciliationFilters],
    queryFn: ({ queryKey }) =>
      getGivingReconciliation(
        queryKey[1] as typeof appliedReconciliationFilters.value
      )
  });

  const applyTransactionFilters = () =>
    applyFilters(
      appliedTransactionFilters,
      givingFilterSnapshot(filters),
      refreshTransactions
    );
  const applyStatementFilters = () =>
    applyFilters(
      appliedStatementFilters,
      givingFilterSnapshot(statementFilters),
      refreshStatements
    );
  const applyProviderEventFilters = () =>
    applyFilters(
      appliedProviderEventFilters,
      givingFilterSnapshot(providerEventFilters),
      refreshProviderEvents
    );
  const applyFundFilters = () =>
    applyFilters(
      appliedFundFilters,
      givingFilterSnapshot(fundFilters),
      refreshFunds
    );
  const applyReconciliationFilters = () =>
    applyFilters(
      appliedReconciliationFilters,
      givingFilterSnapshot(reconciliationFilters),
      refreshReconciliation
    );

  function clearTransactionFilters() {
    resetGivingFilters(filters, createGivingTransactionFilters(currentYear));
    return applyTransactionFilters();
  }
  function clearStatementFilters() {
    resetGivingFilters(
      statementFilters,
      createGivingStatementFilters(currentYear)
    );
    return applyStatementFilters();
  }
  function clearProviderEventFilters() {
    resetGivingFilters(
      providerEventFilters,
      createGivingProviderEventFilters()
    );
    return applyProviderEventFilters();
  }
  function clearFundFilters() {
    resetGivingFilters(fundFilters, createGivingFundFilters());
    return applyFundFilters();
  }
  function clearReconciliationFilters() {
    resetGivingFilters(
      reconciliationFilters,
      createGivingReconciliationFilters(currentYear)
    );
    return applyReconciliationFilters();
  }

  function refreshTransactions() {
    return invalidate("giving-transactions", appliedTransactionFilters.value);
  }
  function refreshStatements() {
    return invalidate("giving-statements", appliedStatementFilters.value);
  }
  function refreshProviderEvents() {
    return invalidate(
      "giving-provider-events",
      appliedProviderEventFilters.value
    );
  }
  function refreshFunds() {
    return invalidate("giving-funds", appliedFundFilters.value);
  }
  function refreshReconciliation() {
    return invalidate(
      "giving-reconciliation",
      appliedReconciliationFilters.value
    );
  }
  function refreshFundDirectory() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["giving-fund-directory"]
    });
  }
  function refreshAll() {
    return Promise.all([
      refreshTransactions(),
      refreshStatements(),
      refreshProviderEvents(),
      refreshFunds(),
      refreshReconciliation(),
      refreshFundDirectory()
    ]);
  }

  function invalidate(key: string, snapshot: object) {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: [key, snapshot]
    });
  }

  return {
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
  };
}

function applyFilters<T extends Record<string, unknown>>(
  applied: Ref<T>,
  snapshot: T,
  refresh: () => Promise<unknown>
) {
  if (sameGivingFilters(applied.value, snapshot)) {
    return refresh();
  }
  applied.value = snapshot;
}
