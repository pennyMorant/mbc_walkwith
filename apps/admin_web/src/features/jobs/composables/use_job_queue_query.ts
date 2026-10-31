import type { JobStatus, JobType } from "@mbc/api-contracts";
import { useInfiniteQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listJobs, type JobListFilters } from "@/core/api/jobs";

type JobQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useJobQueueQuery(queryClient: JobQueryClient) {
  const filters = reactive({
    status: "" as JobStatus | "",
    type: "" as JobType | "",
    resourceType: "",
    resourceId: ""
  });
  const appliedFilters = ref<JobListFilters>(filterSnapshot(filters));

  const jobsQuery = useInfiniteQuery({
    queryKey: ["admin-jobs", appliedFilters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, queryKey }) => {
      const snapshot = queryKey[1] as JobListFilters;
      return listJobs({
        ...snapshot,
        cursor: pageParam,
        limit: 50
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });

  const jobs = computed(
    () => jobsQuery.data.value?.pages.flatMap((page) => page.items) ?? []
  );
  const nextCursor = computed(
    () => jobsQuery.data.value?.pages.at(-1)?.nextCursor ?? null
  );

  function applyJobFilters() {
    const nextFilters = filterSnapshot(filters);
    if (sameFilters(appliedFilters.value, nextFilters)) {
      refreshJobs();
      return;
    }
    appliedFilters.value = nextFilters;
  }

  function refreshJobs() {
    void queryClient.invalidateQueries({
      exact: true,
      queryKey: ["admin-jobs", appliedFilters.value]
    });
  }

  function loadMore() {
    if (jobsQuery.hasNextPage.value && !jobsQuery.isFetchingNextPage.value) {
      void jobsQuery.fetchNextPage();
    }
  }

  return {
    filters,
    jobs,
    jobsQuery,
    nextCursor,
    applyJobFilters,
    loadMore,
    refreshJobs
  };
}

function filterSnapshot(filters: {
  status: JobStatus | "";
  type: JobType | "";
  resourceType: string;
  resourceId: string;
}): JobListFilters {
  return {
    status: filters.status,
    type: filters.type,
    resourceType: filters.resourceType,
    resourceId: filters.resourceId,
    cursor: null,
    limit: 50
  };
}

function sameFilters(left: JobListFilters, right: JobListFilters) {
  return (
    left.status === right.status &&
    left.type === right.type &&
    left.resourceType === right.resourceType &&
    left.resourceId === right.resourceId
  );
}
