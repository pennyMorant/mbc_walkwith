import { useInfiniteQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listAuditLogs } from "@/core/api/audit_logs";

import {
  auditLogFilterSnapshot,
  createAuditLogFilterForm,
  resetAuditLogFilterForm,
  sameAuditLogFilters,
  type AuditLogFilterSnapshot
} from "../audit_log_workspace_models";

type AuditQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useAuditLogQuery(queryClient: AuditQueryClient) {
  const filters = reactive(createAuditLogFilterForm());
  const appliedFilters = ref(auditLogFilterSnapshot(filters));

  const logsQuery = useInfiniteQuery({
    queryKey: ["audit-logs", appliedFilters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, queryKey }) => {
      const snapshot = queryKey[1] as AuditLogFilterSnapshot;
      return listAuditLogs({
        ...snapshot,
        cursor: pageParam,
        limit: 50
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });

  const logs = computed(
    () => logsQuery.data.value?.pages.flatMap((page) => page.items) ?? []
  );

  function applyFilters() {
    const snapshot = auditLogFilterSnapshot(filters);
    if (sameAuditLogFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetAuditLogFilterForm(filters);
    return applyFilters();
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["audit-logs", appliedFilters.value]
    });
  }

  function loadMore() {
    if (
      logsQuery.hasNextPage.value &&
      !logsQuery.isFetchingNextPage.value
    ) {
      return logsQuery.fetchNextPage();
    }
  }

  return {
    filters,
    logsQuery,
    logs,
    applyFilters,
    clearFilters,
    refreshList,
    loadMore
  };
}
