<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

import type { AuditLogFilterForm } from "../audit_log_workspace_models";

defineProps<{
  filters: AuditLogFilterForm;
  loadedCount: number;
  pending: boolean;
}>();

defineEmits<{ apply: []; clear: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-card>
    <AdminFilterToolbar class="pa-5" @apply="$emit('apply')">
      <v-text-field
        v-model="filters.action"
        class="admin-filter-control"
        :label="t('audit.actionFilter')"
        density="compact"
        variant="outlined"
        hide-details
        clearable
      />
      <v-text-field
        v-model="filters.resourceType"
        class="admin-filter-control"
        :label="t('audit.resourceTypeFilter')"
        density="compact"
        variant="outlined"
        hide-details
        clearable
      />
      <v-text-field
        v-model="filters.resourceId"
        class="admin-filter-control"
        :label="t('audit.resourceIdFilter')"
        density="compact"
        variant="outlined"
        hide-details
        clearable
      />
      <v-text-field
        v-model="filters.actorUserId"
        class="admin-filter-control"
        :label="t('audit.actorFilter')"
        density="compact"
        variant="outlined"
        hide-details
        clearable
      />
      <template #actions>
        <AdminFilterActions
          :apply-label="t('audit.applyFilters')"
          :clear-label="t('audit.clearFilters')"
          :loading="pending"
          @clear="$emit('clear')"
        />
      </template>
      <template #meta>
        <v-chip color="primary" variant="tonal">
          {{ t("audit.loaded") }} {{ loadedCount }}
        </v-chip>
      </template>
    </AdminFilterToolbar>
  </v-card>
</template>
