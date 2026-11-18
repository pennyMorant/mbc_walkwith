<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

import type { LifePostLibraryFilterForm } from "../life_post_library_models";

defineProps<{
  filters: LifePostLibraryFilterForm;
  fetching: boolean;
}>();

const emit = defineEmits<{ apply: []; clear: [] }>();
const { optionItems, t } = useI18n();
</script>

<template>
  <AdminFilterToolbar @apply="emit('apply')">
    <v-text-field
      v-model="filters.query"
      class="admin-filter-control"
      :label="t('Search')"
      density="compact"
      variant="outlined"
      hide-details
    />
    <v-select
      v-model="filters.visibility"
      class="admin-filter-control"
      :label="t('Visibility')"
      :items="optionItems(['', 'public', 'members', 'group', 'private'])"
      density="compact"
      variant="outlined"
      hide-details
    />
    <v-select
      v-model="filters.status"
      class="admin-filter-control"
      :label="t('Status')"
      :items="
        optionItems(['', 'draft', 'needs_review', 'published', 'archived'])
      "
      density="compact"
      variant="outlined"
      hide-details
    />
    <template #actions>
      <AdminFilterActions
        :apply-label="t('life.applyFilters')"
        :clear-label="t('life.clearFilters')"
        :loading="fetching"
        icon-only
        align-end
        @clear="emit('clear')"
      />
    </template>
  </AdminFilterToolbar>
</template>
