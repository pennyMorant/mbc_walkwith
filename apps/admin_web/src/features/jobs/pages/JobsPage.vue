<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminRefreshButton from "@/core/ui/AdminRefreshButton.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import JobFailureDiagnostics from "../components/JobFailureDiagnostics.vue";
import JobPipelineReadinessCard from "../components/JobPipelineReadinessCard.vue";
import JobQueueCard from "../components/JobQueueCard.vue";
import JobStatsWorkspace from "../components/JobStatsWorkspace.vue";
import { useJobsPageController } from "../composables/use_jobs_page_controller";

const {
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
} = useJobsPageController();
</script>

<template>
  <div>
    <AdminPageHeader :title="t('System diagnostics')" :subtitle="t('jobs.subtitle')">
      <template #actions>
        <AdminRefreshButton
          :label="t('common.refresh')"
          :loading="isRefreshing"
          @refresh="refreshAll"
        />
      </template>
    </AdminPageHeader>

    <JobPipelineReadinessCard
      :status="pipelineStatusQuery.data.value"
      :pending="pipelineStatusQuery.isPending.value"
      :fetching="pipelineStatusQuery.isFetching.value"
      :error-message="pipelineStatusErrorMessage"
      :status-color="pipelineStatusColor"
      @retry="refreshPipelineStatus"
    />

    <JobStatsWorkspace
      :stats="statsQuery.data.value"
      :pending="statsQuery.isPending.value"
      :fetching="statsQuery.isFetching.value"
      :error-message="statsErrorMessage"
      :status-color="statusColor"
      :job-age-label="jobAgeLabel"
      @retry="refreshStats"
      @open-job="openJob"
    />

    <v-row class="mt-6" dense>
      <v-col cols="12">
        <JobQueueCard
          :filters="filters"
          :job-statuses="jobStatuses"
          :job-types="jobTypes"
          :jobs="jobs"
          :next-cursor="nextCursor"
          :is-pending="jobsQuery.isPending.value"
          :is-fetching="jobsQuery.isFetching.value"
          :error-message="jobsErrorMessage"
          :status-color="statusColor"
          @filters-changed="applyJobFilters"
          @retry="refreshJobs"
          @load-more="loadMore"
          @open-job="openJob"
        />
      </v-col>
    </v-row>

    <AdminResponsiveDrawer v-model="drawer" :desktop-width="520">
      <div v-if="selectedJob" class="pa-5">
        <div class="d-flex align-start justify-space-between ga-4">
          <div>
            <div class="text-h6 font-weight-bold">{{ t(selectedJob.type) }}</div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ selectedJob.id }}
            </div>
          </div>
          <v-chip :color="statusColor(selectedJob.status)">
            {{ t(selectedJob.status) }}
          </v-chip>
        </div>

        <v-divider class="my-5" />
        <div class="text-subtitle-2 font-weight-bold">{{ t("Resource") }}</div>
        <div class="text-body-2 mt-1">
          {{ selectedJob.resourceType || "-" }} / {{ selectedJob.resourceId || "-" }}
        </div>

        <div class="text-subtitle-2 font-weight-bold mt-5">{{ t("Timing") }}</div>
        <v-list density="compact">
          <v-list-item
            :title="t('Available')"
            :subtitle="formatJobDateTime(selectedJob.availableAt)"
          />
          <v-list-item
            :title="t('Started')"
            :subtitle="formatJobDateTime(selectedJob.startedAt)"
          />
          <v-list-item
            :title="t('Finished')"
            :subtitle="formatJobDateTime(selectedJob.finishedAt)"
          />
        </v-list>

        <div class="text-subtitle-2 font-weight-bold mt-5">{{ t("Payload") }}</div>
        <pre class="json-block">{{ JSON.stringify(selectedJob.payload, null, 2) }}</pre>

        <div class="text-subtitle-2 font-weight-bold mt-5">{{ t("Result") }}</div>
        <pre class="json-block">{{ JSON.stringify(selectedJob.result, null, 2) }}</pre>

        <JobFailureDiagnostics :job="selectedJob" />

        <v-alert
          v-if="selectedJobActionErrorMessage"
          type="error"
          variant="tonal"
          class="mt-5"
        >
          {{ selectedJobActionErrorMessage }}
        </v-alert>

        <div v-if="canManage" class="d-flex ga-2 mt-6">
          <v-btn
            color="success"
            variant="tonal"
            :disabled="
              !canMarkSucceeded || isJobCommandPending
            "
            :loading="isMarkSucceededPending"
            @click="markSelectedJobSucceeded"
          >
            {{ t("Mark succeeded") }}
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            :disabled="!canCancelSelected || isJobCommandPending"
            :loading="isCancelPending"
            @click="cancelSelectedJob"
          >
            {{ t("Cancel") }}
          </v-btn>
        </div>
      </div>
    </AdminResponsiveDrawer>
  </div>
</template>

<style scoped>
.json-block {
  margin: 8px 0 0;
  padding: 12px;
  border-radius: 8px;
  background: rgba(20, 24, 22, 0.06);
  overflow: auto;
  font-size: 12px;
}
</style>
