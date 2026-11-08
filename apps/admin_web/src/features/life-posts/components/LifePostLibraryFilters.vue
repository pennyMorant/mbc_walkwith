<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";

import type { LifePostLibraryFilterForm } from "../life_post_library_models";

defineProps<{
  filters: LifePostLibraryFilterForm;
  fetching: boolean;
}>();

const emit = defineEmits<{ apply: []; clear: [] }>();
const { optionItems, t } = useI18n();
</script>

<template>
  <v-form @submit.prevent="emit('apply')">
    <v-row dense>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="filters.query"
          :label="t('Search')"
          density="compact"
          variant="outlined"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.visibility"
          :label="t('Visibility')"
          :items="optionItems(['', 'public', 'members', 'group', 'private'])"
          density="compact"
          variant="outlined"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.status"
          :label="t('Status')"
          :items="
            optionItems(['', 'draft', 'needs_review', 'published', 'archived'])
          "
          density="compact"
          variant="outlined"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="2">
        <AdminFilterActions
          :apply-label="t('life.applyFilters')"
          :clear-label="t('life.clearFilters')"
          :loading="fetching"
          icon-only
          align-end
          @clear="emit('clear')"
        />
      </v-col>
    </v-row>
  </v-form>
</template>
