import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/jobs/pages/JobsPage.vue", import.meta.url),
  "utf8"
);
const controller = readFileSync(
  new URL(
    "../src/features/jobs/composables/use_jobs_page_controller.ts",
    import.meta.url
  ),
  "utf8"
);
const queueQuery = readFileSync(
  new URL(
    "../src/features/jobs/composables/use_job_queue_query.ts",
    import.meta.url
  ),
  "utf8"
);
const componentFiles = [
  "JobPipelineReadinessCard.vue",
  "JobStatsWorkspace.vue",
  "JobQueueCard.vue"
];
const messages = readFileSync(
  new URL("../src/core/i18n/i18n.ts", import.meta.url),
  "utf8"
);

describe("jobs query states", () => {
  test.each(componentFiles)("keeps %s query presentation-only", (file) => {
    const source = readFileSync(
      new URL(`../src/features/jobs/components/${file}`, import.meta.url),
      "utf8"
    );

    expect(source).toContain("AdminDataState");
    expect(source).toContain("$emit('retry')");
    expect(source).not.toContain("useQuery");
    expect(source).not.toContain("auth_store");
  });

  test("keeps pipeline, stats, and queue retries independently composed", () => {
    expect(page).toContain('@retry="refreshPipelineStatus"');
    expect(page).toContain('@retry="refreshStats"');
    expect(page).toContain('@retry="refreshJobs"');
    expect(controller).toContain("function refreshPipelineStatus()");
    expect(controller).toContain("function refreshStats()");
    expect(queueQuery).toContain("function refreshJobs()");
    expect(controller).toContain("refreshJobs\n  } = useJobQueueQuery");
  });

  test("does not render failed stats queries as zero-valued diagnostics", () => {
    expect(page).toContain(":error-message=\"statsErrorMessage\"");
    expect(
      readFileSync(
        new URL(
          "../src/features/jobs/components/JobStatsWorkspace.vue",
          import.meta.url
        ),
        "utf8"
      )
    ).toContain("job-stats-workspace--state");
    expect(page).not.toContain("statsQuery.data.value?.byStatus.failed ?? 0");
    expect(page).not.toContain("statusCount(status)");
  });

  test("separates draft filters from applied query filters", () => {
    expect(queueQuery).toContain("const appliedFilters = ref<JobListFilters>");
    expect(queueQuery).toContain("function applyJobFilters()");
    expect(page).toContain('@filters-changed="applyJobFilters"');
  });

  test("projects the queue into responsive records without changing open intent", () => {
    const queueCard = readFileSync(
      new URL(
        "../src/features/jobs/components/JobQueueCard.vue",
        import.meta.url
      ),
      "utf8"
    );

    expect(queueCard).toContain("AdminMobileRecord");
    expect(queueCard).toContain('class="d-none d-md-block"');
    expect(queueCard).toContain("@activate=\"$emit('openJob', job)\"");
  });

  test("lets the infinite query own cursor pages without query side effects", () => {
    expect(queueQuery).toContain("useInfiniteQuery");
    expect(queueQuery).toContain("initialPageParam: null");
    expect(queueQuery).toContain("getNextPageParam:");
    expect(queueQuery).toContain("jobsQuery.fetchNextPage()");
    expect(queueQuery).not.toContain("loadedPages");
    expect(queueQuery).not.toContain(".push(page)");
  });

  test("keeps command failures separate from query failures", () => {
    expect(controller).toContain("selectedJobActionErrorMessage");
    expect(page).toContain('v-if="selectedJobActionErrorMessage"');
    expect(page).toContain(":error-message=\"jobsErrorMessage\"");
  });

  test("freezes job command intents and scopes late results to their target", () => {
    expect(controller).toContain("mutationFn: (intent: { jobId: string })");
    expect(controller).toContain("cancelMutation.mutate({ jobId: job.id })");
    expect(controller).toContain("jobId: job.id,");
    expect(controller).toContain("applyCommandResult(intent.jobId, job)");
    expect(controller).toContain("selectedJob.value?.id === jobId");
    expect(controller).not.toContain("onSuccess: async (job) =>");
    expect(page).not.toContain("cancelMutation");
    expect(page).not.toContain("markSucceededMutation");
  });

  test("localizes the primary diagnostics workspace copy", () => {
    for (const key of [
      "jobs.subtitle",
      "jobs.readinessTitle",
      "jobs.pipelineChecks",
      "jobs.filterSubtitle"
    ]) {
      expect(messages.match(new RegExp(`"${key}"`, "g"))?.length).toBe(4);
    }
  });
});
