<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{ pending: boolean }>();
defineEmits<{ clear: [] }>();

const { t } = useI18n();
</script>

<template>
  <div class="d-flex flex-wrap align-center ga-2">
    <v-btn
      type="submit"
      color="primary"
      variant="tonal"
      prepend-icon="mdi-filter-outline"
      :loading="pending"
    >
      {{ t("giving.applyFilters") }}
    </v-btn>
    <v-btn
      type="button"
      variant="text"
      prepend-icon="mdi-filter-remove-outline"
      :disabled="pending"
      @click="$emit('clear')"
    >
      {{ t("giving.clearFilters") }}
    </v-btn>
  </div>
</template>
