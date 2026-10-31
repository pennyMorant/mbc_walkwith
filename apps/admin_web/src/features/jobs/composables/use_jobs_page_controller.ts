import type { Job, JobStatus, JobType } from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { requireSelected } from "@/core/actions/action_guard";
import {
  cancelJob,
  getJobStats,
  getSermonProductionPipelineStatus,
  updateJobStatus
} from "@/core/api/jobs";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";

import { useJobQueueQuery } from "./use_job_queue_query";

export function useJobsPageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { locale, t } = useI18n();
  const selectedJob = ref<Job | null>(null);
  const drawer = ref(false);

  const {
    filters,
    jobs,
    jobsQuery,
    nextCursor,
    applyJobFilters,
    loadMore,
    refreshJobs
  } = useJobQueueQuery(queryClient);

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

  const statsQuery = useQuery({
    queryKey: ["admin-job-stats"],
    queryFn: getJobStats
  });

  const pipelineStatusQuery = useQuery({
    queryKey: ["admin-sermon-pipeline-status"],
    queryFn: getSermonProductionPipelineStatus
  });

  const cancelMutation = useMutation({
    mutationFn: (intent: { jobId: string }) => cancelJob(intent.jobId),
    onSuccess: (job, intent) => {
      applyCommandResult(intent.jobId, job);
      refreshAll();
    }
  });

  const markSucceededMutation = useMutation({
    mutationFn: (intent: {
      jobId: string;
      result: Record<string, unknown>;
    }) =>
      updateJobStatus(intent.jobId, {
        status: "succeeded",
        result: intent.result
      }),
    onSuccess: (job, intent) => {
      applyCommandResult(intent.jobId, job);
      refreshAll();
    }
  });

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
  const isCancelPending = computed(
    () =>
      cancelMutation.isPending.value &&
      cancelMutation.variables.value?.jobId === selectedJob.value?.id
  );
  const isMarkSucceededPending = computed(
    () =>
      markSucceededMutation.isPending.value &&
      markSucceededMutation.variables.value?.jobId === selectedJob.value?.id
  );
  const isJobCommandPending = computed(
    () =>
      cancelMutation.isPending.value || markSucceededMutation.isPending.value
  );
  const selectedCommandError = computed(() => {
    const selectedId = selectedJob.value?.id;
    if (
      selectedId &&
      cancelMutation.variables.value?.jobId === selectedId
    ) {
      return cancelMutation.error.value;
    }
    if (
      selectedId &&
      markSucceededMutation.variables.value?.jobId === selectedId
    ) {
      return markSucceededMutation.error.value;
    }
    return null;
  });
  const selectedJobActionErrorMessage = computed(() =>
    formatApiErrorMessage(selectedCommandError.value, t("common.error"))
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
    const startedAt = formatJobDateTime(job.startedAt);
    const finishedAt = formatJobDateTime(job.finishedAt || job.updatedAt);
    if (job.status === "running") {
      return `${t("jobs.started")} ${startedAt}`;
    }
    if (job.status === "failed") {
      return `${t("jobs.batchResult.failed")} ${finishedAt}`;
    }
    return `${t("jobs.finished")} ${finishedAt}`;
  }

  function pipelineStatusColor(status: "ready" | "warning" | "blocked") {
    return {
      ready: "success",
      warning: "warning",
      blocked: "error"
    }[status];
  }

  function cancelSelectedJob() {
    if (!canCancelSelected.value || isJobCommandPending.value) {
      return;
    }
    const job = requireSelected(selectedJob.value, t("No job selected."));
    cancelMutation.reset();
    markSucceededMutation.reset();
    cancelMutation.mutate({ jobId: job.id });
  }

  function markSelectedJobSucceeded() {
    if (!canMarkSucceeded.value || isJobCommandPending.value) {
      return;
    }
    const job = requireSelected(selectedJob.value, t("No job selected."));
    cancelMutation.reset();
    markSucceededMutation.reset();
    markSucceededMutation.mutate({
      jobId: job.id,
      result: { ...(job.result ?? {}) }
    });
  }

  function applyCommandResult(jobId: string, job: Job) {
    if (selectedJob.value?.id === jobId) {
      selectedJob.value = job;
    }
  }

  function formatJobDateTime(value: string | null) {
    return value ? formatAdminDateTime(value, locale.value) : "-";
  }

  return {
    authStore,
    canCancelSelected,
    canManage,
    canMarkSucceeded,
    drawer,
    filters,
    isCancelPending,
    isJobCommandPending,
    isMarkSucceededPending,
    isRefreshing,
    jobStatuses,
    jobs,
    jobsErrorMessage,
    jobsQuery,
    jobTypes,
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
    formatJobDateTime,
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
