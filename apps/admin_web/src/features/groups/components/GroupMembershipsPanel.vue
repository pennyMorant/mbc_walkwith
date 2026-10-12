<script setup lang="ts">
import type {
  GroupMembership,
  GroupMembershipStatus
} from "@mbc/api-contracts";

import { groupMembershipStatusOptions } from "@/core/api/groups";
import { useI18n } from "@/core/i18n/i18n";
import { formatGroupDateTime } from "../group_presenters";

const status = defineModel<GroupMembershipStatus | "">("status", {
  required: true
});
const query = defineModel<string>("query", { required: true });

defineProps<{
  memberships: GroupMembership[];
  pending: boolean;
  updatePending: boolean;
  canManage: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  updateStatus: [membership: GroupMembership, status: GroupMembershipStatus];
}>();

const { locale, optionItems, t } = useI18n();

function updateStatus(
  membership: GroupMembership,
  nextStatus: GroupMembershipStatus | null
) {
  if (nextStatus && nextStatus !== membership.status) {
    emit("updateStatus", membership, nextStatus);
  }
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-md-row ga-2 mb-3">
      <v-text-field
        v-model="query"
        :label="t('Search members')"
        density="compact"
        variant="outlined"
        hide-details
        @keyup.enter="emit('refresh')"
      />
      <v-select
        v-model="status"
        :label="t('Status')"
        :items="optionItems(['', ...groupMembershipStatusOptions])"
        density="compact"
        variant="outlined"
        hide-details
        max-width="190"
      />
      <v-btn variant="tonal" @click="emit('refresh')">
        {{ t("common.refresh") }}
      </v-btn>
    </div>
    <v-progress-linear v-if="pending" indeterminate color="primary" />
    <v-table density="compact">
      <thead>
        <tr>
          <th>{{ t("Member") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Updated") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!pending && memberships.length === 0">
          <td colspan="3" class="text-medium-emphasis py-4">
            {{ t("No members match the current filters.") }}
          </td>
        </tr>
        <tr v-for="membership in memberships" :key="membership.userId">
          <td>
            <div class="font-weight-medium">
              {{ membership.memberDisplayName }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ membership.memberEmail || membership.userId }}
            </div>
          </td>
          <td style="min-width: 170px">
            <v-select
              :model-value="membership.status"
              :items="optionItems(groupMembershipStatusOptions)"
              :disabled="!canManage || updatePending"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="updateStatus(membership, $event)"
            />
          </td>
          <td class="text-no-wrap">
            {{ formatGroupDateTime(membership.updatedAt, locale) }}
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
