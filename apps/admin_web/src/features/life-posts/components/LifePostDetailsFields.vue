<script setup lang="ts">
import type { LifePostType } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import type { LifePostEditorForm } from "../life_post_editor_models";
import LifeEventRegistrationSettings from "./LifeEventRegistrationSettings.vue";
import LifePostMarkdownEditor from "./LifePostMarkdownEditor.vue";

const form = defineModel<LifePostEditorForm>({ required: true });
defineProps<{
  lifePostTypes: readonly LifePostType[];
  lifePostIcons: string[];
  sortOptions: Array<{ title: string; value: number }>;
  imagePreviewUrl: string | null;
  imageUploadPending: boolean;
  imageUploadErrorMessage: string;
  scheduleValid: boolean;
  ctaUrlValid: boolean;
}>();
defineEmits<{
  uploadImage: [files: File | File[] | null];
  clearImage: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-row dense>
    <v-col cols="12" md="6">
      <v-select v-model="form.type" :label="t('Type')" :items="optionItems(lifePostTypes)" item-title="title" item-value="value" variant="outlined" />
    </v-col>
    <v-col cols="12" md="6">
      <v-select v-model="form.visibility" :label="t('Visibility')" :items="optionItems(['public', 'members', 'group', 'private'])" variant="outlined" />
    </v-col>
    <v-col cols="12" md="6">
      <v-select v-model="form.status" :label="t('Status')" :items="optionItems(['draft', 'needs_review', 'published', 'archived'])" variant="outlined" />
    </v-col>
    <v-col cols="12" md="6">
      <v-select v-model="form.sort" :label="t('life.sort.label')" :items="sortOptions" variant="outlined" />
    </v-col>
  </v-row>
  <v-text-field v-model="form.title" :label="t('Title')" variant="outlined" />
  <v-text-field v-model="form.meta" :label="t('Meta')" variant="outlined" />
  <v-row dense>
    <v-col cols="12" md="5">
      <v-text-field v-model="form.ctaLabel" :label="t('Action label')" variant="outlined" />
    </v-col>
    <v-col cols="12" md="7">
      <v-text-field v-model="form.ctaUrl" :label="t('Action URL')" :placeholder="t('life.actionUrlPlaceholder')" variant="outlined" />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field v-model="form.startsAt" :label="t('Starts at')" type="datetime-local" variant="outlined" />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field v-model="form.endsAt" :label="t('Ends at')" type="datetime-local" variant="outlined" />
    </v-col>
  </v-row>
  <v-file-input
    :label="t('Upload image')"
    accept="image/png,image/jpeg,image/webp,image/gif"
    variant="outlined"
    prepend-icon=""
    prepend-inner-icon="mdi-image-plus"
    :loading="imageUploadPending"
    @update:model-value="$emit('uploadImage', $event)"
  />
  <v-alert v-if="imageUploadErrorMessage" type="error" variant="tonal" class="mb-4">
    {{ imageUploadErrorMessage }}
  </v-alert>
  <v-img v-if="imagePreviewUrl" :src="imagePreviewUrl" height="160" cover class="life-post-image-preview mb-3" />
  <div v-if="imagePreviewUrl" class="d-flex justify-end mb-5">
    <v-btn color="secondary" variant="tonal" size="small" @click="$emit('clearImage')">
      {{ t("Clear image") }}
    </v-btn>
  </div>
  <v-select v-model="form.iconName" :label="t('Icon name')" :items="optionItems(lifePostIcons)" variant="outlined" />
  <LifePostMarkdownEditor v-model="form.body" :label="t('Body')" :rows="8" />
  <LifeEventRegistrationSettings :form="form" @update-form="Object.assign(form, $event)" />
  <v-alert v-if="!scheduleValid || !ctaUrlValid" type="warning" variant="tonal" class="mb-4">
    {{ !scheduleValid ? t("End time must be after start time.") : t("Action URL must start with http or https.") }}
  </v-alert>
</template>

<style scoped>
.life-post-image-preview { border-radius: 8px; }
</style>
