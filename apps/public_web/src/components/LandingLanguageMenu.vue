<script setup lang="ts">
import type { SupportedLocale } from "@mbc/api-contracts";

import type { PublicLocaleOption } from "@/core/locale";

defineProps<{
  currentLocale: SupportedLocale;
  errorMessage: string;
  isLoading: boolean;
  label: string;
  options: PublicLocaleOption[];
  retryLabel: string;
}>();

defineEmits<{
  change: [locale: SupportedLocale];
  retry: [];
}>();
</script>

<template>
  <div class="landing-language-control">
    <v-menu location="bottom end" :close-on-content-click="true">
      <template #activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          class="landing-language-button"
          icon="mdi-translate"
          :loading="isLoading"
          :aria-label="label"
          :title="label"
          variant="text"
        />
      </template>

      <v-list class="landing-language-menu" density="comfortable" nav>
        <v-list-item
          v-for="option in options"
          :key="option.value"
          :active="option.value === currentLocale"
          :title="option.title"
          :prepend-icon="
            option.value === currentLocale ? 'mdi-check-circle' : 'mdi-circle-outline'
          "
          @click="$emit('change', option.value)"
        />
      </v-list>
    </v-menu>

    <button
      v-if="errorMessage"
      class="landing-language-error"
      type="button"
      @click="$emit('retry')"
    >
      <v-icon icon="mdi-cloud-alert-outline" size="18" />
      <span>{{ errorMessage }}</span>
      <strong>{{ retryLabel }}</strong>
    </button>
  </div>
</template>
