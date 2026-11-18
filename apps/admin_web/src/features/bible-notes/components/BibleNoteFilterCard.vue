<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

import type { BibleNoteFilterForm } from "../bible_note_workspace_models";

const filters = defineModel<BibleNoteFilterForm>({ required: true });
defineProps<{ fetching: boolean }>();
defineEmits<{ apply: [] }>();

const { optionItems, t } = useI18n();
</script>

<template>
  <AdminFilterToolbar class="pa-5" @apply="$emit('apply')">
    <v-text-field
      v-model="filters.query"
      class="admin-filter-control"
      :label="t('Search')"
      density="compact"
      variant="outlined"
      hide-details
    />
    <v-text-field
      v-model="filters.verseId"
      class="admin-filter-control"
      :label="t('Verse ID')"
      density="compact"
      variant="outlined"
      hide-details
    />
    <v-select
      v-model="filters.status"
      class="admin-filter-control"
      :label="t('Status')"
      :items="optionItems(['', 'published', 'hidden', 'deleted'])"
      density="compact"
      variant="outlined"
      hide-details
    />
    <v-select
      v-model="filters.authorType"
      class="admin-filter-control"
      :label="t('Author')"
      :items="optionItems(['', 'member', 'external'])"
      density="compact"
      variant="outlined"
      hide-details
    />
    <template #actions>
      <v-btn
        type="submit"
        color="primary"
        variant="tonal"
        :loading="fetching"
      >
        {{ t("common.search") }}
      </v-btn>
    </template>
  </AdminFilterToolbar>
</template>
