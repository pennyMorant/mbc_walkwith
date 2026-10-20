<script setup lang="ts">
import type {
  PublicLandingAction,
  PublicLandingActionKind,
  PublicLandingActionTarget
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

const model = defineModel<PublicLandingAction>({ required: true });
const { t } = useI18n();
const kinds: PublicLandingActionKind[] = [
  "anchor",
  "external_link",
  "map",
  "phone",
  "email"
];
const targets: PublicLandingActionTarget[] = ["same_tab", "new_tab"];
</script>

<template>
  <div class="two-columns">
    <v-text-field
      v-model="model.title"
      :label="t('settings.landing.actionTitle')"
      variant="filled"
    />
    <v-text-field
      v-model="model.subtitle"
      :label="t('settings.landing.actionSubtitle')"
      variant="filled"
    />
  </div>
  <v-text-field
    v-model="model.href"
    :label="t('settings.landing.actionHref')"
    variant="filled"
  />
  <div class="action-options">
    <v-select
      v-model="model.kind"
      :items="
        kinds.map((value) => ({
          title: t(`settings.landing.actionKind.${value}`),
          value
        }))
      "
      :label="t('settings.landing.actionKind')"
      variant="filled"
    />
    <v-select
      v-model="model.target"
      :items="
        targets.map((value) => ({
          title: t(`settings.landing.actionTarget.${value}`),
          value
        }))
      "
      :label="t('settings.landing.actionTarget')"
      variant="filled"
    />
    <v-text-field
      v-model="model.iconName"
      :label="t('settings.landing.iconName')"
      variant="filled"
    />
    <v-text-field
      v-model.number="model.sort"
      :label="t('common.sort')"
      type="number"
      min="0"
      variant="filled"
    />
  </div>
</template>

<style scoped>
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
