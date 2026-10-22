<script setup lang="ts">
import type { Job, JobStatus, JobType } from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{
  filters: {
    status: JobStatus | "";
    type: JobType | "";
    resourceType: string;
    resourceId: string;
  };
  jobStatuses: Array<JobStatus | "">;
  jobTypes: JobType[];
  jobs: Job[];
  nextCursor: string | null;
  isPending: boolean;
  isFetching: boolean;
  errorMessage: string;
  statusColor: (status: JobStatus) => string;
}>();
defineEmits<{
  filtersChanged: [];
  loadMore: [];
  openJob: [job: Job];
  retry: [];
}>();

const { locale, optionItems, t } = useI18n();
</script>

<template>
  <v-card>
    <div class="pa-5">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            {{ t("Job queue") }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ t("jobs.filterSubtitle") }}
          </div>
        </div>
        <v-chip>{{ jobs.length }}</v-chip>
      </div>
      <v-row dense class="mt-4">
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.status"
            :label="t('Status')"
            :items="optionItems(jobStatuses)"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="$emit('filtersChanged')"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.type"
            :label="t('Type')"
            :items="optionItems(['', ...jobTypes])"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="$emit('filtersChanged')"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.resourceType"
            :label="t('Resource type')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="$emit('filtersChanged')"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.resourceId"
            :label="t('Resource ID')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="$emit('filtersChanged')"
          />
        </v-col>
      </v-row>
    </div>
    <v-divider />

    <AdminDataState
      :pending="isPending && jobs.length === 0"
      :error-message="jobs.length === 0 ? errorMessage : ''"
      :empty="!isPending && !errorMessage && jobs.length === 0"
      :empty-title="t('jobs.noJobs')"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-progress-linear
        v-if="isFetching && jobs.length > 0"
        indeterminate
        color="primary"
      />
      <v-alert
        v-if="jobs.length > 0 && errorMessage"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3">
          <span>{{ errorMessage }}</span>
          <v-btn
            color="error"
            variant="tonal"
            size="small"
            prepend-icon="mdi-refresh"
            @click="$emit('retry')"
          >
            {{ t("common.refresh") }}
          </v-btn>
        </div>
      </v-alert>
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>{{ t("Type") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("Resource") }}</th>
            <th>{{ t("Attempts") }}</th>
            <th>{{ t("Created") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="job in jobs"
            :key="job.id"
            class="cursor-pointer"
            @click="$emit('openJob', job)"
          >
            <td class="font-weight-bold">{{ t(job.type) }}</td>
            <td>
              <v-chip size="small" :color="statusColor(job.status)">
                {{ t(job.status) }}
              </v-chip>
            </td>
            <td>
              <div>{{ job.resourceType || "-" }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ job.resourceId || "" }}
              </div>
            </td>
            <td>{{ job.attempts }} / {{ job.maxAttempts }}</td>
            <td>{{ formatAdminDateTime(job.createdAt, locale) }}</td>
          </tr>
        </tbody>
      </v-table>

      <div v-if="nextCursor" class="pa-4 d-flex justify-center">
        <v-btn
          variant="tonal"
          :loading="isFetching"
          @click="$emit('loadMore')"
        >
          {{ t("Load more") }}
        </v-btn>
      </div>
    </AdminDataState>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
