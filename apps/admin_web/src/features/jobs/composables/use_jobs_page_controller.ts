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
  const { t } = useI18n();
  const selectedJob = ref<Job | null>(null);
  const drawer = ref(false);

  const filters = reactive({
    status: "" as JobStatus | "",
    type: "" as JobType | "",
    resourceType: "",
    resourceId: ""
  });
  const appliedFilters = ref<JobListFilters>({
    status: "",
    type: "",
    resourceType: "",
    resourceId: "",
    cursor: null,
    limit: 50
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

  const jobsQuery = useQuery({
    queryKey: ["admin-jobs", appliedFilters],
    queryFn: async () => {
      const requestFilters = { ...appliedFilters.value };
      const page = await listJobs(requestFilters);
      if (
        JSON.stringify(requestFilters) !== JSON.stringify(appliedFilters.value)
      ) {
        return page;
      }
      if (requestFilters.cursor) {
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
      refreshAll();
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
      refreshAll();
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
  const jobsErrorMessage = computed(() =>
    formatApiErrorMessage(jobsQuery.error.value, t("common.error"))
  );
  const statsErrorMessage = computed(() =>
    formatApiErrorMessage(statsQuery.error.value, t("common.error"))
  );
  const pipelineStatusErrorMessage = computed(() =>
    formatApiErrorMessage(pipelineStatusQuery.error.value, t("common.error"))
  );
  const isRefreshing = computed(
    () =>
      jobsQuery.isFetching.value ||
      statsQuery.isFetching.value ||
      pipelineStatusQuery.isFetching.value
  );

  function refreshJobs() {
    appliedFilters.value = { ...appliedFilters.value, cursor: null };
    void queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
  }

  function applyJobFilters() {
    loadedPages.value = [];
    appliedFilters.value = {
      status: filters.status,
      type: filters.type,
      resourceType: filters.resourceType,
      resourceId: filters.resourceId,
      cursor: null,
      limit: 50
    };
    void queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
  }

  function refreshStats() {
    void queryClient.invalidateQueries({ queryKey: ["admin-job-stats"] });
  }

  function refreshPipelineStatus() {
    void queryClient.invalidateQueries({
      queryKey: ["admin-sermon-pipeline-status"]
    });
  }

  function refreshAll() {
    refreshJobs();
    refreshStats();
    refreshPipelineStatus();
  }

  function loadMore() {
    if (nextCursor.value && !jobsQuery.isFetching.value) {
      appliedFilters.value = {
        ...appliedFilters.value,
        cursor: nextCursor.value
      };
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
    isRefreshing,
    jobStatuses,
    jobs,
    jobsErrorMessage,
    jobsQuery,
    jobTypes,
    markSucceededMutation,
    nextCursor,
    pipelineStatusErrorMessage,
    pipelineStatusQuery,
    selectedJob,
    selectedJobActionErrorMessage,
    statsErrorMessage,
    statsQuery,
    t,
    applyJobFilters,
    cancelSelectedJob,
    jobAgeLabel,
    loadMore,
    markSelectedJobSucceeded,
    openJob,
    pipelineStatusColor,
    refreshAll,
    refreshJobs,
    refreshPipelineStatus,
    refreshStats,
    statusColor
  };
}
