<script setup lang="ts">
import type { JobStatus } from "@mbc/api-contracts";

import JobFailureDiagnostics from "../components/JobFailureDiagnostics.vue";
import JobPipelineReadinessCard from "../components/JobPipelineReadinessCard.vue";
import JobQueueCard from "../components/JobQueueCard.vue";
import { useJobsPageController } from "../composables/use_jobs_page_controller";

const {
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
} = useJobsPageController();
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("System diagnostics") }}</div>
        <div class="page-subtitle">
          {{ t("jobs.subtitle") }}
        </div>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        :loading="jobsQuery.isFetching.value"
        @click="resetList"
      >
        {{ t("common.refresh") }}
      </v-btn>
    </div>

    <JobPipelineReadinessCard
      :ready="pipelineStatusQuery.data.value?.ready ?? false"
      :pending="pipelineStatusQuery.isPending.value"
      :error="pipelineStatusQuery.error.value"
      :checks="pipelineStatusQuery.data.value?.checks ?? []"
      :updated-at="pipelineStatusQuery.data.value?.updatedAt"
      :status-color="pipelineStatusColor"
    />

    <v-row class="mt-6" dense>
      <v-col
        v-for="status in ['queued', 'running', 'failed', 'succeeded'] as JobStatus[]"
        :key="status"
        cols="6"
        md="3"
      >
        <v-card class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div class="text-caption text-medium-emphasis text-uppercase">
              {{ t(status) }}
            </div>
            <v-chip size="x-small" :color="statusColor(status)" />
          </div>
          <div class="text-h5 font-weight-bold mt-2">
            {{ statusCount(status) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2" dense>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div class="text-subtitle-2 font-weight-bold">
              {{ t("Local package workflow") }}
            </div>
            <v-chip color="info" size="small" variant="tonal">
              {{ t("Queued") }} {{ statusCount("queued") }}
            </v-chip>
          </div>
          <div class="text-body-2 text-medium-emphasis mt-3">
            {{
              t(
                "Sermon text, outline, and Scripture references are prepared locally. The server only stores reviewed packages and historical diagnostics."
              )
            }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div class="text-subtitle-2 font-weight-bold">
              {{ t("Failure health") }}
            </div>
            <v-chip color="error" size="small">
              {{ statsQuery.data.value?.byStatus.failed ?? 0 }}
            </v-chip>
          </div>
          <div class="d-flex ga-2 mt-3">
            <v-chip color="warning" variant="tonal" size="small">
              {{ t("Retryable") }} {{ statsQuery.data.value?.retryableFailed ?? 0 }}
            </v-chip>
            <v-chip color="error" variant="tonal" size="small">
              {{ t("Exhausted") }} {{ statsQuery.data.value?.exhaustedFailed ?? 0 }}
            </v-chip>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-subtitle-2 font-weight-bold">
            {{ t("Running now") }}
          </div>
          <div
            v-if="(statsQuery.data.value?.recentRunning.length ?? 0) === 0"
            class="text-body-2 text-medium-emphasis mt-2"
          >
            {{ t("No running jobs.") }}
          </div>
          <v-list v-else density="compact" class="mt-2">
            <v-list-item
              v-for="job in statsQuery.data.value?.recentRunning"
              :key="job.id"
              :title="t(job.type)"
              :subtitle="`${job.resourceType || '-'} / ${job.resourceId || '-'} · ${jobAgeLabel(job)}`"
              @click="openJob(job)"
            >
              <template #append>
                <v-chip size="x-small" :color="statusColor(job.status)">
                  {{ job.attempts }} / {{ job.maxAttempts }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

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
          :error="jobsQuery.error.value"
          :status-color="statusColor"
          :reset-list="resetList"
          :load-more="loadMore"
          :open-job="openJob"
        />
      </v-col>
    </v-row>

    <v-row class="mt-2" dense>
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <div class="text-subtitle-2 font-weight-bold">
            {{ t("Recent failures") }}
          </div>
          <div
            v-if="(statsQuery.data.value?.recentFailures.length ?? 0) === 0"
            class="text-body-2 text-medium-emphasis mt-2"
          >
            {{ t("No recent failures.") }}
          </div>
          <v-list v-else density="compact" class="mt-2">
            <v-list-item
              v-for="job in statsQuery.data.value?.recentFailures"
              :key="job.id"
              :title="t(job.type)"
              :subtitle="job.errorMessage || jobAgeLabel(job)"
              @click="openJob(job)"
            >
              <template #append>
                <v-chip size="x-small" color="error">
                  {{ job.attempts }} / {{ job.maxAttempts }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <div class="text-subtitle-2 font-weight-bold">
            {{ t("Recent completed") }}
          </div>
          <div
            v-if="(statsQuery.data.value?.recentSucceeded.length ?? 0) === 0"
            class="text-body-2 text-medium-emphasis mt-2"
          >
            {{ t("No completed jobs yet.") }}
          </div>
          <v-list v-else density="compact" class="mt-2">
            <v-list-item
              v-for="job in statsQuery.data.value?.recentSucceeded"
              :key="job.id"
              :title="t(job.type)"
              :subtitle="`${job.resourceType || '-'} / ${job.resourceId || '-'} · ${jobAgeLabel(job)}`"
              @click="openJob(job)"
            >
              <template #append>
                <v-chip size="x-small" color="success">
                  {{ job.attempts }} / {{ job.maxAttempts }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-navigation-drawer v-model="drawer" temporary location="right" width="520">
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
          <v-list-item :title="t('Available')" :subtitle="selectedJob.availableAt" />
          <v-list-item :title="t('Started')" :subtitle="selectedJob.startedAt || '-'" />
          <v-list-item :title="t('Finished')" :subtitle="selectedJob.finishedAt || '-'" />
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
              !canMarkSucceeded || markSucceededMutation.isPending.value
            "
            :loading="markSucceededMutation.isPending.value"
            @click="markSelectedJobSucceeded"
          >
            {{ t("Mark succeeded") }}
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            :disabled="!canCancelSelected || cancelMutation.isPending.value"
            :loading="cancelMutation.isPending.value"
            @click="cancelSelectedJob"
          >
            {{ t("Cancel") }}
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>
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
