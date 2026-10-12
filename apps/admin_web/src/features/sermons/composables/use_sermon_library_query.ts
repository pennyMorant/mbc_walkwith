import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import {
  getSermonDiscoveryFacets,
  listAdminSermons
} from "@/core/api/sermons";
import {
  createSermonLibraryFilterForm,
  sameSermonLibraryFilters,
  sermonLibraryFilterSnapshot,
  type SermonLibraryFilterSnapshot
} from "../sermon_library_models";

type QueryClientLike = {
  invalidateQueries(input: { exact?: boolean; queryKey: unknown[] }): unknown;
};

export function useSermonLibraryQuery(queryClient: QueryClientLike) {
  const filters = reactive(createSermonLibraryFilterForm());
  const appliedFilters = ref(sermonLibraryFilterSnapshot(filters));

  const sermonsQuery = useInfiniteQuery({
    queryKey: ["admin-sermons", appliedFilters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, queryKey }) => {
      const filterSnapshot = queryKey[1] as SermonLibraryFilterSnapshot;
      return listAdminSermons({
        ...filterSnapshot,
        cursor: pageParam,
        limit: 20
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });

  const facetsQuery = useQuery({
    queryKey: ["sermon-discovery-facets"],
    queryFn: getSermonDiscoveryFacets,
    staleTime: 5 * 60 * 1000
  });

  const topicOptions = computed(() => facetsQuery.data.value?.topics ?? []);

  const sermons = computed(
    () => sermonsQuery.data.value?.pages.flatMap((page) => page.items) ?? []
  );
  const nextCursor = computed(
    () => sermonsQuery.data.value?.pages.at(-1)?.nextCursor ?? null
  );

  function resetList() {
    const nextFilters = sermonLibraryFilterSnapshot(filters);
    if (sameSermonLibraryFilters(appliedFilters.value, nextFilters)) {
      refreshList();
      return;
    }
    appliedFilters.value = nextFilters;
  }

  function refreshList() {
    void queryClient.invalidateQueries({
      exact: true,
      queryKey: ["admin-sermons", appliedFilters.value]
    });
  }

  function loadMore() {
    if (
      sermonsQuery.hasNextPage.value &&
      !sermonsQuery.isFetchingNextPage.value
    ) {
      void sermonsQuery.fetchNextPage();
    }
  }

  return {
    filters,
    sermonsQuery,
    facetsQuery,
    topicOptions,
    sermons,
    nextCursor,
    resetList,
    refreshList,
    loadMore
  };
}
