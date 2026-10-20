<script setup lang="ts">
import type {
  PublicLandingAction,
  PublicLandingActionKind,
  PublicLandingActionTarget
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { createLandingItemId } from "../public_landing_editor";

const props = defineProps<{
  title: string;
  itemPrefix: string;
}>();
const model = defineModel<PublicLandingAction[]>({ required: true });
const { t } = useI18n();
const kinds: PublicLandingActionKind[] = [
  "anchor",
  "external_link",
  "map",
  "phone",
  "email"
];
const targets: PublicLandingActionTarget[] = ["same_tab", "new_tab"];

function addItem() {
  model.value.push({
    id: createLandingItemId(props.itemPrefix),
    title: "",
    subtitle: null,
    href: "",
    iconName: "mdi-link-variant",
    kind: "anchor",
    target: "same_tab",
    sort: 0
  });
}
</script>

<template>
  <section class="action-list">
    <div class="editor-heading">
      <strong>{{ title }}</strong>
      <v-btn
        prepend-icon="mdi-plus"
        variant="tonal"
        color="primary"
        @click="addItem"
      >
        {{ t("settings.landing.addAction") }}
      </v-btn>
    </div>
    <v-alert v-if="model.length === 0" type="info" variant="tonal">
      {{ t("settings.landing.emptyActions") }}
    </v-alert>
    <div v-for="(item, index) in model" :key="item.id" class="item-panel">
      <div class="item-toolbar">
        <strong>{{ item.title || t("settings.landing.untitledItem") }}</strong>
        <v-btn
          icon="mdi-delete-outline"
          variant="text"
          color="error"
          :aria-label="t('settings.landing.removeItem')"
          @click="model.splice(index, 1)"
        />
      </div>
      <div class="two-columns">
        <v-text-field
          v-model="item.title"
          :label="t('settings.landing.actionTitle')"
          variant="filled"
        />
        <v-text-field
          v-model="item.subtitle"
          :label="t('settings.landing.actionSubtitle')"
          variant="filled"
        />
      </div>
      <v-text-field
        v-model="item.href"
        :label="t('settings.landing.actionHref')"
        variant="filled"
      />
      <div class="action-options">
        <v-select
          v-model="item.kind"
          :items="kinds.map((value) => ({ title: t(`settings.landing.actionKind.${value}`), value }))"
          :label="t('settings.landing.actionKind')"
          variant="filled"
        />
        <v-select
          v-model="item.target"
          :items="targets.map((value) => ({ title: t(`settings.landing.actionTarget.${value}`), value }))"
          :label="t('settings.landing.actionTarget')"
          variant="filled"
        />
        <v-text-field
          v-model="item.iconName"
          :label="t('settings.landing.iconName')"
          variant="filled"
        />
        <v-text-field
          v-model.number="item.sort"
          :label="t('common.sort')"
          type="number"
          min="0"
          variant="filled"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.action-list {
  margin-top: 8px;
}

.editor-heading,
.item-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.editor-heading {
  margin-bottom: 16px;
}

.item-panel {
  padding: 16px 0;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.item-toolbar {
  margin-bottom: 12px;
}

.two-columns,
.action-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 600px) {
  .two-columns,
  .action-options {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
