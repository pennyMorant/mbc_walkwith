<script setup lang="ts">
import type {
  CarePrivacyLevel,
  CareRequestAdmin,
  CareRequestStatus
} from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";

defineProps<{
  requests: CareRequestAdmin[];
  pending: boolean;
  errorMessage: string;
  statusColor: (status: CareRequestStatus) => string;
  privacyColor: (privacy: CarePrivacyLevel) => string;
}>();
defineEmits<{ open: [request: CareRequestAdmin]; retry: [] }>();

const { locale, t } = useI18n();
</script>

<template>
  <AdminDataState
    :pending="pending"
    :error-message="errorMessage"
    :empty="requests.length === 0"
    :empty-title="t('care.empty')"
    empty-icon="mdi-hand-heart-outline"
    :retry-label="t('common.refresh')"
    @retry="$emit('retry')"
  >
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
        <AdminTableActionRow
          v-for="request in requests"
          :key="request.id"
          @activate="$emit('open', request)"
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
        </AdminTableActionRow>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <AdminMobileRecord
        v-for="request in requests"
        :key="request.id"
        @activate="$emit('open', request)"
      >
        <strong>{{ request.title }}</strong>
        <span>{{ request.memberDisplayName }} · {{ request.memberEmail }}</span>
        <span>{{ request.assigneeName || t("common.notSet") }}</span>
        <span>{{ formatAdminDateTime(request.updatedAt, locale) }}</span>
        <template #trailing>
          <v-chip size="small" :color="statusColor(request.status)">
            {{ t(request.status) }}
          </v-chip>
          <v-chip size="small" variant="tonal" :color="privacyColor(request.privacyLevel)">
            {{ t(request.privacyLevel) }}
          </v-chip>
        </template>
      </AdminMobileRecord>
    </div>
  </AdminDataState>
</template>
