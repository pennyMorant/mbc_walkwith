<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

const props = withDefaults(
  defineProps<{
    items: string[];
    loading: boolean;
    density?: "default" | "comfortable" | "compact";
  }>(),
  { density: "comfortable" }
);

const topics = defineModel<string[]>({ required: true });
const { t } = useI18n();
</script>

<template>
  <v-combobox
    v-model="topics"
    :label="t('Topics')"
    :items="props.items"
    :loading="props.loading"
    :density="props.density"
    variant="outlined"
    multiple
    chips
    closable-chips
    clearable
  />
</template>
