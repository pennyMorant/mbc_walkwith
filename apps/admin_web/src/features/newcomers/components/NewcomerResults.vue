<script setup lang="ts">
import type { NewcomerProfile } from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";
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

const { locale, t } = useI18n();
</script>

<template>
  <AdminRefreshAlert
    class="ma-4 mb-0"
    :message="refreshErrorMessage"
    :retry-label="t('common.refresh')"
    @retry="$emit('retry')"
  />
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
        <AdminTableActionRow
          v-for="newcomer in newcomers"
          :key="newcomer.id"
          @activate="$emit('open', newcomer)"
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
          <td>
            {{
              newcomer.nextFollowUpAt
                ? formatAdminDateTime(newcomer.nextFollowUpAt, locale)
                : t("Not scheduled")
            }}
          </td>
        </AdminTableActionRow>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <AdminMobileRecord
        v-for="newcomer in newcomers"
        :key="newcomer.id"
        @activate="$emit('open', newcomer)"
      >
        <strong>{{ newcomer.displayName }}</strong>
        <span>{{ newcomerContactLine(newcomer) || t("common.notSet") }}</span>
        <span>{{ newcomer.assigneeName || t("common.notSet") }}</span>
        <span>
          {{ newcomer.source || t("common.notSet") }} ·
          {{
            newcomer.nextFollowUpAt
              ? formatAdminDateTime(newcomer.nextFollowUpAt, locale)
              : t("Not scheduled")
          }}
        </span>
        <template #trailing>
          <v-chip size="small" :color="newcomerStatusColor(newcomer.status)">
            {{ t(newcomer.status) }}
          </v-chip>
        </template>
      </AdminMobileRecord>
    </div>
  </AdminDataState>
</template>
