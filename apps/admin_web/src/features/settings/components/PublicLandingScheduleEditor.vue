<script setup lang="ts">
import type { PublicLandingScheduleSection } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { createLandingItemId } from "../public_landing_editor";
import PublicLandingSectionFields from "./PublicLandingSectionFields.vue";

const model = defineModel<PublicLandingScheduleSection>({ required: true });
const { t } = useI18n();

function addItem() {
  model.value.items.push({
    id: createLandingItemId("schedule"),
    title: "",
    dayLabel: "",
    timeLabel: "",
    location: "",
    detail: "",
    iconName: "mdi-calendar-heart"
  });
}
</script>

<template>
  <PublicLandingSectionFields v-model="model" />
  <div class="editor-heading">
    <strong>{{ t("settings.landing.scheduleItems") }}</strong>
    <v-btn
      prepend-icon="mdi-plus"
      variant="tonal"
      color="primary"
      @click="addItem"
    >
      {{ t("settings.landing.addSchedule") }}
    </v-btn>
  </div>
  <v-alert v-if="model.items.length === 0" type="info" variant="tonal">
    {{ t("settings.landing.emptySchedule") }}
  </v-alert>
  <div v-for="(item, index) in model.items" :key="item.id" class="item-panel">
    <div class="item-toolbar">
      <strong>{{ item.title || t("settings.landing.untitledItem") }}</strong>
      <v-btn
        icon="mdi-delete-outline"
        variant="text"
        color="error"
        :aria-label="t('settings.landing.removeItem')"
        @click="model.items.splice(index, 1)"
      />
    </div>
    <v-text-field v-model="item.title" :label="t('settings.landing.name')" variant="filled" />
    <div class="two-columns">
      <v-text-field v-model="item.dayLabel" :label="t('settings.landing.day')" variant="filled" />
      <v-text-field v-model="item.timeLabel" :label="t('settings.landing.time')" variant="filled" />
    </div>
    <v-text-field v-model="item.location" :label="t('settings.landing.location')" variant="filled" />
    <v-textarea v-model="item.detail" :label="t('settings.landing.detail')" variant="filled" rows="2" auto-grow />
  </div>
</template>

<style scoped>
.editor-heading,
.item-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.editor-heading { margin: 8px 0 16px; }
.item-panel { padding: 16px 0; border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.item-toolbar { margin-bottom: 12px; }
.two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 600px) { .two-columns { grid-template-columns: 1fr; gap: 0; } }
</style>
