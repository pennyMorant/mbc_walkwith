<script setup lang="ts">
import type {
  PublicLandingEventsConfig,
  PublicLandingGallerySetting,
  PublicLandingHeroSetting,
  PublicLandingPeopleSetting,
  PublicLandingScheduleSection,
  PublicLandingServiceSetting
} from "@mbc/api-contracts";
import { computed } from "vue";

import { publicLandingStructuredSection } from "../public_landing_editor";
import PublicLandingActionSettingEditor from "./PublicLandingActionSettingEditor.vue";
import PublicLandingEventsEditor from "./PublicLandingEventsEditor.vue";
import PublicLandingGalleryEditor from "./PublicLandingGalleryEditor.vue";
import PublicLandingHeroEditor from "./PublicLandingHeroEditor.vue";
import PublicLandingPeopleEditor from "./PublicLandingPeopleEditor.vue";
import PublicLandingScheduleEditor from "./PublicLandingScheduleEditor.vue";
import PublicLandingServiceEditor from "./PublicLandingServiceEditor.vue";

const props = defineProps<{ settingKey: string }>();
const model = defineModel<unknown>({ required: true });
const section = computed(() => publicLandingStructuredSection(props.settingKey));
const hero = computed({
  get: () => model.value as PublicLandingHeroSetting,
  set: (value: PublicLandingHeroSetting) => (model.value = value)
});
const service = computed({
  get: () => model.value as PublicLandingServiceSetting,
  set: (value: PublicLandingServiceSetting) => (model.value = value)
});
const schedule = computed({
  get: () => model.value as PublicLandingScheduleSection,
  set: (value: PublicLandingScheduleSection) => (model.value = value)
});
const people = computed({
  get: () => model.value as PublicLandingPeopleSetting,
  set: (value: PublicLandingPeopleSetting) => (model.value = value)
});
const events = computed({
  get: () => model.value as PublicLandingEventsConfig,
  set: (value: PublicLandingEventsConfig) => (model.value = value)
});
const gallery = computed({
  get: () => model.value as PublicLandingGallerySetting,
  set: (value: PublicLandingGallerySetting) => (model.value = value)
});
</script>

<template>
  <PublicLandingActionSettingEditor
    v-if="
      section === 'brandAction' ||
      section === 'navigation' ||
      section === 'headerActions' ||
      section === 'mobileActions' ||
      section === 'footerActions'
    "
    v-model="model"
    :section="section"
  />
  <PublicLandingHeroEditor v-else-if="section === 'hero'" v-model="hero" />
  <PublicLandingServiceEditor
    v-else-if="section === 'service'"
    v-model="service"
  />
  <PublicLandingScheduleEditor
    v-else-if="section === 'schedule'"
    v-model="schedule"
  />
  <PublicLandingPeopleEditor v-else-if="section === 'people'" v-model="people" />
  <PublicLandingEventsEditor v-else-if="section === 'events'" v-model="events" />
  <PublicLandingGalleryEditor v-else-if="section === 'gallery'" v-model="gallery" />
</template>
