<script setup lang="ts">
import type { AdminPrayerRequest } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";

import {
  formatPrayerDateTime,
  prayerStatusColor,
  prayerVisibilityColor
} from "../prayer_presenters";
import type { PrayerListFilterForm } from "../prayer_workspace_models";

const filters = defineModel<PrayerListFilterForm>("filters", {
  required: true
});
defineProps<{
  requests: AdminPrayerRequest[];
  pending: boolean;
  fetching: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
}>();
const emit = defineEmits<{
  apply: [];
  clear: [];
  open: [request: AdminPrayerRequest];
  retry: [];
}>();
const { locale, optionItems, t } = useI18n();
</script>

<template>
  <v-card class="mt-6" variant="outlined">
    <v-form class="pa-5" @submit.prevent="emit('apply')">
      <v-row dense align="center">
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
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
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filters.visibility"
            :label="t('Visibility')"
            :items="optionItems(['', 'private', 'public', 'group', 'members'])"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="8" md="3">
          <v-text-field
            v-model="filters.groupId"
            :label="t('Group ID')"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <div class="d-flex justify-end ga-2">
            <v-btn
              type="button"
              icon="mdi-filter-remove-outline"
              variant="text"
              :disabled="fetching"
              :aria-label="t('prayer.clearFilters')"
              :title="t('prayer.clearFilters')"
              @click="emit('clear')"
            />
            <v-btn
              type="submit"
              icon="mdi-filter-check-outline"
              color="primary"
              variant="tonal"
              :loading="fetching"
              :aria-label="t('prayer.applyFilters')"
              :title="t('prayer.applyFilters')"
            />
          </div>
        </v-col>
      </v-row>
    </v-form>

    <v-divider />
    <AdminRefreshAlert
      class="ma-4 mb-0"
      :message="refreshErrorMessage"
      :retry-label="t('common.refresh')"
      @retry="emit('retry')"
    />
    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="requests.length === 0"
      :empty-title="t('No prayer requests match the current filters.')"
      empty-icon="mdi-hands-pray"
      :retry-label="t('common.refresh')"
      @retry="emit('retry')"
    >
      <v-table class="d-none d-md-block" density="comfortable" hover>
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

      <div class="d-md-none">
        <AdminMobileRecord
          v-for="request in requests"
          :key="request.id"
          @activate="emit('open', request)"
        >
          <strong>{{ request.title }}</strong>
          <span>{{ request.submitterName || t("Anonymous") }}</span>
          <span>{{ formatPrayerDateTime(request.updatedAt, locale) }}</span>
          <template #trailing>
            <div class="d-flex flex-column align-end ga-1">
              <v-chip size="small" :color="prayerStatusColor(request.status)">
                {{ t(request.status) }}
              </v-chip>
              <v-chip
                size="small"
                variant="tonal"
                :color="prayerVisibilityColor(request.visibility)"
              >
                {{ t(request.visibility) }}
              </v-chip>
            </div>
          </template>
        </AdminMobileRecord>
      </div>
    </AdminDataState>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
