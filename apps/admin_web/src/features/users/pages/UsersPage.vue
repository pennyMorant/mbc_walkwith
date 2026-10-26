<script setup lang="ts">
import type {
  AdminCreateUserRequest,
  AdminResetPasswordRequest,
  AdminUpdateUserRequest,
  AdminUser,
  AdminUserStatus
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUser
} from "@/core/api/admin_users";
import { getAdminSession } from "@/core/api/auth";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import {
  adminRoleItems,
  adminUserCreatePayloadFromForm,
  adminUserResetPasswordPayloadFromForm,
  adminUserUpdatePayloadFromForm,
  createAdminUserCreateForm,
  createAdminUserEditForm,
  isValidAdminEmail,
  loadAdminUserEditForm,
  passwordsMatch,
  resetAdminUserCreateForm,
  resetAdminUserPasswordForm
} from "../admin_user_workspace_models";
import AdminUserCreateCard from "../components/AdminUserCreateCard.vue";
import AdminUserEditorDrawer from "../components/AdminUserEditorDrawer.vue";
import AdminUserResults from "../components/AdminUserResults.vue";

type UserCommandContext = {
  userId: string;
  contextVersion: number;
};

type CreateUserIntent = {
  payload: AdminCreateUserRequest;
  contextVersion: number;
};

type UpdateUserIntent = UserCommandContext & {
  payload: AdminUpdateUserRequest;
};

type ResetPasswordIntent = UserCommandContext & {
  payload: AdminResetPasswordRequest;
};

const queryClient = useQueryClient();
const router = useRouter();
const authStore = useAdminAuthStore();
const { t } = useI18n();
const selectedUser = ref<AdminUser | null>(null);
const drawer = ref(false);
const createForm = reactive(createAdminUserCreateForm());
const editForm = reactive(createAdminUserEditForm());
const createErrorMessage = ref("");
const updateErrorMessage = ref("");
const resetErrorMessage = ref("");
const successMessage = ref("");
const successVisible = ref(false);
let createContextVersion = 0;
let editorContextVersion = 0;

const usersQuery = useQuery({
  queryKey: ["admin-users"],
  queryFn: listAdminUsers
});

const createMutation = useMutation({
  onMutate: (intent: CreateUserIntent) => {
    createErrorMessage.value = "";
    return intent;
  },
  mutationFn: (intent: CreateUserIntent) => createAdminUser(intent.payload),
  onSuccess: async (_user, _variables, context) => {
    if (context?.contextVersion === createContextVersion) {
      resetAdminUserCreateForm(createForm);
      showSuccess(t("users.userCreated"));
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  },
  onError: (error, _variables, context) => {
    if (context?.contextVersion === createContextVersion) {
      createErrorMessage.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }
});

const updateMutation = useMutation({
  onMutate: (intent: UpdateUserIntent) => {
    updateErrorMessage.value = "";
    return intent;
  },
  mutationFn: (intent: UpdateUserIntent) =>
    updateAdminUser(intent.userId, intent.payload),
  onSuccess: async (user, _variables, context) => {
    if (isCurrentEditorContext(context)) {
      selectedUser.value = user;
      loadAdminUserEditForm(editForm, user);
      showSuccess(t("users.userUpdated"));
    }
    void syncCurrentAdminSession(user);
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  },
  onError: (error, _variables, context) => {
    if (isCurrentEditorContext(context)) {
      updateErrorMessage.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }
});

const resetPasswordMutation = useMutation({
  onMutate: (intent: ResetPasswordIntent) => {
    resetErrorMessage.value = "";
    return intent;
  },
  mutationFn: (intent: ResetPasswordIntent) =>
    resetAdminUserPassword(intent.userId, intent.payload),
  onSuccess: async (user, _variables, context) => {
    if (isCurrentEditorContext(context)) {
      selectedUser.value = user;
      resetAdminUserPasswordForm(editForm);
      showSuccess(t("users.passwordResetSuccess"));
    }
    if (user.id === authStore.user?.id) {
      authStore.clearSession();
      await router.replace({ name: "login" });
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  },
  onError: (error, _variables, context) => {
    if (isCurrentEditorContext(context)) {
      resetErrorMessage.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }
});

const users = computed(() => usersQuery.data.value ?? []);
const canManage = computed(() => authStore.can("users:manage"));
const canCreate = computed(
  () =>
    canManage.value &&
    isValidAdminEmail(createForm.email) &&
    createForm.name.trim().length > 0 &&
    createForm.password.length >= 8 &&
    createForm.confirmPassword.length >= 8 &&
    passwordsMatch(createForm.password, createForm.confirmPassword)
);
const canUpdate = computed(
  () => canManage.value && editForm.name.trim().length > 0
);
const canResetPassword = computed(
  () =>
    canManage.value &&
    editForm.password.length >= 8 &&
    editForm.confirmPassword.length >= 8 &&
    passwordsMatch(editForm.password, editForm.confirmPassword)
);
const listErrorMessage = computed(() =>
  usersQuery.error.value
    ? formatApiErrorMessage(usersQuery.error.value, t("common.error"))
    : ""
);

function openUser(user: AdminUser) {
  beginEditorContext();
  selectedUser.value = user;
  loadAdminUserEditForm(editForm, user);
  drawer.value = true;
}

function beginEditorContext() {
  editorContextVersion += 1;
  updateErrorMessage.value = "";
  resetErrorMessage.value = "";
  updateMutation.reset();
  resetPasswordMutation.reset();
}

function isCurrentEditorContext(context: UserCommandContext | undefined) {
  return Boolean(
    context &&
      context.contextVersion === editorContextVersion &&
      context.userId === selectedUser.value?.id
  );
}

function createUser() {
  if (!canCreate.value || createMutation.isPending.value) {
    return;
  }
  createContextVersion += 1;
  createMutation.mutate({
    payload: adminUserCreatePayloadFromForm(createForm),
    contextVersion: createContextVersion
  });
}

function saveUser() {
  const user = selectedUser.value;
  if (
    !user ||
    !canUpdate.value ||
    updateMutation.isPending.value ||
    resetPasswordMutation.isPending.value
  ) {
    return;
  }
  updateMutation.mutate({
    userId: user.id,
    contextVersion: editorContextVersion,
    payload: adminUserUpdatePayloadFromForm(editForm)
  });
}

function resetUserPassword() {
  const user = selectedUser.value;
  if (
    !user ||
    !canResetPassword.value ||
    updateMutation.isPending.value ||
    resetPasswordMutation.isPending.value
  ) {
    return;
  }
  resetPasswordMutation.mutate({
    userId: user.id,
    contextVersion: editorContextVersion,
    payload: adminUserResetPasswordPayloadFromForm(editForm)
  });
}

async function syncCurrentAdminSession(user: AdminUser) {
  if (user.id !== authStore.user?.id) {
    return;
  }
  if (user.status !== "active") {
    authStore.clearSession();
    await router.replace({ name: "login" });
    return;
  }
  try {
    const session = await getAdminSession();
    authStore.setCurrentSession(session);
    if (!session.permissions.includes("users:read")) {
      drawer.value = false;
      await router.replace({ name: "dashboard" });
    }
  } catch {
    authStore.clearSession();
    await router.replace({ name: "login" });
  }
}

function showSuccess(message: string) {
  successMessage.value = message;
  successVisible.value = true;
}

function statusColor(status: AdminUserStatus) {
  return status === "active" ? "success" : "error";
}

watch(drawer, (open) => {
  if (!open) {
    editorContextVersion += 1;
    updateErrorMessage.value = "";
    resetErrorMessage.value = "";
  }
});
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('users.pageTitle')"
      :subtitle="t('users.createSubtitle')"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="usersQuery.isFetching.value"
          @click="usersQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-row class="mt-6" dense>
      <v-col cols="12" lg="4">
        <AdminUserCreateCard
          v-if="canManage"
          :form="createForm"
          :roles="adminRoleItems"
          :can-create="canCreate"
          :pending="createMutation.isPending.value"
          :error-message="createErrorMessage"
          @create="createUser"
        />
        <v-alert v-else type="info" variant="tonal">
          {{ t("users.readOnly") }}
        </v-alert>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card>
          <div class="pa-5 d-flex align-center justify-space-between ga-3">
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ t("users.listTitle") }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t("users.listHelp") }}
              </div>
            </div>
            <v-chip>{{ users.length }}</v-chip>
          </div>
          <v-divider />
          <AdminUserResults
            :users="users"
            :pending="usersQuery.isPending.value"
            :error-message="listErrorMessage"
            :status-color="statusColor"
            @open="openUser"
            @retry="usersQuery.refetch()"
          />
        </v-card>
      </v-col>
    </v-row>

    <AdminUserEditorDrawer
      v-model="drawer"
      :user="selectedUser"
      :form="editForm"
      :roles="adminRoleItems"
      :can-manage="canManage"
      :can-update="canUpdate"
      :can-reset-password="canResetPassword"
      :update-pending="updateMutation.isPending.value"
      :reset-pending="resetPasswordMutation.isPending.value"
      :update-error-message="updateErrorMessage"
      :reset-error-message="resetErrorMessage"
      :current-user-id="authStore.user?.id ?? null"
      @save="saveUser"
      @reset-password="resetUserPassword"
    />

    <v-snackbar v-model="successVisible" color="success" timeout="2600">
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>
