<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  filters: {
    category: string;
    query: string;
  };
  categoryFilterItems: Array<{ title: string; value: string }>;
  refetch: () => unknown;
}>();

const { t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <div class="pa-4 pa-sm-5">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="filters.query"
            :label="t('common.search')"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="refetch"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.category"
            :label="t('settings.category')"
            :items="categoryFilterItems"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="refetch"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-btn block variant="tonal" @click="refetch">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>
