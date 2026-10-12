<script setup lang="ts">
import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  canExport: boolean;
  canGenerate: boolean;
  form: {
    year: number;
    userId: string;
    donorName: string;
    donorEmail: string;
  };
  error: unknown;
  generate: () => void;
  isGenerating: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <v-card class="pa-5 mt-4">
    <div class="text-subtitle-1 font-weight-bold">
      {{ t("Generate statement") }}
    </div>
    <v-form class="mt-4" @submit.prevent="generate">
      <v-text-field
        v-model.number="form.year"
        :label="t('Tax year')"
        type="number"
        density="comfortable"
        variant="outlined"
      />
      <v-text-field
        v-model="form.userId"
        :label="t('User ID')"
        density="comfortable"
        variant="outlined"
      />
      <v-text-field
        v-model="form.donorName"
        :label="t('Donor name')"
        density="comfortable"
        variant="outlined"
      />
      <v-text-field
        v-model="form.donorEmail"
        :label="t('Donor email')"
        type="email"
        density="comfortable"
        variant="outlined"
      />
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{
          formatApiErrorMessage(error, t("common.error"))
        }}
      </v-alert>
      <v-btn
        type="submit"
        color="primary"
        block
        :disabled="!canExport || !canGenerate"
        :loading="isGenerating"
      >
        {{ t("Generate") }}
      </v-btn>
    </v-form>
  </v-card>
</template>
