<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";

import type { AdminNavigationItem } from "./admin_navigation";
import { type AdminSearchOption, useAdminSearch } from "./use_admin_search";

const props = defineProps<{ items: AdminNavigationItem[] }>();
const emit = defineEmits<{ navigate: [path: string] }>();
const { t } = useI18n();
const {
  clear,
  isFetching,
  options,
  searchText,
  selectedOption
} = useAdminSearch(computed(() => props.items), t);

function select(option: AdminSearchOption | null) {
  if (!option) return;
  emit("navigate", option.path);
  clear();
}
</script>

<template>
  <v-autocomplete
    v-model="selectedOption"
    v-model:search="searchText"
    :items="options"
    :placeholder="t('nav.searchPlaceholder')"
    :no-data-text="t('nav.searchEmpty')"
    :loading="isFetching"
    prepend-inner-icon="mdi-magnify"
    variant="solo-filled"
    density="compact"
    hide-details
    clearable
    return-object
    class="admin-command-search"
    @update:model-value="select"
  />
</template>

<style scoped>
.admin-command-search {
  width: min(38vw, 520px);
  max-width: 520px;
  margin-inline: 24px;
}
</style>
