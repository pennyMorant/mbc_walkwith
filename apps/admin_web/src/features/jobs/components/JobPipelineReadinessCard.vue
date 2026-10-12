<script setup lang="ts">
import type { SermonProductionPipelineCheck } from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  ready: boolean;
  pending: boolean;
  error: unknown;
  checks: SermonProductionPipelineCheck[];
  updatedAt: string | undefined;
  statusColor: (status: SermonProductionPipelineCheck["status"]) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <v-card class="pa-4 mt-6">
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ t("jobs.readinessTitle") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("jobs.pipelineChecks") }}
        </div>
      </div>
      <v-chip :color="ready ? 'success' : 'warning'" variant="tonal">
        {{ ready ? t("Ready") : t("Needs setup") }}
      </v-chip>
    </div>
    <v-progress-linear
      v-if="pending"
      indeterminate
      color="primary"
      class="mt-4"
    />
    <v-alert v-else-if="error" type="error" variant="tonal" class="mt-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <v-list v-else density="compact" class="mt-3 pa-0">
      <v-list-item
        v-for="check in checks"
        :key="check.id"
        :title="t(check.label)"
        :subtitle="check.detail"
      >
        <template #prepend>
          <v-icon
            :color="statusColor(check.status)"
            :icon="
              check.status === 'ready'
                ? 'mdi-check-circle-outline'
                : check.status === 'warning'
                  ? 'mdi-alert-circle-outline'
                  : 'mdi-close-circle-outline'
            "
          />
        </template>
        <template #append>
          <v-chip
            size="x-small"
            :color="statusColor(check.status)"
            variant="tonal"
          >
            {{ t(check.status) }}
          </v-chip>
        </template>
      </v-list-item>
    </v-list>
    <div v-if="updatedAt" class="text-caption text-medium-emphasis mt-2">
      {{ t("dashboard.lastUpdated") }} {{ updatedAt }}.
    </div>
  </v-card>
</template>
