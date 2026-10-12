<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";

type RegistrationCreateDialog = {
  show: boolean;
  attendeeName: string;
  attendeeEmail: string;
  partySize: number;
  note: string;
};

const props = defineProps<{
  dialog: RegistrationCreateDialog;
  maxPartySize: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [];
}>();

const { t } = useI18n();
const canSave = computed(() => {
  const email = props.dialog.attendeeEmail.trim();
  return (
    props.dialog.attendeeName.trim().length > 0 &&
    Number.isInteger(props.dialog.partySize) &&
    props.dialog.partySize >= 1 &&
    props.dialog.partySize <= props.maxPartySize &&
    (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  );
});
</script>

<template>
  <v-dialog v-model="dialog.show" max-width="520">
    <v-card>
      <v-card-title>{{ t("Add registration") }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="dialog.attendeeName"
          :label="t('Name')"
          density="comfortable"
          variant="outlined"
        />
        <v-text-field
          v-model="dialog.attendeeEmail"
          :label="t('Email')"
          type="email"
          density="comfortable"
          variant="outlined"
        />
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
          {{ t("Add") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
