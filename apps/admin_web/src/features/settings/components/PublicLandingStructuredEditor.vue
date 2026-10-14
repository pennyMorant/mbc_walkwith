<script setup lang="ts">
import type {
  PublicLandingEventsConfig,
  PublicLandingPeopleSection,
  PublicLandingScheduleSection
} from "@mbc/api-contracts";
import { computed } from "vue";

import { publicLandingStructuredSection } from "../public_landing_editor";
import PublicLandingEventsEditor from "./PublicLandingEventsEditor.vue";
import PublicLandingPeopleEditor from "./PublicLandingPeopleEditor.vue";
import PublicLandingScheduleEditor from "./PublicLandingScheduleEditor.vue";

const props = defineProps<{ settingKey: string }>();
const model = defineModel<unknown>({ required: true });
const section = computed(() => publicLandingStructuredSection(props.settingKey));
const schedule = computed({
  get: () => model.value as PublicLandingScheduleSection,
  set: (value: PublicLandingScheduleSection) => (model.value = value)
});
const people = computed({
  get: () => model.value as PublicLandingPeopleSection,
  set: (value: PublicLandingPeopleSection) => (model.value = value)
});
const events = computed({
  get: () => model.value as PublicLandingEventsConfig,
  set: (value: PublicLandingEventsConfig) => (model.value = value)
});
</script>

<template>
  <PublicLandingScheduleEditor v-if="section === 'schedule'" v-model="schedule" />
  <PublicLandingPeopleEditor v-else-if="section === 'people'" v-model="people" />
  <PublicLandingEventsEditor v-else-if="section === 'events'" v-model="events" />
</template>
