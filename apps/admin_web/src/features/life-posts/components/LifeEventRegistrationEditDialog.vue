<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminDialogActions from "@/core/ui/AdminDialogActions.vue";
import AdminDialogHeader from "@/core/ui/AdminDialogHeader.vue";

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
  <v-dialog v-model="dialog.show" max-width="520" :persistent="loading">
    <v-card>
      <AdminDialogHeader
        :title="t('Edit registration')"
        :subtitle="dialog.attendeeName"
        :close-label="t('common.close')"
        icon="mdi-account-edit-outline"
        :close-disabled="loading"
        @close="emit('close')"
      />
      <v-card-text>
        <v-number-input
          v-model="dialog.partySize"
          :label="t('Party size')"
          :min="1"
          :max="maxPartySize"
          density="comfortable"
          variant="outlined"
          :disabled="loading"
        />
        <v-textarea
          v-model="dialog.note"
          :label="t('Note')"
          rows="3"
          maxlength="500"
          counter
          density="comfortable"
          variant="outlined"
          :disabled="loading"
        />
      </v-card-text>
      <AdminDialogActions
        :cancel-label="t('Cancel')"
        :confirm-label="t('Save')"
        :loading="loading"
        :confirm-disabled="!canSave"
        @cancel="emit('close')"
        @confirm="emit('save')"
      />
    </v-card>
  </v-dialog>
</template>
