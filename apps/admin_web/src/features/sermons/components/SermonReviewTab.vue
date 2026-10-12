<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  reviewChecks: Array<{
    label: string;
    ok: boolean;
    detail: string;
  }>;
  ready: boolean;
  transcriptCharacters: number;
  outlineCount: number;
  referenceCount: number;
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <v-card variant="outlined" class="pa-4 mb-4">
      <div
        class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
      >
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            {{ t("Review readiness") }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ ready ? t("Ready to publish") : t("Needs attention") }}
          </div>
        </div>
        <v-chip :color="ready ? 'success' : 'warning'">
          {{ ready ? t("Ready") : t("Incomplete") }}
        </v-chip>
      </div>

      <v-list density="compact" class="mt-3">
        <v-list-item
          v-for="check in reviewChecks"
          :key="check.label"
          :title="check.label"
          :subtitle="check.detail"
        >
          <template #prepend>
            <v-icon
              :color="check.ok ? 'success' : 'warning'"
              :icon="
                check.ok
                  ? 'mdi-check-circle-outline'
                  : 'mdi-alert-circle-outline'
              "
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <v-row dense>
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4">
          <div class="text-caption text-medium-emphasis">
            {{ t("Transcript") }}
          </div>
          <div class="text-h6 font-weight-bold">
            {{ transcriptCharacters }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t("sermons.reviewMetric.characters") }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4">
          <div class="text-caption text-medium-emphasis">
            {{ t("Outline") }}
          </div>
          <div class="text-h6 font-weight-bold">
            {{ outlineCount }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t("sermons.reviewMetric.sections") }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4">
          <div class="text-caption text-medium-emphasis">
            {{ t("Scripture") }}
          </div>
          <div class="text-h6 font-weight-bold">
            {{ referenceCount }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t("sermons.reviewMetric.references") }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="!ready" type="warning" variant="tonal" class="mt-4">
      {{ t("Complete the checklist before publishing.") }}
    </v-alert>
  </div>
</template>
