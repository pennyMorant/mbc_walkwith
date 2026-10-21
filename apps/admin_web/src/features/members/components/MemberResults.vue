<script setup lang="ts">
import type { MemberListItem, MemberStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{
  members: MemberListItem[];
  pending: boolean;
  errorMessage: string;
  statusColor: (status: MemberStatus) => string;
}>();
defineEmits<{ open: [member: MemberListItem]; retry: [] }>();

const { t } = useI18n();
</script>

<template>
  <AdminDataState
    :pending="pending"
    :error-message="errorMessage"
    :empty="members.length === 0"
    :empty-title="t('No members match the current filters.')"
    empty-icon="mdi-account-off-outline"
    :retry-label="t('common.refresh')"
    @retry="$emit('retry')"
  >
    <v-table class="d-none d-md-block" density="comfortable" hover>
      <thead>
        <tr>
          <th>{{ t("Name") }}</th>
          <th>{{ t("Email") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Role") }}</th>
          <th>{{ t("Group") }}</th>
          <th>{{ t("Locale") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="member in members"
          :key="member.id"
          class="cursor-pointer"
          @click="$emit('open', member)"
        >
          <td class="font-weight-bold">{{ member.displayName }}</td>
          <td>{{ member.email }}</td>
          <td>
            <v-chip size="small" :color="statusColor(member.status)">
              {{ t(member.status) }}
            </v-chip>
          </td>
          <td>{{ member.roles.map((role) => t(role)).join(", ") }}</td>
          <td>{{ member.fellowshipGroupId || t("common.notSet") }}</td>
          <td>{{ member.appLocale }}</td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <button
        v-for="member in members"
        :key="member.id"
        class="member-record"
        type="button"
        @click="$emit('open', member)"
      >
        <span class="member-record__main">
          <strong>{{ member.displayName }}</strong>
          <span>{{ member.email }}</span>
          <span>{{ member.roles.map((role) => t(role)).join(", ") }}</span>
        </span>
        <v-chip size="small" :color="statusColor(member.status)">
          {{ t(member.status) }}
        </v-chip>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
    </div>
  </AdminDataState>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.member-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.member-record__main { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.member-record__main span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
</style>
