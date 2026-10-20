<script setup lang="ts">
import { computed } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

import type { AdminNavigationItem } from "./admin_navigation";
import { type AdminSearchOption, useAdminSearch } from "./use_admin_search";

const props = defineProps<{ items: AdminNavigationItem[] }>();
const emit = defineEmits<{ navigate: [path: string] }>();
const { t } = useI18n();
const {
  clear,
  error,
  isFetching,
  options,
  searchText,
  selectedOption
} = useAdminSearch(computed(() => props.items), t);
const errorMessage = computed(() =>
  error.value ? formatApiErrorMessage(error.value, t("nav.searchFailed")) : ""
);

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
    :error-messages="errorMessage"
    prepend-inner-icon="mdi-magnify"
    variant="solo-filled"
    density="compact"
    hide-details="auto"
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
