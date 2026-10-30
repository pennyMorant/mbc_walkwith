<script setup lang="ts">
import type { BibleKnowledgeEntity } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

import type { BibleKnowledgeEditorForm } from "../bible_knowledge_workspace_models";

const form = defineModel<BibleKnowledgeEditorForm>({ required: true });
defineProps<{
  selectedEntity: BibleKnowledgeEntity | null;
  canManage: boolean;
  canSave: boolean;
  saving: boolean;
  deleting: boolean;
  errorMessage: string;
}>();
defineEmits<{
  addSection: [];
  moveSection: [index: number, direction: -1 | 1];
  removeSection: [index: number];
  save: [];
  delete: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <div class="text-h6 font-weight-bold">
    {{ selectedEntity ? selectedEntity.name : t("New entity") }}
  </div>
  <v-form class="mt-5" @submit.prevent="$emit('save')">
    <v-text-field v-model="form.id" :label="t('ID')" density="comfortable" variant="outlined" :readonly="!!selectedEntity" />
    <v-row dense>
      <v-col cols="12" md="6">
        <v-select v-model="form.type" :label="t('Type')" :items="optionItems(['person', 'place'])" density="comfortable" variant="outlined" />
      </v-col>
      <v-col cols="12" md="6">
        <v-select v-model="form.status" :label="t('Status')" :items="optionItems(['draft', 'processing', 'needs_review', 'published', 'archived', 'failed'])" density="comfortable" variant="outlined" />
      </v-col>
    </v-row>
    <v-text-field v-model="form.name" :label="t('Name')" density="comfortable" variant="outlined" />
    <v-text-field v-model="form.category" :label="t('Category')" density="comfortable" variant="outlined" />
    <v-textarea v-model="form.summary" :label="t('Summary')" rows="3" density="comfortable" variant="outlined" />
    <v-textarea v-model="form.description" :label="t('Description')" rows="5" density="comfortable" variant="outlined" />

    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <div class="text-subtitle-2 font-weight-bold">{{ t("Sections") }}</div>
        <div class="text-caption text-medium-emphasis">{{ t("bible.sectionsSubtitle") }}</div>
      </div>
      <v-btn size="small" variant="tonal" color="primary" @click="$emit('addSection')">{{ t("Add") }}</v-btn>
    </div>
    <v-card v-for="(section, index) in form.sections" :key="index" class="mb-3" variant="outlined">
      <div class="pa-4">
        <div class="d-flex justify-space-between align-center mb-3">
          <div class="text-body-2 font-weight-bold">{{ t("Section") }} {{ index + 1 }}</div>
          <div class="d-flex ga-1">
            <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="index === 0" :aria-label="t('Move section up')" @click="$emit('moveSection', index, -1)" />
            <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="index === form.sections.length - 1" :aria-label="t('Move section down')" @click="$emit('moveSection', index, 1)" />
            <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" :aria-label="t('Remove section')" @click="$emit('removeSection', index)" />
          </div>
        </div>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field v-model="section.type" :label="t('Type')" density="compact" variant="outlined" />
          </v-col>
          <v-col cols="12" md="8">
            <v-text-field v-model="section.title" :label="t('Title')" density="compact" variant="outlined" />
          </v-col>
        </v-row>
        <v-textarea v-model="section.body" :label="t('Body')" rows="4" density="compact" variant="outlined" hide-details />
      </div>
    </v-card>

    <v-textarea v-model="form.aliasesText" :label="t('Aliases')" rows="4" density="comfortable" variant="outlined" />
    <v-textarea v-model="form.verseAliasesText" :label="t('Verse aliases JSON')" rows="5" density="comfortable" variant="outlined" />
    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
    <div class="d-flex justify-space-between ga-3">
      <v-btn v-if="selectedEntity" color="error" variant="tonal" :disabled="!canManage || saving || deleting" :loading="deleting" @click="$emit('delete')">
        {{ t("Delete") }}
      </v-btn>
      <div v-else />
      <v-btn type="submit" color="primary" :disabled="!canSave || !canManage || saving || deleting" :loading="saving">
        {{ t("common.save") }}
      </v-btn>
    </div>
  </v-form>
</template>
