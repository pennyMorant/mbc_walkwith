<script setup lang="ts">
import { useMutation } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { changeAdminPassword } from "@/core/api/auth";
import { useI18n } from "@/core/i18n/i18n";
import AdminDialogActions from "@/core/ui/AdminDialogActions.vue";
import AdminDialogHeader from "@/core/ui/AdminDialogHeader.vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  changed: [];
}>();

const { t } = useI18n();
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordVisible = ref(false);

const passwordMismatch = computed(
  () =>
    confirmPassword.value.length > 0 &&
    newPassword.value !== confirmPassword.value
);
const canSubmit = computed(
  () =>
    currentPassword.value.length > 0 &&
    newPassword.value.length >= 8 &&
    confirmPassword.value.length >= 8 &&
    !passwordMismatch.value
);

const changePasswordMutation = useMutation({
  mutationFn: () =>
    changeAdminPassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    }),
  onSuccess: () => {
    emit("update:modelValue", false);
    emit("changed");
    resetForm();
  }
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm();
    }
  }
);

function close() {
  if (changePasswordMutation.isPending.value) {
    return;
  }
  emit("update:modelValue", false);
  resetForm();
}

function handleDialogModelUpdate(open: boolean) {
  if (!open) {
    close();
  }
}

function submit() {
  if (canSubmit.value && !changePasswordMutation.isPending.value) {
    changePasswordMutation.mutate();
  }
}

function resetForm() {
  currentPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  passwordVisible.value = false;
  changePasswordMutation.reset();
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="460"
    :persistent="changePasswordMutation.isPending.value"
    @update:model-value="handleDialogModelUpdate"
  >
    <v-card>
      <AdminDialogHeader
        :title="t('auth.changePassword')"
        :close-label="t('common.close')"
        icon="mdi-lock-reset"
        :close-disabled="changePasswordMutation.isPending.value"
        @close="close"
      />

      <v-card-text class="px-6 pt-5">
        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="currentPassword"
            :label="t('auth.currentPassword')"
            :type="passwordVisible ? 'text' : 'password'"
            autocomplete="current-password"
            density="comfortable"
            variant="outlined"
            :disabled="changePasswordMutation.isPending.value"
          />
          <v-text-field
            v-model="newPassword"
            :label="t('auth.newPassword')"
            :type="passwordVisible ? 'text' : 'password'"
            autocomplete="new-password"
            density="comfortable"
            variant="outlined"
            :hint="t('auth.passwordMinimum')"
            persistent-hint
            :disabled="changePasswordMutation.isPending.value"
          />
          <v-text-field
            v-model="confirmPassword"
            :label="t('auth.confirmPassword')"
            :type="passwordVisible ? 'text' : 'password'"
            autocomplete="new-password"
            density="comfortable"
            variant="outlined"
            :error-messages="passwordMismatch ? [t('auth.passwordMismatch')] : []"
            :disabled="changePasswordMutation.isPending.value"
          />

          <v-checkbox
            v-model="passwordVisible"
            :label="t('auth.showPassword')"
            density="compact"
            hide-details
            class="mt-n2"
            :disabled="changePasswordMutation.isPending.value"
          />

          <v-alert
            v-if="changePasswordMutation.error.value"
            type="error"
            variant="tonal"
            class="mt-4"
          >
            {{
              formatApiErrorMessage(
                changePasswordMutation.error.value,
                t("common.error")
              )
            }}
          </v-alert>
        </v-form>
      </v-card-text>

      <AdminDialogActions
        :cancel-label="t('common.cancel')"
        :confirm-label="t('common.save')"
        :loading="changePasswordMutation.isPending.value"
        :confirm-disabled="!canSubmit"
        @cancel="close"
        @confirm="submit"
      />
    </v-card>
  </v-dialog>
</template>
