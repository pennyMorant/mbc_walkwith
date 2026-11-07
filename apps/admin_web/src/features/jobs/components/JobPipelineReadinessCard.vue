<script setup lang="ts">
import type {
  SermonProductionPipelineCheck,
  SermonProductionPipelineStatusResponse
} from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";

defineProps<{
  status: SermonProductionPipelineStatusResponse | undefined;
  pending: boolean;
  fetching: boolean;
  errorMessage: string;
  statusColor: (status: SermonProductionPipelineCheck["status"]) => string;
}>();
defineEmits<{ retry: [] }>();

const { locale, t } = useI18n();
</script>

<template>
  <v-card class="pa-4 mt-6">
    <AdminPanelHeader
      :title="t('jobs.readinessTitle')"
      :subtitle="t('jobs.pipelineChecks')"
    >
      <template v-if="status" #actions>
        <v-chip
          :color="status.ready ? 'success' : 'warning'"
          variant="tonal"
        >
          {{ status.ready ? t("Ready") : t("Needs setup") }}
        </v-chip>
      </template>
    </AdminPanelHeader>

    <AdminDataState
      :pending="pending && !status"
      :error-message="status ? '' : errorMessage"
      :empty="false"
      empty-title=""
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-progress-linear
        v-if="fetching && status"
        indeterminate
        color="primary"
        class="mt-4"
      />
      <AdminRetryAlert
        :message="status ? errorMessage : ''"
        :retry-label="t('common.refresh')"
        class="mt-4"
        @retry="$emit('retry')"
      />
      <template v-if="status">
        <v-list density="compact" class="mt-3 pa-0">
          <v-list-item
            v-for="check in status.checks"
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
        <div class="text-caption text-medium-emphasis mt-2">
          {{ t("dashboard.lastUpdated") }}
          {{ formatAdminDateTime(status.updatedAt, locale) }}.
        </div>
      </template>
    </AdminDataState>
  </v-card>
</template>
