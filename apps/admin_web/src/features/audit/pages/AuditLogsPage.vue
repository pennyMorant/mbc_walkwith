<script setup lang="ts">
import type { AuditLog } from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { listAuditLogs } from "@/core/api/audit_logs";
import { useI18n } from "@/core/i18n/i18n";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import AuditLogResults from "../components/AuditLogResults.vue";

const selectedLog = ref<AuditLog | null>(null);
const drawer = ref(false);
const { t } = useI18n();

const filters = reactive({
  actorUserId: "",
  action: "",
  resourceType: "",
  resourceId: ""
});

const activeFilters = computed(() => ({ ...filters, limit: 50 }));
const logsQuery = useQuery({
  queryKey: ["audit-logs", activeFilters],
  queryFn: () => listAuditLogs(activeFilters.value)
});

const logs = computed(() => logsQuery.data.value ?? []);

function openLog(log: AuditLog) {
  selectedLog.value = log;
  drawer.value = true;
}

function json(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}
</script>

<template>
  <div>
    <AdminPageHeader :title="t('nav.audit')" :subtitle="t('audit.subtitle')">
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="logsQuery.isFetching.value"
          @click="logsQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-card class="mt-6">
      <div class="pa-5">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.action"
              :label="t('Action')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="logsQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.resourceType"
              :label="t('Resource type')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="logsQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.resourceId"
              :label="t('Resource ID')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="logsQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.actorUserId"
              :label="t('Actor user ID')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="logsQuery.refetch()"
            />
          </v-col>
        </v-row>
      </div>
      <v-divider />
      <AuditLogResults
        :logs="logs"
        :pending="logsQuery.isPending.value"
        :error-message="logsQuery.error.value ? formatApiErrorMessage(logsQuery.error.value, t('common.error')) : ''"
        @open="openLog"
      />
    </v-card>

    <AdminResponsiveDrawer v-model="drawer" :desktop-width="620">
      <div v-if="selectedLog" class="pa-5">
        <div class="text-h6 font-weight-bold">{{ selectedLog.action }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ selectedLog.resourceType }} · {{ selectedLog.resourceId }}
        </div>

        <v-divider class="my-5" />

        <div class="text-subtitle-2 font-weight-bold mb-2">
          {{ t("Before") }}
        </div>
        <pre class="json-block">{{ json(selectedLog.beforeJson) }}</pre>

        <div class="text-subtitle-2 font-weight-bold mb-2 mt-5">
          {{ t("After") }}
        </div>
        <pre class="json-block">{{ json(selectedLog.afterJson) }}</pre>
      </div>
    </AdminResponsiveDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.json-block {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  max-height: 320px;
  overflow: auto;
  padding: 12px;
  white-space: pre-wrap;
}
</style>
