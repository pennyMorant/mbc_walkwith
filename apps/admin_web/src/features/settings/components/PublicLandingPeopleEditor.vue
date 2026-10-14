<script setup lang="ts">
import type { PublicLandingPeopleSection } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { createLandingItemId } from "../public_landing_editor";
import PublicLandingSectionFields from "./PublicLandingSectionFields.vue";

const model = defineModel<PublicLandingPeopleSection>({ required: true });
const { t } = useI18n();

function addItem() {
  model.value.items.push({
    id: createLandingItemId("person"),
    name: "",
    role: "",
    summary: "",
    imageUrl: ""
  });
}
</script>

<template>
  <PublicLandingSectionFields v-model="model" />
  <div class="editor-heading">
    <strong>{{ t("settings.landing.peopleItems") }}</strong>
    <v-btn prepend-icon="mdi-plus" variant="tonal" color="primary" @click="addItem">
      {{ t("settings.landing.addPerson") }}
    </v-btn>
  </div>
  <v-alert v-if="model.items.length === 0" type="info" variant="tonal">
    {{ t("settings.landing.emptyPeople") }}
  </v-alert>
  <div v-for="(item, index) in model.items" :key="item.id" class="item-panel">
    <div class="item-toolbar">
      <strong>{{ item.name || t("settings.landing.untitledItem") }}</strong>
      <v-btn
        icon="mdi-delete-outline"
        variant="text"
        color="error"
        :aria-label="t('settings.landing.removeItem')"
        @click="model.items.splice(index, 1)"
      />
    </div>
    <div class="two-columns">
      <v-text-field v-model="item.name" :label="t('settings.landing.name')" variant="filled" />
      <v-text-field v-model="item.role" :label="t('settings.landing.role')" variant="filled" />
    </div>
    <v-text-field v-model="item.imageUrl" :label="t('settings.landing.imageUrl')" variant="filled" />
    <v-textarea v-model="item.summary" :label="t('settings.landing.summary')" variant="filled" rows="3" auto-grow />
  </div>
</template>

<style scoped>
.editor-heading,
.item-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.editor-heading { margin: 8px 0 16px; }
.item-panel { padding: 16px 0; border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.item-toolbar { margin-bottom: 12px; }
.two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 600px) { .two-columns { grid-template-columns: 1fr; gap: 0; } }
</style>
