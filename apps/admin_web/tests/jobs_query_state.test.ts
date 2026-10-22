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
const componentFiles = [
  "JobPipelineReadinessCard.vue",
  "JobStatsWorkspace.vue",
  "JobQueueCard.vue"
];

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

  test("keeps pipeline, stats, and queue retries independently page-owned", () => {
    expect(page).toContain('@retry="refreshPipelineStatus"');
    expect(page).toContain('@retry="refreshStats"');
    expect(page).toContain('@retry="refreshJobs"');
    expect(controller).toContain("function refreshPipelineStatus()");
    expect(controller).toContain("function refreshStats()");
    expect(controller).toContain("function refreshJobs()");
  });

  test("does not render failed stats queries as zero-valued diagnostics", () => {
    expect(page).toContain(":error-message=\"statsErrorMessage\"");
    expect(page).not.toContain("statsQuery.data.value?.byStatus.failed ?? 0");
    expect(page).not.toContain("statusCount(status)");
  });

  test("separates draft filters from applied query filters", () => {
    expect(controller).toContain("const appliedFilters = ref<JobListFilters>");
    expect(controller).toContain("function applyJobFilters()");
    expect(controller).toContain("loadedPages.value = []");
    expect(page).toContain('@filters-changed="applyJobFilters"');
  });

  test("keeps command failures separate from query failures", () => {
    expect(controller).toContain("selectedJobActionErrorMessage");
    expect(page).toContain('v-if="selectedJobActionErrorMessage"');
    expect(page).toContain(":error-message=\"jobsErrorMessage\"");
  });
});
