<script setup lang="ts">
import type { AdminRole } from "@mbc/api-contracts";
import { computed, ref, watch } from "vue";

import { useI18n } from "@/core/i18n/i18n";

import {
  isValidAdminEmail,
  passwordsMatch,
  type AdminUserCreateForm
} from "../admin_user_workspace_models";

const props = defineProps<{
  form: AdminUserCreateForm;
  roles: AdminRole[];
  canCreate: boolean;
  pending: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{ create: [] }>();
const { optionItems, t } = useI18n();
const passwordVisible = ref(false);
const emailTouched = ref(false);
const emailValid = computed(() => isValidAdminEmail(props.form.email));
const passwordMismatch = computed(
  () => !passwordsMatch(props.form.password, props.form.confirmPassword)
);

watch(
  () => props.pending,
  (pending, wasPending) => {
    if (wasPending && !pending && !props.form.email) {
      emailTouched.value = false;
      passwordVisible.value = false;
    }
  }
);
</script>

<template>
  <v-card class="pa-5">
    <div class="text-subtitle-1 font-weight-bold">
      {{ t("users.createTitle") }}
    </div>
    <div class="text-body-2 text-medium-emphasis mt-1">
      {{ t("users.createHelp") }}
    </div>

    <v-form class="mt-5" @submit.prevent="emit('create')">
      <v-text-field
        v-model="form.email"
        :label="t('Email')"
        type="email"
        autocomplete="off"
        density="comfortable"
        variant="outlined"
        :disabled="pending"
        :error-messages="emailTouched && !emailValid ? [t('auth.invalidEmail')] : []"
        @blur="emailTouched = true"
      />
      <v-text-field
        v-model="form.name"
        :label="t('Name')"
        autocomplete="off"
        density="comfortable"
        variant="outlined"
        :disabled="pending"
      />
      <v-select
        v-model="form.role"
        :label="t('Role')"
        :items="optionItems(roles)"
        density="comfortable"
        variant="outlined"
        :disabled="pending"
      />
      <v-text-field
        v-model="form.password"
        :label="t('Temporary password')"
        :type="passwordVisible ? 'text' : 'password'"
        autocomplete="new-password"
        density="comfortable"
        variant="outlined"
        :hint="t('auth.passwordMinimum')"
        persistent-hint
        :disabled="pending"
      />
      <v-text-field
        v-model="form.confirmPassword"
        :label="t('users.confirmPassword')"
        :type="passwordVisible ? 'text' : 'password'"
        autocomplete="new-password"
        density="comfortable"
        variant="outlined"
        :error-messages="passwordMismatch ? [t('auth.passwordMismatch')] : []"
        :disabled="pending"
      />
      <v-checkbox
        v-model="passwordVisible"
        :label="t('auth.showPassword')"
        density="compact"
        hide-details
        class="mt-n2 mb-4"
        :disabled="pending"
      />

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>
      <v-btn
        type="submit"
        color="primary"
        block
        :disabled="!canCreate || pending"
        :loading="pending"
      >
        {{ t("users.createAction") }}
      </v-btn>
    </v-form>
  </v-card>
</template>
