<script setup lang="ts">
import type { AdminRole, AdminUser } from "@mbc/api-contracts";
import { computed, ref, watch } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminConfirmDialog from "@/core/ui/AdminConfirmDialog.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import {
  passwordsMatch,
  type AdminUserEditForm
} from "../admin_user_workspace_models";

const drawer = defineModel<boolean>({ required: true });
const props = defineProps<{
  user: AdminUser | null;
  form: AdminUserEditForm;
  roles: AdminRole[];
  canManage: boolean;
  canUpdate: boolean;
  canResetPassword: boolean;
  updatePending: boolean;
  resetPending: boolean;
  updateErrorMessage: string;
  resetErrorMessage: string;
  currentUserId: string | null;
}>();

const emit = defineEmits<{ save: []; resetPassword: [] }>();
const { optionItems, t } = useI18n();
const passwordVisible = ref(false);
const confirmReset = ref(false);
const busy = computed(() => props.updatePending || props.resetPending);
const drawerProxy = computed({
  get: () => drawer.value,
  set: (open: boolean) => {
    if (open || !busy.value) {
      drawer.value = open;
    }
  }
});
const editorDisabled = computed(() => !props.canManage || busy.value);
const passwordMismatch = computed(
  () => !passwordsMatch(props.form.password, props.form.confirmPassword)
);

watch(drawer, (open) => {
  if (!open) {
    passwordVisible.value = false;
    confirmReset.value = false;
  }
});

function requestPasswordReset() {
  if (props.canResetPassword && !busy.value) {
    confirmReset.value = true;
  }
}

function confirmPasswordReset() {
  confirmReset.value = false;
  emit("resetPassword");
}
</script>

<template>
  <AdminResponsiveDrawer v-model="drawerProxy" :desktop-width="480">
    <div v-if="user" class="pa-5">
      <div class="d-flex align-start justify-space-between ga-3">
        <div class="min-width-0">
          <div class="d-flex align-center flex-wrap ga-2">
            <span class="text-h6 font-weight-bold text-truncate">
              {{ user.name }}
            </span>
            <v-chip
              v-if="user.id === currentUserId"
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ t("users.currentAccount") }}
            </v-chip>
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1 text-truncate">
            {{ user.email }}
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          :aria-label="t('common.close')"
          :disabled="busy"
          @click="drawerProxy = false"
        />
      </div>

      <v-alert v-if="!canManage" type="info" variant="tonal" class="mt-5">
        {{ t("users.readOnly") }}
      </v-alert>

      <v-form class="mt-6" @submit.prevent="emit('save')">
        <v-text-field
          v-model="form.name"
          :label="t('Name')"
          density="comfortable"
          variant="outlined"
          :disabled="editorDisabled"
        />
        <v-select
          v-model="form.role"
          :label="t('Role')"
          :items="optionItems(roles)"
          density="comfortable"
          variant="outlined"
          :disabled="editorDisabled"
        />
        <v-select
          v-model="form.status"
          :label="t('Status')"
          :items="optionItems(['active', 'disabled'])"
          density="comfortable"
          variant="outlined"
          :disabled="editorDisabled"
        />
        <v-alert
          v-if="updateErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ updateErrorMessage }}
        </v-alert>
        <v-btn
          v-if="canManage"
          type="submit"
          color="primary"
          block
          :loading="updatePending"
          :disabled="!canUpdate || busy"
        >
          {{ t("users.saveAction") }}
        </v-btn>
      </v-form>

      <template v-if="canManage">
        <v-divider class="my-6" />
        <div class="text-subtitle-2 font-weight-bold">
          {{ t("users.passwordResetTitle") }}
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ t("users.passwordResetHelp") }}
        </div>
        <v-text-field
          v-model="form.password"
          :label="t('New password')"
          :type="passwordVisible ? 'text' : 'password'"
          autocomplete="new-password"
          density="comfortable"
          variant="outlined"
          class="mt-4"
          :hint="t('auth.passwordMinimum')"
          persistent-hint
          :disabled="busy"
        />
        <v-text-field
          v-model="form.confirmPassword"
          :label="t('users.confirmPassword')"
          :type="passwordVisible ? 'text' : 'password'"
          autocomplete="new-password"
          density="comfortable"
          variant="outlined"
          :error-messages="passwordMismatch ? [t('auth.passwordMismatch')] : []"
          :disabled="busy"
        />
        <v-checkbox
          v-model="passwordVisible"
          :label="t('auth.showPassword')"
          density="compact"
          hide-details
          class="mt-n2 mb-4"
          :disabled="busy"
        />
        <v-alert
          v-if="resetErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ resetErrorMessage }}
        </v-alert>
        <v-btn
          color="warning"
          variant="tonal"
          block
          :disabled="!canResetPassword || busy"
          :loading="resetPending"
          @click="requestPasswordReset"
        >
          {{ t("users.passwordResetAction") }}
        </v-btn>
      </template>
    </div>
  </AdminResponsiveDrawer>

  <AdminConfirmDialog
    v-model="confirmReset"
    :title="t('users.passwordResetConfirmTitle')"
    :message="t('users.passwordResetConfirmBody')"
    :confirm-label="t('users.passwordResetAction')"
    :cancel-label="t('common.cancel')"
    color="warning"
    icon="mdi-lock-reset"
    :loading="resetPending"
    @confirm="confirmPasswordReset"
  />
</template>

<style scoped>
.min-width-0 {
  min-width: 0;
}
</style>
