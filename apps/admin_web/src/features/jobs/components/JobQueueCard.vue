<script setup lang="ts">
import type { Job, JobStatus, JobType } from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

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
  error: unknown;
  statusColor: (status: JobStatus) => string;
  resetList: () => void;
  loadMore: () => void;
  openJob: (job: Job) => void;
}>();

const { optionItems, t } = useI18n();
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
            @update:model-value="resetList"
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
            @update:model-value="resetList"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.resourceType"
            :label="t('Resource type')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="resetList"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.resourceId"
            :label="t('Resource ID')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="resetList"
          />
        </v-col>
      </v-row>
    </div>
    <v-divider />

    <v-progress-linear v-if="isPending" indeterminate color="primary" />

    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>

    <v-table v-else density="comfortable">
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
          @click="openJob(job)"
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
          <td>{{ job.createdAt }}</td>
        </tr>
      </tbody>
    </v-table>

    <div v-if="nextCursor" class="pa-4 d-flex justify-center">
      <v-btn variant="tonal" :loading="isFetching" @click="loadMore">
        {{ t("Load more") }}
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
