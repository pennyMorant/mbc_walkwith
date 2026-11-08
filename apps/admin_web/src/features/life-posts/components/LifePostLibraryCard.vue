<script setup lang="ts">
import type {
  LifePost,
  LifePostStatus,
  LifePostVisibility
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";

import type { LifePostLibraryFilterForm } from "../life_post_library_models";
import LifePostLibraryFilters from "./LifePostLibraryFilters.vue";

defineProps<{
  filters: LifePostLibraryFilterForm;
  posts: LifePost[];
  pending: boolean;
  fetching: boolean;
  error: unknown;
  refreshError: unknown;
  publicPostCount: number;
  privatePostCount: number;
  statusColor: (status: LifePostStatus) => string;
  visibilityColor: (visibility: LifePostVisibility) => string;
  formatSchedule: (post: LifePost) => string;
  formatDateTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  apply: [];
  clear: [];
  open: [post: LifePost];
  retry: [];
}>();

const { t } = useI18n();

function sortLabel(weight: number) {
  if (weight >= 100) {
    return t("life.sort.veryImportant");
  }
  if (weight >= 50) {
    return t("life.sort.important");
  }
  return t("life.sort.normal");
}
</script>

<template>
  <v-card class="mt-6">
    <div class="pa-5">
      <AdminPanelHeader
        class="mb-4"
        :title="t('life.queueTitle')"
        :subtitle="t('life.queueSubtitle')"
      >
        <template #actions>
          <div class="d-flex flex-wrap ga-2">
            <v-chip color="success" variant="tonal">
              {{ t("published") }} {{ publicPostCount }}
            </v-chip>
            <v-chip color="secondary" variant="tonal">
              {{ t("Not published") }} {{ privatePostCount }}
            </v-chip>
          </div>
        </template>
      </AdminPanelHeader>
      <LifePostLibraryFilters
        :filters="filters"
        :fetching="fetching"
        @apply="emit('apply')"
        @clear="emit('clear')"
      />
    </div>
    <v-divider />
    <v-progress-linear v-if="pending" indeterminate color="primary" />
    <AdminRetryAlert
      v-else-if="error"
      :message="formatApiErrorMessage(error, t('common.error'))"
      :retry-label="t('Retry')"
      class="ma-4"
      @retry="emit('retry')"
    />
    <template v-else>
      <AdminRetryAlert
        :message="refreshError
          ? `${t('life.refreshFailed')} ${formatApiErrorMessage(refreshError, t('common.error'))}`
          : ''"
        :retry-label="t('Retry')"
        type="warning"
        button-color="warning"
        class="ma-4"
        @retry="emit('retry')"
      />
      <v-empty-state
        v-if="posts.length === 0"
        icon="mdi-post-outline"
        :title="t('life.noPosts')"
      />
      <v-table v-else class="d-none d-md-block" density="comfortable">
        <thead>
          <tr>
            <th>{{ t("Title") }}</th>
            <th>{{ t("Type") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("life.sort.label") }}</th>
            <th>{{ t("Visibility") }}</th>
            <th>{{ t("Registrations") }}</th>
            <th>{{ t("Meta") }}</th>
            <th>{{ t("Schedule") }}</th>
            <th>{{ t("Updated") }}</th>
          </tr>
        </thead>
        <tbody>
          <AdminTableActionRow
            v-for="post in posts"
            :key="post.id"
            @activate="emit('open', post)"
          >
            <td class="font-weight-bold">{{ post.title }}</td>
            <td>{{ t(post.type) }}</td>
            <td>
              <v-chip
                size="small"
                :color="statusColor(post.status)"
                variant="tonal"
              >
                {{ t(post.status) }}
              </v-chip>
            </td>
            <td>
              <v-chip size="small" color="primary" variant="tonal">
                {{ sortLabel(post.sort) }}
              </v-chip>
            </td>
            <td>
              <v-chip
                size="small"
                :color="visibilityColor(post.visibility)"
                variant="tonal"
              >
                {{ t(post.visibility) }}
              </v-chip>
            </td>
            <td>
              <v-chip
                v-if="post.registrationEnabled"
                size="small"
                color="primary"
                variant="tonal"
              >
                {{
                  `${post.registrationSummary.registeredCount}/${post.registrationSummary.capacity ?? "∞"}`
                }}
              </v-chip>
              <span v-else class="text-medium-emphasis">
                {{ t("Disabled") }}
              </span>
            </td>
            <td>{{ post.meta }}</td>
            <td>{{ formatSchedule(post) }}</td>
            <td>{{ formatDateTime(post.updatedAt) }}</td>
          </AdminTableActionRow>
        </tbody>
      </v-table>

      <div v-if="posts.length > 0" class="d-md-none">
        <AdminMobileRecord
          v-for="post in posts"
          :key="post.id"
          @activate="emit('open', post)"
        >
          <strong>{{ post.title }}</strong>
          <span>{{ t(post.type) }} · {{ formatSchedule(post) }}</span>
          <span>
            {{ sortLabel(post.sort) }} · {{ formatDateTime(post.updatedAt) }}
          </span>
          <span v-if="post.meta">{{ post.meta }}</span>
          <span v-if="post.registrationEnabled">
            {{ t("Registrations") }}
            {{ post.registrationSummary.registeredCount }}/{{
              post.registrationSummary.capacity ?? "∞"
            }}
          </span>
          <template #trailing>
            <div class="d-flex flex-column align-end ga-1">
              <v-chip
                size="small"
                :color="statusColor(post.status)"
                variant="tonal"
              >
                {{ t(post.status) }}
              </v-chip>
              <v-chip
                size="small"
                :color="visibilityColor(post.visibility)"
                variant="tonal"
              >
                {{ t(post.visibility) }}
              </v-chip>
            </div>
          </template>
        </AdminMobileRecord>
      </div>
    </template>
  </v-card>
</template>
