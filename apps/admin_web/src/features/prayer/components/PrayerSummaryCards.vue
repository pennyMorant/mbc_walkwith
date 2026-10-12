<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  loaded: number;
  pending: number;
  privateCount: number;
}>();
const { t } = useI18n();
</script>

<template>
  <v-row class="mt-5" dense>
    <v-col cols="12" md="4">
      <v-card class="pa-4">
        <div class="text-caption text-medium-emphasis">
          {{ t("Loaded requests") }}
        </div>
        <div class="text-h5 font-weight-bold mt-1">{{ loaded }}</div>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card class="pa-4">
        <div class="text-caption text-medium-emphasis">
          {{ t("Pending review") }}
        </div>
        <div class="text-h5 font-weight-bold mt-1">{{ pending }}</div>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card class="pa-4">
        <div class="text-caption text-medium-emphasis">{{ t("Private") }}</div>
        <div class="text-h5 font-weight-bold mt-1">{{ privateCount }}</div>
      </v-card>
    </v-col>
  </v-row>
</template>
