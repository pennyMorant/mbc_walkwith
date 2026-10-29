import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listPrayerRequests } from "@/core/api/prayer_requests";

import {
  createPrayerListFilterForm,
  prayerListFilterSnapshot,
  resetPrayerListFilterForm,
  samePrayerListFilters,
  type PrayerListFilterSnapshot
} from "../prayer_workspace_models";

type PrayerListQueryClient = Pick<QueryClient, "invalidateQueries">;

export function usePrayerListQuery(queryClient: PrayerListQueryClient) {
  const filters = reactive(createPrayerListFilterForm());
  const appliedFilters = ref(prayerListFilterSnapshot(filters));
  const requestsQuery = useQuery({
    queryKey: ["prayer-requests", appliedFilters],
    queryFn: ({ queryKey }) =>
      listPrayerRequests({
        ...(queryKey[1] as PrayerListFilterSnapshot),
        limit: 50
      })
  });

  const requests = computed(() => requestsQuery.data.value ?? []);
  const initialError = computed(() =>
    requestsQuery.data.value === undefined ? requestsQuery.error.value : null
  );
  const refreshError = computed(() =>
    requestsQuery.data.value !== undefined ? requestsQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = prayerListFilterSnapshot(filters);
    if (samePrayerListFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetPrayerListFilterForm(filters);
    return applyFilters();
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["prayer-requests", appliedFilters.value]
    });
  }

  return {
    applyFilters,
    clearFilters,
    filters,
    initialError,
    refreshError,
    refreshList,
    requests,
    requestsQuery
  };
}
