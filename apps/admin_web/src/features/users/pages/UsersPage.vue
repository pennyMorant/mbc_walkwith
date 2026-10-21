<script setup lang="ts">
import type {
  AdminCreateUserRequest,
  AdminResetPasswordRequest,
  AdminRole,
  AdminUpdateUserRequest,
  AdminUser,
  AdminUserStatus
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { requireSelected } from "@/core/actions/action_guard";
import {
  createAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUser
} from "@/core/api/admin_users";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();
const selectedUser = ref<AdminUser | null>(null);
const drawer = ref(false);

const createForm = reactive({
  email: "",
  name: "",
  role: "viewer" as AdminRole,
  password: ""
});

const editForm = reactive({
  name: "",
  role: "viewer" as AdminRole,
  status: "active" as AdminUserStatus,
  password: ""
});

const roleItems: AdminRole[] = [
  "owner",
  "admin",
  "pastor",
  "content_editor",
  "finance",
  "viewer"
];

const usersQuery = useQuery({
  queryKey: ["admin-users"],
  queryFn: listAdminUsers
});

const createMutation = useMutation({
  mutationFn: () => {
    if (!canManage.value || !canCreate.value) {
      throw new Error(t("User manage access required"));
    }
    return createAdminUser(buildCreateUserPayload());
  },
  onSuccess: async () => {
    createForm.email = "";
    createForm.name = "";
    createForm.role = "viewer";
    createForm.password = "";
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }
});

const updateMutation = useMutation({
  mutationFn: () => {
    const user = requireSelected(
      selectedUser.value,
      t("No admin user selected.")
    );
    if (!canManage.value || !canUpdate.value) {
      throw new Error(t("User manage access required"));
    }
    return updateAdminUser(user.id, buildUpdateUserPayload());
  },
  onSuccess: async (user) => {
    openUser(user);
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }
});

const resetPasswordMutation = useMutation({
  mutationFn: () => {
    const user = requireSelected(
      selectedUser.value,
      t("No admin user selected.")
    );
    if (!canManage.value || !canResetPassword.value) {
      throw new Error(t("User manage access required"));
    }
    return resetAdminUserPassword(user.id, buildResetPasswordPayload());
  },
  onSuccess: async (user) => {
    editForm.password = "";
    openUser(user);
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }
});

const users = computed(() => usersQuery.data.value ?? []);
const canManage = computed(() => authStore.can("users:manage"));
const canCreate = computed(
  () =>
    createForm.email.trim().length > 0 &&
    createForm.name.trim().length > 0 &&
    createForm.password.length >= 8
);
const canUpdate = computed(() => editForm.name.trim().length > 0);
const canResetPassword = computed(() => editForm.password.length >= 8);

function openUser(user: AdminUser) {
  selectedUser.value = user;
  editForm.name = user.name;
  editForm.role = user.role;
  editForm.status = user.status;
  editForm.password = "";
  drawer.value = true;
}

function statusColor(status: AdminUserStatus) {
  return status === "active" ? "success" : "error";
}

function buildCreateUserPayload(): AdminCreateUserRequest {
  return {
    email: createForm.email.trim(),
    name: createForm.name.trim(),
    role: createForm.role,
    password: createForm.password
  };
}

function buildUpdateUserPayload(): AdminUpdateUserRequest {
  return {
    name: editForm.name.trim(),
    role: editForm.role,
    status: editForm.status
  };
}

function buildResetPasswordPayload(): AdminResetPasswordRequest {
  return {
    password: editForm.password
  };
}

function createUser() {
  if (!canManage.value || !canCreate.value || createMutation.isPending.value) {
    return;
  }
  createMutation.mutate();
}

function saveUser() {
  if (!canManage.value || !canUpdate.value || updateMutation.isPending.value) {
    return;
  }
  updateMutation.mutate();
}

function resetUserPassword() {
  if (
    !canManage.value ||
    !canResetPassword.value ||
    resetPasswordMutation.isPending.value
  ) {
    return;
  }
  resetPasswordMutation.mutate();
}
</script>

<template>
  <div>
    <AdminPageHeader :title="t('Users and Roles')" :subtitle="t('users.createSubtitle')">
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
        <v-card v-if="canManage" class="pa-5">
          <div class="text-subtitle-1 font-weight-bold">
            {{ t("Create admin user") }}
          </div>
          <v-form class="mt-5" @submit.prevent="createUser">
            <v-text-field
              v-model="createForm.email"
              :label="t('Email')"
              type="email"
              density="comfortable"
              variant="outlined"
            />
            <v-text-field
              v-model="createForm.name"
              :label="t('Name')"
              density="comfortable"
              variant="outlined"
            />
            <v-select
              v-model="createForm.role"
              :label="t('Role')"
              :items="optionItems(roleItems)"
              density="comfortable"
              variant="outlined"
            />
            <v-text-field
              v-model="createForm.password"
              :label="t('Temporary password')"
              type="password"
              density="comfortable"
              variant="outlined"
            />
            <v-alert
              v-if="createMutation.error.value"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{
                formatApiErrorMessage(
                  createMutation.error.value,
                  t("common.error")
                )
              }}
            </v-alert>
            <v-btn
              type="submit"
              color="primary"
              block
              :disabled="!canCreate || createMutation.isPending.value"
              :loading="createMutation.isPending.value"
            >
              {{ t("Create user") }}
            </v-btn>
          </v-form>
        </v-card>
        <v-alert v-else type="info" variant="tonal">
          {{ t("users.readOnly") }}
        </v-alert>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card>
          <div class="pa-5 d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ t("Admin users") }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t("users.createHelp") }}
              </div>
            </div>
            <v-chip>{{ users.length }}</v-chip>
          </div>
          <v-divider />
          <v-progress-linear
            v-if="usersQuery.isPending.value"
            indeterminate
            color="primary"
          />
          <v-alert
            v-else-if="usersQuery.error.value"
            type="error"
            variant="tonal"
            class="ma-4"
          >
            {{ formatApiErrorMessage(usersQuery.error.value, t("common.error")) }}
          </v-alert>
          <v-table v-else density="comfortable">
            <thead>
              <tr>
                <th>{{ t("Name") }}</th>
                <th>{{ t("Email") }}</th>
                <th>{{ t("Role") }}</th>
                <th>{{ t("Status") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.id"
                class="cursor-pointer"
                @click="openUser(user)"
              >
                <td class="font-weight-bold">{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ t(user.role) }}</td>
                <td>
                  <v-chip size="small" :color="statusColor(user.status)">
                    {{ t(user.status) }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <AdminResponsiveDrawer
      v-model="drawer"
      :desktop-width="440"
    >
      <div v-if="selectedUser" class="pa-5">
        <div class="text-h6 font-weight-bold">{{ selectedUser.name }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ selectedUser.email }}
        </div>

        <v-form class="mt-6" @submit.prevent="saveUser">
          <v-text-field
            v-model="editForm.name"
            :label="t('Name')"
            density="comfortable"
            variant="outlined"
          />
          <v-select
            v-model="editForm.role"
            :label="t('Role')"
            :items="optionItems(roleItems)"
            density="comfortable"
            variant="outlined"
          />
          <v-select
            v-model="editForm.status"
            :label="t('Status')"
            :items="optionItems(['active', 'disabled'])"
            density="comfortable"
            variant="outlined"
          />
          <v-alert
            v-if="updateMutation.error.value"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{
              formatApiErrorMessage(updateMutation.error.value, t("common.error"))
            }}
          </v-alert>
          <v-btn
            type="submit"
            color="primary"
            block
            :loading="updateMutation.isPending.value"
            :disabled="!canManage || !canUpdate || updateMutation.isPending.value"
          >
            {{ t("Save user") }}
          </v-btn>
        </v-form>

        <v-divider class="my-6" />
        <div class="text-subtitle-2 font-weight-bold">
          {{ t("Reset password") }}
        </div>
        <v-text-field
          v-model="editForm.password"
          :label="t('New password')"
          type="password"
          density="comfortable"
          variant="outlined"
          class="mt-4"
        />
        <v-alert
          v-if="resetPasswordMutation.error.value"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{
            formatApiErrorMessage(
              resetPasswordMutation.error.value,
              t("common.error")
            )
          }}
        </v-alert>
        <v-btn
          color="warning"
          variant="tonal"
          block
          :disabled="!canResetPassword || resetPasswordMutation.isPending.value"
          :loading="resetPasswordMutation.isPending.value"
          v-if="canManage"
          @click="resetUserPassword"
        >
          {{ t("Reset password") }}
        </v-btn>
      </div>
    </AdminResponsiveDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
