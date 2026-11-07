<script setup lang="ts">
import type { Job, JobStatsResponse, JobStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";

const props = defineProps<{
  stats: JobStatsResponse | undefined;
  pending: boolean;
  fetching: boolean;
  errorMessage: string;
  statusColor: (status: JobStatus) => string;
  jobAgeLabel: (job: Job) => string;
}>();
defineEmits<{ openJob: [job: Job]; retry: [] }>();

const { t } = useI18n();

function statusCount(status: JobStatus) {
  return props.stats?.byStatus[status] ?? 0;
}
</script>

<template>
  <div
    :class="[
      'job-stats-workspace',
      { 'job-stats-workspace--state': !stats }
    ]"
  >
    <AdminDataState
      :pending="pending && !stats"
      :error-message="stats ? '' : errorMessage"
      :empty="false"
      empty-title=""
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-progress-linear
        v-if="fetching && stats"
        indeterminate
        color="primary"
        class="mt-6"
      />
      <AdminRetryAlert
        :message="stats ? errorMessage : ''"
        :retry-label="t('common.refresh')"
        class="mt-6"
        @retry="$emit('retry')"
      />

      <template v-if="stats">
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
                {{ stats.byStatus.failed }}
              </v-chip>
            </div>
            <div class="d-flex ga-2 mt-3">
              <v-chip color="warning" variant="tonal" size="small">
                {{ t("Retryable") }} {{ stats.retryableFailed }}
              </v-chip>
              <v-chip color="error" variant="tonal" size="small">
                {{ t("Exhausted") }} {{ stats.exhaustedFailed }}
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
              v-if="stats.recentRunning.length === 0"
              class="text-body-2 text-medium-emphasis mt-2"
            >
              {{ t("No running jobs.") }}
            </div>
            <v-list v-else density="compact" class="mt-2">
              <v-list-item
                v-for="job in stats.recentRunning"
                :key="job.id"
                :title="t(job.type)"
                :subtitle="`${job.resourceType || '-'} / ${job.resourceId || '-'} · ${jobAgeLabel(job)}`"
                @click="$emit('openJob', job)"
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

        <v-row class="mt-2" dense>
        <v-col cols="12" md="6">
          <v-card class="pa-4">
            <div class="text-subtitle-2 font-weight-bold">
              {{ t("Recent failures") }}
            </div>
            <div
              v-if="stats.recentFailures.length === 0"
              class="text-body-2 text-medium-emphasis mt-2"
            >
              {{ t("No recent failures.") }}
            </div>
            <v-list v-else density="compact" class="mt-2">
              <v-list-item
                v-for="job in stats.recentFailures"
                :key="job.id"
                :title="t(job.type)"
                :subtitle="job.errorMessage || jobAgeLabel(job)"
                @click="$emit('openJob', job)"
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
              v-if="stats.recentSucceeded.length === 0"
              class="text-body-2 text-medium-emphasis mt-2"
            >
              {{ t("No completed jobs yet.") }}
            </div>
            <v-list v-else density="compact" class="mt-2">
              <v-list-item
                v-for="job in stats.recentSucceeded"
                :key="job.id"
                :title="t(job.type)"
                :subtitle="`${job.resourceType || '-'} / ${job.resourceId || '-'} · ${jobAgeLabel(job)}`"
                @click="$emit('openJob', job)"
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
      </template>
    </AdminDataState>
  </div>
</template>

<style scoped>
.job-stats-workspace--state {
  margin-top: 24px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.55);
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
}
</style>
