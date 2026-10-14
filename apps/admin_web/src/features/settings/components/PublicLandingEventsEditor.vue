<script setup lang="ts">
import type { PublicLandingEventsConfig } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import PublicLandingSectionFields from "./PublicLandingSectionFields.vue";

const model = defineModel<PublicLandingEventsConfig>({ required: true });
const { t } = useI18n();
</script>

<template>
  <PublicLandingSectionFields v-model="model" />
  <v-text-field
    v-model="model.emptyText"
    :label="t('settings.landing.emptyText')"
    variant="filled"
  />
  <v-slider
    v-model="model.maxItems"
    :label="t('settings.landing.maxItems')"
    :min="1"
    :max="12"
    :step="1"
    show-ticks="always"
    thumb-label="always"
    color="primary"
    class="mt-6"
  />
  <v-alert type="info" variant="tonal" class="mt-2">
    {{ t("settings.landing.eventsManagedInLife") }}
  </v-alert>
</template>
