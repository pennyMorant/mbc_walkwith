import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listSettings } from "@/core/api/settings";

import {
  createSettingsFilterForm,
  resetSettingsFilterForm,
  sameSettingsFilters,
  settingsFilterSnapshot
} from "../settings_workspace_models";

type SettingsQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useSettingsQuery(queryClient: SettingsQueryClient) {
  const filters = reactive(createSettingsFilterForm());
  const appliedFilters = ref(settingsFilterSnapshot(filters));

  const settingsQuery = useQuery({
    queryKey: ["settings", appliedFilters],
    queryFn: ({ queryKey }) =>
      listSettings({
        ...(queryKey[1] as ReturnType<typeof settingsFilterSnapshot>),
        limit: 100
      })
  });

  const settings = computed(() => settingsQuery.data.value ?? []);

  function applyFilters() {
    const snapshot = settingsFilterSnapshot(filters);
    if (sameSettingsFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetSettingsFilterForm(filters);
    return applyFilters();
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["settings", appliedFilters.value]
    });
  }

  return {
    filters,
    settingsQuery,
    settings,
    applyFilters,
    clearFilters,
    refreshList
  };
}
