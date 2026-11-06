<script setup lang="ts">
import type { MemberListItem, MemberStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";

defineProps<{
  members: MemberListItem[];
  pending: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  statusColor: (status: MemberStatus) => string;
}>();
defineEmits<{ open: [member: MemberListItem]; retry: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-alert
    v-if="refreshErrorMessage"
    class="ma-4 mb-0"
    type="warning"
    variant="tonal"
    density="compact"
  >
    <div class="d-flex align-center justify-space-between ga-3">
      <span>{{ refreshErrorMessage }}</span>
      <v-btn size="small" variant="text" @click="$emit('retry')">
        {{ t("common.refresh") }}
      </v-btn>
    </div>
  </v-alert>
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
      <AdminMobileRecord
        v-for="member in members"
        :key="member.id"
        @activate="$emit('open', member)"
      >
        <strong>{{ member.displayName }}</strong>
        <span>{{ member.email }}</span>
        <span>{{ member.roles.map((role) => t(role)).join(", ") }}</span>
        <template #trailing>
          <v-chip size="small" :color="statusColor(member.status)">
            {{ t(member.status) }}
          </v-chip>
        </template>
      </AdminMobileRecord>
    </div>
  </AdminDataState>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
