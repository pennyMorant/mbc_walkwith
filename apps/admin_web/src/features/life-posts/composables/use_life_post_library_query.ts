import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listLifePosts } from "@/core/api/life_posts";

import {
  createLifePostLibraryFilterForm,
  lifePostLibraryFilterSnapshot,
  resetLifePostLibraryFilterForm,
  sameLifePostLibraryFilters,
  type LifePostLibraryFilterSnapshot
} from "../life_post_library_models";

type LifePostLibraryQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useLifePostLibraryQuery(
  queryClient: LifePostLibraryQueryClient
) {
  const filters = reactive(createLifePostLibraryFilterForm());
  const appliedFilters = ref(lifePostLibraryFilterSnapshot(filters));

  const postsQuery = useQuery({
    queryKey: ["life-posts", appliedFilters],
    queryFn: ({ queryKey }) =>
      listLifePosts({
        ...(queryKey[1] as LifePostLibraryFilterSnapshot),
        limit: 50
      })
  });

  const posts = computed(() => postsQuery.data.value ?? []);
  const initialError = computed(() =>
    postsQuery.data.value === undefined ? postsQuery.error.value : null
  );
  const refreshError = computed(() =>
    postsQuery.data.value !== undefined ? postsQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = lifePostLibraryFilterSnapshot(filters);
    if (sameLifePostLibraryFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetLifePostLibraryFilterForm(filters);
    return applyFilters();
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["life-posts", appliedFilters.value]
    });
  }

  return {
    filters,
    appliedFilters,
    postsQuery,
    posts,
    initialError,
    refreshError,
    applyFilters,
    clearFilters,
    refreshList
  };
}
