<script setup lang="ts">
import type { AdminUser, AdminUserStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{
  users: AdminUser[];
  pending: boolean;
  errorMessage: string;
  statusColor: (status: AdminUserStatus) => string;
}>();
defineEmits<{ open: [user: AdminUser]; retry: [] }>();

const { t } = useI18n();
</script>

<template>
  <AdminDataState
    :pending="pending"
    :error-message="errorMessage"
    :empty="users.length === 0"
    :empty-title="t('users.empty')"
    empty-icon="mdi-account-off-outline"
    :retry-label="t('Retry')"
    @retry="$emit('retry')"
  >
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
    </div>
  </AdminDataState>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.admin-user-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.admin-user-record__main { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.admin-user-record__main span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
</style>
