<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

import type { SettingsFilterForm } from "../settings_workspace_models";

defineProps<{
  filters: SettingsFilterForm;
  categoryFilterItems: Array<{ title: string; value: string }>;
  loadedCount: number;
  pending: boolean;
}>();

defineEmits<{ apply: []; clear: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <AdminFilterToolbar class="pa-4 pa-sm-5" @apply="$emit('apply')">
      <v-text-field
        v-model="filters.query"
        class="admin-filter-control"
        :label="t('common.search')"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        hide-details
        clearable
      />
      <v-select
        v-model="filters.category"
        class="admin-filter-control"
        :label="t('settings.category')"
        :items="categoryFilterItems"
        density="compact"
        variant="outlined"
        hide-details
      />
      <template #actions>
        <AdminFilterActions
          :apply-label="t('settings.applyFilters')"
          :clear-label="t('settings.clearFilters')"
          :loading="pending"
          @clear="$emit('clear')"
        />
      </template>
      <template #meta>
        <v-chip color="primary" variant="tonal">
          {{ t("settings.loaded") }} {{ loadedCount }}
        </v-chip>
      </template>
    </AdminFilterToolbar>
  </v-card>
</template>
