import type { Job, JobStatus, JobType } from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { requireSelected } from "@/core/actions/action_guard";
import {
  cancelJob,
  getJobStats,
  getSermonProductionPipelineStatus,
  listJobs,
  updateJobStatus,
  type JobListFilters
} from "@/core/api/jobs";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

export function useJobsPageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedJob = ref<Job | null>(null);
  const drawer = ref(false);

  const filters = reactive({
    status: "" as JobStatus | "",
    type: "" as JobType | "",
    resourceType: "",
    resourceId: "",
    cursor: null as string | null
  });
  const loadedPages = ref<Array<{ items: Job[]; nextCursor: string | null }>>([]);

  const jobTypes: JobType[] = [
    "transcript_import",
    "outline_generation",
    "scripture_extraction"
  ];
  const jobStatuses: Array<JobStatus | ""> = [
    "",
    "queued",
    "running",
    "succeeded",
    "failed",
    "canceled"
  ];

  const activeFilters = computed<JobListFilters>(() => ({
    status: filters.status,
    type: filters.type,
    resourceType: filters.resourceType,
    resourceId: filters.resourceId,
    cursor: filters.cursor,
    limit: 50
  }));

  const jobsQuery = useQuery({
    queryKey: ["admin-jobs", activeFilters],
    queryFn: async () => {
      const page = await listJobs(activeFilters.value);
      if (filters.cursor) {
        loadedPages.value.push(page);
      } else {
        loadedPages.value = [page];
      }
      return page;
    }
  });

  const statsQuery = useQuery({
    queryKey: ["admin-job-stats"],
    queryFn: getJobStats
  });

  const pipelineStatusQuery = useQuery({
    queryKey: ["admin-sermon-pipeline-status"],
    queryFn: getSermonProductionPipelineStatus
  });

  const cancelMutation = useMutation({
    mutationFn: () => {
      const job = requireSelected(selectedJob.value, t("No job selected."));
      if (!canCancelSelected.value) {
        throw new Error(t("Job cannot be cancelled"));
      }
      return cancelJob(job.id);
    },
    onSuccess: async (job) => {
      openJob(job);
      resetList();
    }
  });

  const markSucceededMutation = useMutation({
    mutationFn: () => {
      const job = requireSelected(selectedJob.value, t("No job selected."));
      if (!canMarkSucceeded.value) {
        throw new Error(t("Job cannot be marked succeeded"));
      }
      return updateJobStatus(job.id, {
        status: "succeeded",
        result: job.result ?? {}
      });
    },
    onSuccess: async (job) => {
      openJob(job);
      resetList();
    }
  });

  const jobs = computed(() => loadedPages.value.flatMap((page) => page.items));
  const canManage = computed(() => authStore.can("jobs:manage"));
  const canCancelSelected = computed(
    () =>
      canManage.value &&
      Boolean(
        selectedJob.value &&
          ["queued", "running"].includes(selectedJob.value.status)
      )
  );
  const canMarkSucceeded = computed(
    () =>
      canManage.value &&
      Boolean(selectedJob.value && selectedJob.value.status === "failed")
  );
  const nextCursor = computed(
    () => loadedPages.value[loadedPages.value.length - 1]?.nextCursor ?? null
  );
  const selectedJobActionErrorMessage = computed(() =>
    formatApiErrorMessage(
      cancelMutation.error.value || markSucceededMutation.error.value,
      t("common.error")
    )
  );

  function resetList() {
    filters.cursor = null;
    void queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-job-stats"] });
    void queryClient.invalidateQueries({
      queryKey: ["admin-sermon-pipeline-status"]
    });
  }

  function loadMore() {
    if (nextCursor.value && !jobsQuery.isFetching.value) {
      filters.cursor = nextCursor.value;
    }
  }

  function openJob(job: Job) {
    selectedJob.value = job;
    drawer.value = true;
  }

  function statusColor(status: JobStatus) {
    return {
      queued: "info",
      running: "warning",
      succeeded: "success",
      failed: "error",
      canceled: "secondary"
    }[status];
  }

  function statusCount(status: JobStatus) {
    return statsQuery.data.value?.byStatus[status] ?? 0;
  }

  function jobAgeLabel(job: Job) {
    if (job.status === "running") {
      return `${t("jobs.started")} ${job.startedAt || "-"}`;
    }
    if (job.status === "failed") {
      return `${t("jobs.batchResult.failed")} ${job.finishedAt || job.updatedAt}`;
    }
    return `${t("jobs.finished")} ${job.finishedAt || job.updatedAt}`;
  }

  function pipelineStatusColor(status: "ready" | "warning" | "blocked") {
    return {
      ready: "success",
      warning: "warning",
      blocked: "error"
    }[status];
  }

  function cancelSelectedJob() {
    if (!canCancelSelected.value || cancelMutation.isPending.value) {
      return;
    }
    cancelMutation.mutate();
  }

  function markSelectedJobSucceeded() {
    if (!canMarkSucceeded.value || markSucceededMutation.isPending.value) {
      return;
    }
    markSucceededMutation.mutate();
  }

  return {
    authStore,
    canCancelSelected,
    canManage,
    canMarkSucceeded,
    cancelMutation,
    drawer,
    filters,
    jobStatuses,
    jobs,
    jobsQuery,
    jobTypes,
    markSucceededMutation,
    nextCursor,
    optionItems,
    pipelineStatusQuery,
    selectedJob,
    selectedJobActionErrorMessage,
    statsQuery,
    t,
    cancelSelectedJob,
    jobAgeLabel,
    loadMore,
    markSelectedJobSucceeded,
    openJob,
    pipelineStatusColor,
    resetList,
    statusColor,
    statusCount
  };
}
