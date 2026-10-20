<script setup lang="ts">
import type { PublicLandingAction } from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import type { PublicLandingStructuredSection } from "../public_landing_editor";
import PublicLandingActionFields from "./PublicLandingActionFields.vue";
import PublicLandingActionListEditor from "./PublicLandingActionListEditor.vue";

const props = defineProps<{
  section: Extract<
    PublicLandingStructuredSection,
    | "brandAction"
    | "navigation"
    | "headerActions"
    | "mobileActions"
    | "footerActions"
  >;
}>();
const model = defineModel<unknown>({ required: true });
const { t } = useI18n();
const singleAction = computed({
  get: () => model.value as PublicLandingAction,
  set: (value: PublicLandingAction) => (model.value = value)
});
const actionList = computed({
  get: () => model.value as PublicLandingAction[],
  set: (value: PublicLandingAction[]) => (model.value = value)
});
const title = computed(() => t(`settings.landing.${props.section}`));
</script>

<template>
  <section>
    <template v-if="section === 'brandAction'">
      <div class="text-subtitle-1 font-weight-bold mb-4">{{ title }}</div>
      <PublicLandingActionFields v-model="singleAction" />
    </template>
    <PublicLandingActionListEditor
      v-else
      v-model="actionList"
      :title="title"
      :item-prefix="section"
    />
  </section>
</template>
