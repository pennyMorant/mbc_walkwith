<script setup lang="ts">
import type { PublicLandingGallerySection } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { createLandingItemId } from "../public_landing_editor";
import MediaImagePicker from "./MediaImagePicker.vue";
import PublicLandingSectionFields from "./PublicLandingSectionFields.vue";

const model = defineModel<PublicLandingGallerySection>({ required: true });
const { t } = useI18n();

function addItem() {
  model.value.items.push({
    id: createLandingItemId("gallery"),
    mediaId: null,
    imageUrl: "",
    altText: "",
    title: "",
    body: "",
    sort: 0
  });
}
</script>

<template>
  <PublicLandingSectionFields v-model="model" />
  <div class="editor-heading">
    <strong>{{ t("settings.landing.galleryItems") }}</strong>
    <v-btn prepend-icon="mdi-plus" variant="tonal" color="primary" @click="addItem">
      {{ t("settings.landing.addGalleryImage") }}
    </v-btn>
  </div>
  <v-alert v-if="model.items.length === 0" type="info" variant="tonal">
    {{ t("settings.landing.emptyGallery") }}
  </v-alert>
  <div v-for="(item, index) in model.items" :key="item.id" class="item-panel">
    <div class="item-toolbar">
      <strong>{{ item.title || t("settings.landing.untitledItem") }}</strong>
      <v-btn icon="mdi-delete-outline" variant="text" color="error" :aria-label="t('settings.landing.removeItem')" @click="model.items.splice(index, 1)" />
    </div>
    <MediaImagePicker
      v-model="item.mediaId"
      :preview-url="item.imageUrl"
      :alt-text="item.altText || item.title"
      @update:model-value="!$event && (item.imageUrl = '')"
      @selected="item.imageUrl = $event.url ?? ''"
    />
    <div class="two-columns">
      <v-text-field v-model="item.title" :label="t('settings.landing.galleryTitle')" variant="filled" />
      <v-text-field v-model.number="item.sort" :label="t('common.sort')" type="number" min="0" variant="filled" />
    </div>
    <v-text-field v-model="item.altText" :label="t('settings.landing.altText')" variant="filled" />
    <v-textarea v-model="item.body" :label="t('settings.landing.galleryBody')" variant="filled" rows="2" auto-grow />
  </div>
</template>

<style scoped>
.editor-heading, .item-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.editor-heading { margin: 8px 0 16px; }
.item-panel { display: grid; gap: 12px; padding: 16px 0; border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.two-columns { display: grid; grid-template-columns: 1fr 160px; gap: 12px; }
@media (max-width: 600px) { .two-columns { grid-template-columns: 1fr; gap: 0; } }
</style>
