<script setup lang="ts">
import type { PublicLandingHeroSetting } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import MediaImagePicker from "./MediaImagePicker.vue";
import PublicLandingActionListEditor from "./PublicLandingActionListEditor.vue";

const model = defineModel<PublicLandingHeroSetting>({ required: true });
const { t } = useI18n();
</script>

<template>
  <div class="hero-editor">
    <v-text-field
      v-model="model.kicker"
      :label="t('settings.landing.heroKicker')"
      variant="filled"
    />
    <v-text-field
      v-model="model.title"
      :label="t('settings.landing.sectionTitle')"
      variant="filled"
    />
    <v-text-field
      v-model="model.mission"
      :label="t('settings.landing.mission')"
      variant="filled"
    />
    <v-textarea
      v-model="model.body"
      :label="t('settings.landing.sectionBody')"
      variant="filled"
      rows="3"
      auto-grow
    />
    <MediaImagePicker v-model="model.imageMediaId" :alt-text="model.title" />
    <PublicLandingActionListEditor
      v-model="model.primaryActions"
      :title="t('settings.landing.primaryActions')"
      item-prefix="hero-primary"
    />
    <PublicLandingActionListEditor
      v-model="model.quickActions"
      :title="t('settings.landing.quickActions')"
      item-prefix="hero-quick"
    />
  </div>
</template>

<style scoped>
.hero-editor {
  display: grid;
  gap: 4px;
}
</style>
