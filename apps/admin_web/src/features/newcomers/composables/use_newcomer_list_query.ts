import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listNewcomers } from "@/core/api/newcomers";

import {
  createNewcomerListFilterForm,
  newcomerListFilterSnapshot,
  resetNewcomerListFilterForm,
  sameNewcomerListFilters,
  type NewcomerListFilterSnapshot
} from "../newcomer_workspace_models";

type NewcomerListQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useNewcomerListQuery(queryClient: NewcomerListQueryClient) {
  const filters = reactive(createNewcomerListFilterForm());
  const appliedFilters = ref(newcomerListFilterSnapshot(filters));
  const newcomersQuery = useQuery({
    queryKey: ["newcomers", appliedFilters],
    queryFn: ({ queryKey }) =>
      listNewcomers({
        ...(queryKey[1] as NewcomerListFilterSnapshot),
        limit: 100
      })
  });

  const newcomers = computed(() => newcomersQuery.data.value ?? []);
  const initialError = computed(() =>
    newcomersQuery.data.value === undefined ? newcomersQuery.error.value : null
  );
  const refreshError = computed(() =>
    newcomersQuery.data.value !== undefined ? newcomersQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = newcomerListFilterSnapshot(filters);
    if (sameNewcomerListFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetNewcomerListFilterForm(filters);
    return applyFilters();
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["newcomers", appliedFilters.value]
    });
  }

  return {
    filters,
    newcomers,
    newcomersQuery,
    initialError,
    refreshError,
    applyFilters,
    clearFilters,
    refreshList
  };
}
