<script setup lang="ts">
import type { AdminUser, AdminUserStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  users: AdminUser[];
  pending: boolean;
  errorMessage: string;
  statusColor: (status: AdminUserStatus) => string;
}>();
defineEmits<{ open: [user: AdminUser] }>();

const { t } = useI18n();
</script>

<template>
  <v-progress-linear v-if="pending" indeterminate color="primary" />
  <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="ma-4">
    {{ errorMessage }}
  </v-alert>
  <template v-else>
    <v-table class="d-none d-md-block" density="comfortable" hover>
      <thead>
        <tr>
          <th>{{ t("Name") }}</th>
          <th>{{ t("Email") }}</th>
          <th>{{ t("Role") }}</th>
          <th>{{ t("Status") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="users.length === 0">
          <td colspan="4" class="text-center text-medium-emphasis py-8">
            {{ t("users.empty") }}
          </td>
        </tr>
        <tr
          v-for="user in users"
          :key="user.id"
          class="cursor-pointer"
          @click="$emit('open', user)"
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

    <div class="d-md-none">
      <button
        v-for="user in users"
        :key="user.id"
        class="admin-user-record"
        type="button"
        @click="$emit('open', user)"
      >
        <span class="admin-user-record__main">
          <strong>{{ user.name }}</strong>
          <span>{{ user.email }}</span>
          <span>{{ t(user.role) }}</span>
        </span>
        <v-chip size="small" :color="statusColor(user.status)">
          {{ t(user.status) }}
        </v-chip>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
      <div v-if="users.length === 0" class="admin-user-record-empty">
        {{ t("users.empty") }}
      </div>
    </div>
  </template>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.admin-user-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.admin-user-record__main { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.admin-user-record__main span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.admin-user-record-empty { padding: 28px 16px; color: rgba(var(--v-theme-on-surface), 0.62); text-align: center; }
</style>
