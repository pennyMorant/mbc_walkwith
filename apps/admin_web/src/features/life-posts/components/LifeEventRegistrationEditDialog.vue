<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";

type RegistrationEditDialog = {
  show: boolean;
  registrationId: string;
  attendeeName: string;
  partySize: number;
  note: string;
};

const props = defineProps<{
  dialog: RegistrationEditDialog;
  maxPartySize: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [];
}>();

const { t } = useI18n();
const canSave = computed(
  () =>
    Number.isInteger(props.dialog.partySize) &&
    props.dialog.partySize >= 1 &&
    props.dialog.partySize <= props.maxPartySize
);
</script>

<template>
  <v-dialog v-model="dialog.show" max-width="520">
    <v-card>
      <v-card-title>{{ t("Edit registration") }}</v-card-title>
      <v-card-text>
        <div class="text-body-2 text-medium-emphasis mb-3">
          {{ dialog.attendeeName }}
        </div>
        <v-number-input
          v-model="dialog.partySize"
          :label="t('Party size')"
          :min="1"
          :max="maxPartySize"
          density="comfortable"
          variant="outlined"
        />
        <v-textarea
          v-model="dialog.note"
          :label="t('Note')"
          rows="3"
          maxlength="500"
          counter
          density="comfortable"
          variant="outlined"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('close')">
          {{ t("Cancel") }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!canSave"
          :loading="loading"
          @click="emit('save')"
        >
          {{ t("Save") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
