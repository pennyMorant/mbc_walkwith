<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

type SectionCopy = {
  eyebrow: string;
  title: string;
  body: string;
};

const model = defineModel<SectionCopy>({ required: true });
const { t } = useI18n();
</script>

<template>
  <div class="section-fields">
    <v-text-field
      v-model="model.eyebrow"
      :label="t('settings.landing.eyebrow')"
      variant="filled"
      density="comfortable"
    />
    <v-text-field
      v-model="model.title"
      :label="t('settings.landing.sectionTitle')"
      variant="filled"
      density="comfortable"
    />
    <v-textarea
      v-model="model.body"
      :label="t('settings.landing.sectionBody')"
      variant="filled"
      rows="2"
      auto-grow
    />
  </div>
</template>

<style scoped>
.section-fields {
  display: grid;
  gap: 4px;
}
</style>
