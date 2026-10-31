<script setup lang="ts">
import type {
  GroupApplication,
  GroupApplicationStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import GroupPanelState from "./GroupPanelState.vue";

const status = defineModel<GroupApplicationStatus | "">("status", {
  required: true
});
const query = defineModel<string>("query", { required: true });

defineProps<{
  applications: GroupApplication[];
  pending: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  commandErrorMessage: string;
  reviewPending: boolean;
  canManage: boolean;
}>();

const emit = defineEmits<{
  applyFilters: [];
  retry: [];
  review: [
    applicationId: string,
    status: Extract<GroupApplicationStatus, "approved" | "declined">
  ];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <GroupPanelState
    :pending="pending"
    :error-message="errorMessage"
    :refresh-error-message="refreshErrorMessage"
    :command-error-message="commandErrorMessage"
    @retry="emit('retry')"
  >
    <div class="d-flex flex-column flex-md-row ga-2 mb-3">
      <v-text-field
        v-model="query"
        :label="t('Search applications')"
        density="compact"
        variant="outlined"
        hide-details
        @keyup.enter="emit('applyFilters')"
      />
      <v-select
        v-model="status"
        :label="t('Status')"
        :items="
          optionItems(['', 'submitted', 'approved', 'declined', 'withdrawn'])
        "
        density="compact"
        variant="outlined"
        hide-details
        max-width="190"
      />
      <v-btn variant="tonal" @click="emit('applyFilters')">
        {{ t("common.go") }}
      </v-btn>
    </div>
    <v-list density="compact">
      <v-list-item v-if="!pending && applications.length === 0">
        <v-list-item-title class="text-medium-emphasis">
          {{ t("No applications match the current filters.") }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-for="application in applications"
        :key="application.id"
        class="px-0"
      >
        <template #title>
          <div class="font-weight-medium">
            {{ application.memberDisplayName }}
          </div>
        </template>
        <template #subtitle>
          <div>{{ application.memberEmail }}</div>
          <div v-if="application.note">{{ application.note }}</div>
          <div>{{ t(application.status) }}</div>
        </template>
        <template #append>
          <div
            v-if="application.status === 'submitted' && canManage"
            class="d-flex ga-2"
          >
            <v-btn
              size="small"
              color="success"
              variant="tonal"
              :disabled="reviewPending"
              :loading="reviewPending"
              @click="emit('review', application.id, 'approved')"
            >
              {{ t("Approve") }}
            </v-btn>
            <v-btn
              size="small"
              color="error"
              variant="text"
              :disabled="reviewPending"
              @click="emit('review', application.id, 'declined')"
            >
              {{ t("Decline") }}
            </v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </GroupPanelState>
</template>
