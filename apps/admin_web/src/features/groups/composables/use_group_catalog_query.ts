import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listGroups } from "@/core/api/groups";

import {
  createGroupCatalogFilterForm,
  groupCatalogFilterSnapshot,
  resetGroupCatalogFilterForm,
  sameGroupCatalogFilters,
  type GroupCatalogFilterSnapshot
} from "../group_workspace_models";

type GroupCatalogQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useGroupCatalogQuery(queryClient: GroupCatalogQueryClient) {
  const filters = reactive(createGroupCatalogFilterForm());
  const appliedFilters = ref(groupCatalogFilterSnapshot(filters));
  const groupsQuery = useQuery({
    queryKey: ["groups", appliedFilters],
    queryFn: ({ queryKey }) =>
      listGroups({
        ...(queryKey[1] as GroupCatalogFilterSnapshot),
        limit: 50
      })
  });

  const groups = computed(() => groupsQuery.data.value ?? []);
  const initialError = computed(() =>
    groupsQuery.data.value === undefined ? groupsQuery.error.value : null
  );
  const refreshError = computed(() =>
    groupsQuery.data.value !== undefined ? groupsQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = groupCatalogFilterSnapshot(filters);
    if (sameGroupCatalogFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetGroupCatalogFilterForm(filters);
    return applyFilters();
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["groups", appliedFilters.value]
    });
  }

  return {
    filters,
    groupsQuery,
    groups,
    initialError,
    refreshError,
    applyFilters,
    clearFilters,
    refreshList
  };
}
