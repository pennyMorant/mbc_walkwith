<script setup lang="ts">
import type { PublicLandingAction } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { createLandingItemId } from "../public_landing_editor";
import PublicLandingActionFields from "./PublicLandingActionFields.vue";

const props = defineProps<{
  title: string;
  itemPrefix: string;
}>();
const model = defineModel<PublicLandingAction[]>({ required: true });
const { t } = useI18n();

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
      <PublicLandingActionFields
        :model-value="item"
        @update:model-value="model[index] = $event"
      />
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

</style>
