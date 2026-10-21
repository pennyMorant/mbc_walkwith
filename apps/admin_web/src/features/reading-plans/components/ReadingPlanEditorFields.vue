<script setup lang="ts">
import type { ReadingPlanCreateRequest } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

const form = defineModel<ReadingPlanCreateRequest>({ required: true });
defineProps<{
  statusItems: unknown[];
  visibilityItems: unknown[];
  localeItems: Array<{ title: string; value: string }>;
  canManage: boolean;
  canSave: boolean;
  contentLocked: boolean;
  structureLocked: boolean;
  saving: boolean;
}>();
defineEmits<{ save: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-row dense>
    <v-col cols="12" md="6">
      <v-text-field v-model="form.title" :label="t('Title')" :disabled="!canManage || contentLocked" density="compact" variant="outlined" />
    </v-col>
    <v-col cols="12" md="3">
      <v-select v-model="form.status" :label="t('Status')" :items="statusItems" :disabled="!canManage" density="compact" variant="outlined" />
    </v-col>
    <v-col cols="12" md="3">
      <v-select v-model="form.visibility" :label="t('Visibility')" :items="visibilityItems" :disabled="!canManage || contentLocked || structureLocked" density="compact" variant="outlined" />
    </v-col>
    <v-col cols="12" md="3">
      <v-select v-model="form.locale" :label="t('Locale')" :items="localeItems" :disabled="!canManage || contentLocked || structureLocked" density="compact" variant="outlined" />
    </v-col>
    <v-col cols="12" md="3">
      <v-text-field v-model.number="form.durationDays" :label="t('Duration days')" :disabled="!canManage || contentLocked || structureLocked" type="number" density="compact" variant="outlined" />
    </v-col>
    <v-col cols="12" md="6">
      <v-textarea v-model="form.description" :label="t('Description')" :disabled="!canManage || contentLocked" rows="2" density="compact" variant="outlined" />
    </v-col>
  </v-row>
  <v-btn v-if="canManage" color="primary" :disabled="!canSave || saving" :loading="saving" @click="$emit('save')">
    {{ t("common.save") }}
  </v-btn>
</template>
