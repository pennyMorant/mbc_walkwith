<script setup lang="ts">
import type { PublicLandingServiceSetting } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { createLandingItemId } from "../public_landing_editor";
import MediaImagePicker from "./MediaImagePicker.vue";
import PublicLandingActionListEditor from "./PublicLandingActionListEditor.vue";
import PublicLandingSectionFields from "./PublicLandingSectionFields.vue";

const model = defineModel<PublicLandingServiceSetting>({ required: true });
const { t } = useI18n();

function addFact() {
  model.value.facts.push({
    id: createLandingItemId("service-fact"),
    label: "",
    iconName: "mdi-calendar-heart",
    sort: 0
  });
}
</script>

<template>
  <PublicLandingSectionFields v-model="model" />
  <MediaImagePicker v-model="model.imageMediaId" :alt-text="model.title" />
  <section class="fact-list">
    <div class="editor-heading">
      <strong>{{ t("settings.landing.serviceFacts") }}</strong>
      <v-btn
        prepend-icon="mdi-plus"
        variant="tonal"
        color="primary"
        @click="addFact"
      >
        {{ t("settings.landing.addFact") }}
      </v-btn>
    </div>
    <v-alert v-if="model.facts.length === 0" type="info" variant="tonal">
      {{ t("settings.landing.emptyFacts") }}
    </v-alert>
    <div
      v-for="(fact, index) in model.facts"
      :key="fact.id"
      class="item-panel"
    >
      <div class="item-toolbar">
        <strong>{{ fact.label || t("settings.landing.untitledItem") }}</strong>
        <v-btn
          icon="mdi-delete-outline"
          variant="text"
          color="error"
          :aria-label="t('settings.landing.removeItem')"
          @click="model.facts.splice(index, 1)"
        />
      </div>
      <div class="fact-fields">
        <v-text-field
          v-model="fact.label"
          :label="t('settings.landing.factLabel')"
          variant="filled"
        />
        <v-text-field
          v-model="fact.iconName"
          :label="t('settings.landing.iconName')"
          variant="filled"
        />
        <v-text-field
          v-model.number="fact.sort"
          :label="t('common.sort')"
          type="number"
          min="0"
          variant="filled"
        />
      </div>
    </div>
  </section>
  <PublicLandingActionListEditor
    v-model="model.actions"
    :title="t('settings.landing.serviceActions')"
    item-prefix="service-action"
  />
</template>

<style scoped>
.fact-list {
  margin-top: 16px;
}

.editor-heading,
.item-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.editor-heading,
.item-toolbar {
  margin-bottom: 12px;
}

.item-panel {
  padding: 16px 0;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.fact-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 140px;
  gap: 12px;
}

@media (max-width: 720px) {
  .fact-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
