<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

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
      <v-col cols="12" md="2" class="d-flex justify-md-end ga-2">
        <v-btn
          type="submit"
          color="primary"
          variant="tonal"
          icon="mdi-filter-outline"
          :loading="fetching"
          :aria-label="t('life.applyFilters')"
          :title="t('life.applyFilters')"
        />
        <v-btn
          type="button"
          variant="text"
          icon="mdi-filter-remove-outline"
          :disabled="fetching"
          :aria-label="t('life.clearFilters')"
          :title="t('life.clearFilters')"
          @click="emit('clear')"
        />
      </v-col>
    </v-row>
  </v-form>
</template>
