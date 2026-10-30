<script setup lang="ts">
import type { DiscipleshipJourneyFilterForm } from "../discipleship_workspace_models";

import { useI18n } from "@/core/i18n/i18n";

const filters = defineModel<DiscipleshipJourneyFilterForm>({ required: true });
defineProps<{ statusItems: unknown[] }>();
defineEmits<{ apply: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-card class="mt-5" variant="outlined">
    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            hide-details
            variant="outlined"
            @keyup.enter="$emit('apply')"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.status"
            :items="statusItems"
            :label="t('Status')"
            density="compact"
            hide-details
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-btn block variant="tonal" @click="$emit('apply')">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
