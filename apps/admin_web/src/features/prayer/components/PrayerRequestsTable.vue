<script setup lang="ts">
import type { AdminPrayerRequest } from "@mbc/api-contracts";

import type { PrayerRequestListFilters } from "@/core/api/prayer_requests";
import { useI18n } from "@/core/i18n/i18n";
import {
  formatPrayerDateTime,
  prayerStatusColor,
  prayerVisibilityColor
} from "../prayer_presenters";

const filters = defineModel<PrayerRequestListFilters>("filters", {
  required: true
});
defineProps<{
  requests: AdminPrayerRequest[];
  loading: boolean;
}>();
const emit = defineEmits<{
  open: [request: AdminPrayerRequest];
  refresh: [];
}>();
const { locale, optionItems, t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="emit('refresh')"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.status"
            :label="t('Status')"
            :items="
              optionItems(['', 'pending', 'approved', 'hidden', 'archived'])
            "
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.visibility"
            :label="t('Visibility')"
            :items="optionItems(['', 'private', 'public', 'group', 'members'])"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.groupId"
            :label="t('Group ID')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="emit('refresh')"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-btn block variant="tonal" @click="emit('refresh')">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
    <v-divider />
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-table density="comfortable">
      <thead>
        <tr>
          <th>{{ t("Title") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Visibility") }}</th>
          <th>{{ t("Submitter") }}</th>
          <th>{{ t("Updated") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!loading && requests.length === 0">
          <td colspan="5" class="text-medium-emphasis py-6">
            {{ t("No prayer requests match the current filters.") }}
          </td>
        </tr>
        <tr
          v-for="request in requests"
          :key="request.id"
          class="cursor-pointer"
          @click="emit('open', request)"
        >
          <td>
            <div class="font-weight-bold">{{ request.title }}</div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ request.body }}
            </div>
          </td>
          <td>
            <v-chip size="small" :color="prayerStatusColor(request.status)">
              {{ t(request.status) }}
            </v-chip>
          </td>
          <td>
            <v-chip
              size="small"
              variant="tonal"
              :color="prayerVisibilityColor(request.visibility)"
            >
              {{ t(request.visibility) }}
            </v-chip>
          </td>
          <td>{{ request.submitterName || t("Anonymous") }}</td>
          <td>{{ formatPrayerDateTime(request.updatedAt, locale) }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
