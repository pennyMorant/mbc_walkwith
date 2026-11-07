<script setup lang="ts">
import type { AuditLog } from "@mbc/api-contracts";
import { useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminRefreshButton from "@/core/ui/AdminRefreshButton.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";

import AuditLogDetailDrawer from "../components/AuditLogDetailDrawer.vue";
import AuditLogFiltersCard from "../components/AuditLogFiltersCard.vue";
import AuditLogResults from "../components/AuditLogResults.vue";
import { useAuditLogQuery } from "../composables/use_audit_log_query";

const queryClient = useQueryClient();
const { t } = useI18n();
const selectedLog = ref<AuditLog | null>(null);
const drawer = ref(false);

const {
  filters,
  logsQuery,
  logs,
  applyFilters,
  clearFilters,
  refreshList,
  loadMore
} = useAuditLogQuery(queryClient);

const queryError = computed(() =>
  logsQuery.error.value
    ? formatApiErrorMessage(logsQuery.error.value, t("common.error"))
    : ""
);
const initialQueryError = computed(() =>
  logs.value.length === 0 ? queryError.value : ""
);
const backgroundQueryError = computed(() =>
  logs.value.length > 0 ? queryError.value : ""
);

function openLog(log: AuditLog) {
  selectedLog.value = log;
  drawer.value = true;
}
</script>

<template>
  <div>
    <AdminPageHeader :title="t('nav.audit')" :subtitle="t('audit.subtitle')">
      <template #actions>
        <AdminRefreshButton
          :label="t('common.refresh')"
          :loading="logsQuery.isFetching.value"
          @refresh="refreshList"
        />
      </template>
    </AdminPageHeader>

    <AdminRetryAlert
      :message="backgroundQueryError ? t('audit.refreshFailed') : ''"
      :retry-label="t('Retry')"
      type="warning"
      button-color="warning"
      class="mt-4"
      @retry="refreshList"
    />

    <AuditLogFiltersCard
      class="mt-6"
      :filters="filters"
      :loaded-count="logs.length"
      :pending="logsQuery.isFetching.value"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <v-card class="mt-4">
      <AuditLogResults
        :logs="logs"
        :pending="logsQuery.isPending.value"
        :error-message="initialQueryError"
        @open="openLog"
        @retry="refreshList"
      />
      <v-divider v-if="logsQuery.hasNextPage.value" />
      <div v-if="logsQuery.hasNextPage.value" class="pa-4 text-center">
        <v-btn
          color="primary"
          variant="tonal"
          :loading="logsQuery.isFetchingNextPage.value"
          @click="loadMore"
        >
          {{ t("Load more") }}
        </v-btn>
      </div>
    </v-card>

    <AuditLogDetailDrawer v-model="drawer" :log="selectedLog" />
  </div>
</template>
