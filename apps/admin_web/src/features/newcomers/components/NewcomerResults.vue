<script setup lang="ts">
import type { NewcomerProfile } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import {
  newcomerContactLine,
  newcomerStatusColor
} from "../newcomer_presenters";

defineProps<{
  newcomers: NewcomerProfile[];
  pending: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
}>();
defineEmits<{ open: [newcomer: NewcomerProfile]; retry: [] }>();

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
    :empty="newcomers.length === 0"
    :empty-title="t('No newcomers match the current filters.')"
    empty-icon="mdi-account-search-outline"
    :retry-label="t('common.refresh')"
    @retry="$emit('retry')"
  >
    <v-table class="d-none d-md-block" density="comfortable" hover>
      <thead>
        <tr>
          <th>{{ t("Display name") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Assignee") }}</th>
          <th>{{ t("Source") }}</th>
          <th>{{ t("Next follow-up") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="newcomer in newcomers"
          :key="newcomer.id"
          class="cursor-pointer"
          @click="$emit('open', newcomer)"
        >
          <td>
            <div class="font-weight-bold">{{ newcomer.displayName }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ newcomerContactLine(newcomer) || t("common.notSet") }}
            </div>
          </td>
          <td>
            <v-chip size="small" :color="newcomerStatusColor(newcomer.status)">
              {{ t(newcomer.status) }}
            </v-chip>
          </td>
          <td>{{ newcomer.assigneeName || t("common.notSet") }}</td>
          <td>{{ newcomer.source || t("common.notSet") }}</td>
          <td>{{ newcomer.nextFollowUpAt || t("Not scheduled") }}</td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <button
        v-for="newcomer in newcomers"
        :key="newcomer.id"
        class="newcomer-record"
        type="button"
        @click="$emit('open', newcomer)"
      >
        <span class="newcomer-record__main">
          <strong>{{ newcomer.displayName }}</strong>
          <span>{{ newcomerContactLine(newcomer) || t("common.notSet") }}</span>
          <span>{{ newcomer.assigneeName || t("common.notSet") }}</span>
        </span>
        <v-chip size="small" :color="newcomerStatusColor(newcomer.status)">
          {{ t(newcomer.status) }}
        </v-chip>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
    </div>
  </AdminDataState>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.newcomer-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.newcomer-record__main { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.newcomer-record__main span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
</style>
