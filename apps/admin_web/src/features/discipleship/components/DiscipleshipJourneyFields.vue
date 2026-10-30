<script setup lang="ts">
import type { DiscipleshipJourneyCreateRequest } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  canManage: boolean;
  canSave: boolean;
  form: DiscipleshipJourneyCreateRequest;
  saving: boolean;
  statusItems: unknown[];
}>();
defineEmits<{ save: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-row dense>
    <v-col cols="12" md="8">
      <v-text-field
        v-model="form.title"
        :disabled="!canManage || saving"
        :label="t('Title')"
        density="compact"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-select
        v-model="form.status"
        :disabled="!canManage || saving"
        :items="statusItems"
        :label="t('Status')"
        density="compact"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12">
      <v-textarea
        v-model="form.description"
        :disabled="!canManage || saving"
        :label="t('Description')"
        density="compact"
        rows="3"
        variant="outlined"
      />
    </v-col>
  </v-row>
  <div class="d-flex justify-end">
    <v-btn
      v-if="canManage"
      color="primary"
      :disabled="!canSave || saving"
      :loading="saving"
      @click="$emit('save')"
    >
      {{ t("common.save") }}
    </v-btn>
  </div>
</template>
