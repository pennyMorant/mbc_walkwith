<script setup lang="ts">
import type { AuditLog } from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";

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
    <AdminResponsiveTable>
      <template #desktop>
    <v-table density="comfortable" hover>
      <thead>
        <tr>
          <th>{{ t("Action") }}</th>
          <th>{{ t("Resource") }}</th>
          <th>{{ t("Actor") }}</th>
          <th>{{ t("Created") }}</th>
        </tr>
      </thead>
      <tbody>
        <AdminTableActionRow
          v-for="log in logs"
          :key="log.id"
          @activate="$emit('open', log)"
        >
          <td class="font-weight-bold">{{ log.action }}</td>
          <td>{{ log.resourceType }} · {{ log.resourceId }}</td>
          <td>{{ log.actorUserId || t("audit.systemActor") }}</td>
          <td>{{ formatAdminDateTime(log.createdAt, locale) }}</td>
        </AdminTableActionRow>
      </tbody>
    </v-table>

      </template>
      <template #mobile>
    <div>
      <AdminMobileRecord
        v-for="log in logs"
        :key="log.id"
        @activate="$emit('open', log)"
      >
        <strong>{{ log.action }}</strong>
        <span>{{ log.resourceType }} · {{ log.resourceId }}</span>
        <span>{{ log.actorUserId || t("audit.systemActor") }} · {{ formatAdminDateTime(log.createdAt, locale) }}</span>
      </AdminMobileRecord>
    </div>
      </template>
    </AdminResponsiveTable>
  </AdminDataState>
</template>
