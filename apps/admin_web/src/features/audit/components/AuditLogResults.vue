<script setup lang="ts">
import type { AuditLog } from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{ logs: AuditLog[]; pending: boolean; errorMessage: string }>();
defineEmits<{ open: [log: AuditLog]; retry: [] }>();

const { locale, t } = useI18n();
</script>

<template>
  <AdminDataState
    :pending="pending"
    :error-message="errorMessage"
    :empty="logs.length === 0"
    :empty-title="t('audit.empty')"
    empty-icon="mdi-file-document-off-outline"
    :retry-label="t('Retry')"
    @retry="$emit('retry')"
  >
    <v-table class="d-none d-md-block" density="comfortable" hover>
      <thead>
        <tr>
          <th>{{ t("Action") }}</th>
          <th>{{ t("Resource") }}</th>
          <th>{{ t("Actor") }}</th>
          <th>{{ t("Created") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="log in logs"
          :key="log.id"
          class="cursor-pointer"
          @click="$emit('open', log)"
        >
          <td class="font-weight-bold">{{ log.action }}</td>
          <td>{{ log.resourceType }} · {{ log.resourceId }}</td>
          <td>{{ log.actorUserId || "system" }}</td>
          <td>{{ formatAdminDateTime(log.createdAt, locale) }}</td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <button
        v-for="log in logs"
        :key="log.id"
        class="audit-record"
        type="button"
        @click="$emit('open', log)"
      >
        <span class="audit-record__main">
          <strong>{{ log.action }}</strong>
          <span>{{ log.resourceType }} · {{ log.resourceId }}</span>
          <span>{{ log.actorUserId || "system" }} · {{ formatAdminDateTime(log.createdAt, locale) }}</span>
        </span>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
    </div>
  </AdminDataState>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.audit-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.audit-record__main { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.audit-record__main span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
</style>
