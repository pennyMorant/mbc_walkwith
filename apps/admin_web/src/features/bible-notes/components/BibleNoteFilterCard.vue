<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

import type { BibleNoteFilterForm } from "../bible_note_workspace_models";

const filters = defineModel<BibleNoteFilterForm>({ required: true });
defineProps<{ fetching: boolean }>();
defineEmits<{ apply: [] }>();

const { optionItems, t } = useI18n();
</script>

<template>
  <div class="pa-5">
    <v-row dense>
      <v-col cols="12" md="3">
        <v-text-field
          v-model="filters.query"
          :label="t('Search')"
          density="compact"
          variant="outlined"
          hide-details
          @keyup.enter="$emit('apply')"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          v-model="filters.verseId"
          :label="t('Verse ID')"
          density="compact"
          variant="outlined"
          hide-details
          @keyup.enter="$emit('apply')"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filters.status"
          :label="t('Status')"
          :items="optionItems(['', 'published', 'hidden', 'deleted'])"
          density="compact"
          variant="outlined"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filters.authorType"
          :label="t('Author')"
          :items="optionItems(['', 'member', 'external'])"
          density="compact"
          variant="outlined"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn
          block
          color="primary"
          variant="tonal"
          :loading="fetching"
          @click="$emit('apply')"
        >
          {{ t("common.search") }}
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>
