<script setup lang="ts">
import type { ReadingPlanDay } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";

type DayForm = {
  dayNumber: number;
  title: string;
  description: string;
  bookId: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  referenceLabel: string;
};

defineProps<{
  canManage: boolean;
  canUpsertDay: boolean;
  commandErrorMessage: string;
  days: ReadingPlanDay[];
  dayForm: DayForm;
  errorMessage: string;
  hasSelectedPlan: boolean;
  loading: boolean;
  pending: boolean;
  refreshErrorMessage: string;
  saving: boolean;
}>();

defineEmits<{
  retry: [];
  saveDay: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="mt-4">
    <AdminRefreshAlert
      class="mb-4"
      :message="refreshErrorMessage"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    />
    <v-alert
      v-if="commandErrorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ commandErrorMessage }}
    </v-alert>
    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="false"
      empty-title=""
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      <v-list density="compact" class="border rounded">
      <v-list-item v-if="!hasSelectedPlan">
        {{ t("No reading plan selected.") }}
      </v-list-item>
      <v-list-item v-else-if="!loading && days.length === 0">
        {{ t("No plan days yet.") }}
      </v-list-item>
      <v-list-item v-for="day in days" :key="day.id">
        <v-list-item-title>
          {{ t("Day") }} {{ day.dayNumber }} ·
          {{ day.title || t("common.notSet") }}
        </v-list-item-title>
        <v-list-item-subtitle>
          <span
            v-for="reference in day.references"
            :key="`${reference.bookId}-${reference.chapter}-${reference.startVerse}`"
          >
            {{
              reference.referenceLabel ||
              `${reference.bookId} ${reference.chapter}:${reference.startVerse}-${reference.endVerse}`
            }}
          </span>
        </v-list-item-subtitle>
      </v-list-item>
      </v-list>

      <v-row v-if="canManage && hasSelectedPlan" class="mt-4" dense>
      <v-col cols="6" md="2">
        <v-text-field
          v-model.number="dayForm.dayNumber"
          :label="t('Day')"
          :disabled="saving"
          type="number"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="6" md="2">
        <v-text-field
          v-model="dayForm.bookId"
          :label="t('Book ID')"
          :disabled="saving"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="4" md="2">
        <v-text-field
          v-model.number="dayForm.chapter"
          :label="t('Chapter')"
          :disabled="saving"
          type="number"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="4" md="2">
        <v-text-field
          v-model.number="dayForm.startVerse"
          :label="t('Start verse')"
          :disabled="saving"
          type="number"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="4" md="2">
        <v-text-field
          v-model.number="dayForm.endVerse"
          :label="t('End verse')"
          :disabled="saving"
          type="number"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn
          block
          color="primary"
          :disabled="!canUpsertDay || saving"
          :loading="saving"
          @click="$emit('saveDay')"
        >
          {{ t("Save day") }}
        </v-btn>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="dayForm.title"
          :label="t('Day title')"
          :disabled="saving"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="dayForm.referenceLabel"
          :label="t('Reference label')"
          :disabled="saving"
          density="compact"
          variant="outlined"
        />
      </v-col>
      </v-row>
    </AdminDataState>
  </div>
</template>
