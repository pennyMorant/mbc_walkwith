<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

import type { MemberEditorForm } from "../member_workspace_models";

defineProps<{
  form: MemberEditorForm;
  disabled: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="text-subtitle-2 font-weight-bold mb-2">
    {{ t("Notifications") }}
  </div>
  <v-row dense class="mb-2">
    <v-col cols="12" sm="6">
      <v-checkbox
        v-model="form.weeklyBulletin"
        :label="t('Weekly bulletin')"
        density="compact"
        hide-details
        :disabled="disabled"
      />
      <v-checkbox
        v-model="form.sermonPublished"
        :label="t('Sermon published')"
        density="compact"
        hide-details
        :disabled="disabled"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-checkbox
        v-model="form.lifePostPublished"
        :label="t('Life post published')"
        density="compact"
        hide-details
        :disabled="disabled"
      />
      <v-checkbox
        v-model="form.prayerUpdates"
        :label="t('Prayer updates')"
        density="compact"
        hide-details
        :disabled="disabled"
      />
    </v-col>
  </v-row>
</template>
