<script setup lang="ts">
import type { AuditLog } from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDrawerHeader from "@/core/ui/AdminDrawerHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

const drawer = defineModel<boolean>({ required: true });
defineProps<{ log: AuditLog | null }>();

const { locale, t } = useI18n();

function json(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}
</script>

<template>
  <AdminResponsiveDrawer v-model="drawer" :desktop-width="620">
    <div v-if="log" class="pa-5">
      <AdminDrawerHeader
        :title="log.action"
        :subtitle="`${log.resourceType} · ${log.resourceId}`"
        :close-label="t('common.close')"
        @close="drawer = false"
      />

      <v-list density="compact" class="mt-4 detail-list">
        <v-list-item
          :title="t('audit.logId')"
          :subtitle="log.id"
        />
        <v-list-item
          :title="t('audit.actor')"
          :subtitle="log.actorUserId || t('audit.systemActor')"
        />
        <v-list-item
          :title="t('audit.createdAt')"
          :subtitle="formatAdminDateTime(log.createdAt, locale)"
        />
      </v-list>

      <div class="text-subtitle-2 font-weight-bold mt-6">
        {{ t("audit.before") }}
      </div>
      <pre class="json-block mt-3">{{ json(log.beforeJson) }}</pre>

      <div class="text-subtitle-2 font-weight-bold mt-6">
        {{ t("audit.after") }}
      </div>
      <pre class="json-block mt-3">{{ json(log.afterJson) }}</pre>
    </div>
  </AdminResponsiveDrawer>
</template>

<style scoped>
.detail-list :deep(.v-list-item-subtitle) {
  overflow-wrap: anywhere;
  white-space: normal;
}

.json-block {
  max-height: 320px;
  overflow: auto;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  padding: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
