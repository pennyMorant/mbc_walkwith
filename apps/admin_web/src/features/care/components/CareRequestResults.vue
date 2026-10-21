<script setup lang="ts">
import type {
  CarePrivacyLevel,
  CareRequestAdmin,
  CareRequestStatus
} from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  requests: CareRequestAdmin[];
  pending: boolean;
  statusColor: (status: CareRequestStatus) => string;
  privacyColor: (privacy: CarePrivacyLevel) => string;
}>();
defineEmits<{ open: [request: CareRequestAdmin] }>();

const { locale, t } = useI18n();
</script>

<template>
  <v-progress-linear v-if="pending" indeterminate color="primary" />
  <template v-else>
    <v-table class="d-none d-md-block" density="comfortable" hover>
      <thead>
        <tr>
          <th>{{ t("Member") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Privacy") }}</th>
          <th>{{ t("Assignee") }}</th>
          <th>{{ t("Updated") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="requests.length === 0">
          <td colspan="5" class="text-center text-medium-emphasis py-8">
            {{ t("No care requests match the current filters.") }}
          </td>
        </tr>
        <tr
          v-for="request in requests"
          :key="request.id"
          class="cursor-pointer"
          @click="$emit('open', request)"
        >
          <td>
            <div class="font-weight-bold">{{ request.title }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ request.memberDisplayName }} · {{ request.memberEmail }}
            </div>
          </td>
          <td>
            <v-chip size="small" :color="statusColor(request.status)">
              {{ t(request.status) }}
            </v-chip>
          </td>
          <td>
            <v-chip size="small" variant="tonal" :color="privacyColor(request.privacyLevel)">
              {{ t(request.privacyLevel) }}
            </v-chip>
          </td>
          <td>{{ request.assigneeName || t("common.notSet") }}</td>
          <td>{{ formatAdminDateTime(request.updatedAt, locale) }}</td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <button
        v-for="request in requests"
        :key="request.id"
        class="care-record"
        type="button"
        @click="$emit('open', request)"
      >
        <span class="care-record__main">
          <strong>{{ request.title }}</strong>
          <span>{{ request.memberDisplayName }} · {{ request.memberEmail }}</span>
          <span>{{ request.assigneeName || t("common.notSet") }}</span>
        </span>
        <span class="care-record__status">
          <v-chip size="small" :color="statusColor(request.status)">
            {{ t(request.status) }}
          </v-chip>
          <v-chip size="small" variant="tonal" :color="privacyColor(request.privacyLevel)">
            {{ t(request.privacyLevel) }}
          </v-chip>
        </span>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
      <div v-if="requests.length === 0" class="care-record-empty">
        {{ t("No care requests match the current filters.") }}
      </div>
    </div>
  </template>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.care-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.care-record__main, .care-record__status { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: 4px; }
.care-record__main span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.care-record-empty { padding: 28px 16px; color: rgba(var(--v-theme-on-surface), 0.62); text-align: center; }
</style>
