<script setup lang="ts">
import type { AdminUser, AdminUserStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";

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
    <AdminResponsiveTable>
      <template #desktop>
    <v-table density="comfortable" hover>
      <thead>
        <tr>
          <th>{{ t("Name") }}</th>
          <th>{{ t("Email") }}</th>
          <th>{{ t("Role") }}</th>
          <th>{{ t("Status") }}</th>
        </tr>
      </thead>
      <tbody>
        <AdminTableActionRow
          v-for="user in users"
          :key="user.id"
          @activate="$emit('open', user)"
        >
          <td class="font-weight-bold">{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ t(user.role) }}</td>
          <td>
            <v-chip size="small" :color="statusColor(user.status)">
              {{ t(user.status) }}
            </v-chip>
          </td>
        </AdminTableActionRow>
      </tbody>
    </v-table>

      </template>
      <template #mobile>
    <div>
      <AdminMobileRecord
        v-for="user in users"
        :key="user.id"
        @activate="$emit('open', user)"
      >
        <strong>{{ user.name }}</strong>
        <span>{{ user.email }}</span>
        <span>{{ t(user.role) }}</span>
        <template #trailing>
          <v-chip size="small" :color="statusColor(user.status)">
            {{ t(user.status) }}
          </v-chip>
        </template>
      </AdminMobileRecord>
    </div>
      </template>
    </AdminResponsiveTable>
  </AdminDataState>
</template>
