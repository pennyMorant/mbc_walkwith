<script setup lang="ts">
import type {
  GroupMembership,
  GroupMembershipStatus
} from "@mbc/api-contracts";

import { groupMembershipStatusOptions } from "@/core/api/groups";
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import { formatGroupDateTime } from "../group_presenters";
import GroupPanelState from "./GroupPanelState.vue";

const status = defineModel<GroupMembershipStatus | "">("status", {
  required: true
});
const query = defineModel<string>("query", { required: true });

defineProps<{
  memberships: GroupMembership[];
  pending: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  commandErrorMessage: string;
  updatePending: boolean;
  canManage: boolean;
}>();

const emit = defineEmits<{
  retry: [];
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
  <GroupPanelState
    :pending="pending"
    :error-message="errorMessage"
    :refresh-error-message="refreshErrorMessage"
    :command-error-message="commandErrorMessage"
    @retry="emit('retry')"
  >
    <AdminFilterToolbar class="mb-3" @apply="emit('retry')">
      <v-text-field
        v-model="query"
        class="admin-filter-control"
        :label="t('Search members')"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="status"
        class="admin-filter-control"
        :label="t('Status')"
        :items="optionItems(['', ...groupMembershipStatusOptions])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <template #actions>
        <v-btn type="submit" variant="tonal">
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminFilterToolbar>
    <v-table class="d-none d-md-block" density="compact">
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
    <div class="d-md-none">
      <p
        v-if="!pending && memberships.length === 0"
        class="text-body-2 text-medium-emphasis py-3 mb-0"
      >
        {{ t("No members match the current filters.") }}
      </p>
      <AdminMobileDataRow
        v-for="membership in memberships"
        :key="membership.userId"
      >
        <strong>{{ membership.memberDisplayName }}</strong>
        <span class="text-caption text-medium-emphasis">
          {{ membership.memberEmail || membership.userId }}
        </span>
        <template #meta>
          <span>{{ formatGroupDateTime(membership.updatedAt, locale) }}</span>
        </template>
        <template #actions>
          <v-select
            :model-value="membership.status"
            :items="optionItems(groupMembershipStatusOptions)"
            :disabled="!canManage || updatePending"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="updateStatus(membership, $event)"
          />
        </template>
      </AdminMobileDataRow>
    </div>
  </GroupPanelState>
</template>
