<script setup lang="ts">
import type {
  LifePost,
  LifePostStatus,
  LifePostVisibility
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

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
      <div
        class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4 mb-4"
      >
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            {{ t("life.queueTitle") }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ t("life.queueSubtitle") }}
          </div>
        </div>
        <div class="d-flex ga-2">
          <v-chip color="success" variant="tonal">
            {{ t("published") }} {{ publicPostCount }}
          </v-chip>
          <v-chip color="secondary" variant="tonal">
            {{ t("Not published") }} {{ privatePostCount }}
          </v-chip>
        </div>
      </div>
      <LifePostLibraryFilters
        :filters="filters"
        :fetching="fetching"
        @apply="emit('apply')"
        @clear="emit('clear')"
      />
    </div>
    <v-divider />
    <v-progress-linear v-if="pending" indeterminate color="primary" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      <div
        class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
      >
        <span>{{ formatApiErrorMessage(error, t("common.error")) }}</span>
        <v-btn
          color="error"
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          @click="emit('retry')"
        >
          {{ t("Retry") }}
        </v-btn>
      </div>
    </v-alert>
    <template v-else>
      <v-alert
        v-if="refreshError"
        type="warning"
        variant="tonal"
        class="ma-4"
      >
        <div
          class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
        >
          <span>
            {{ t("life.refreshFailed") }}
            {{ formatApiErrorMessage(refreshError, t("common.error")) }}
          </span>
          <v-btn
            color="warning"
            variant="tonal"
            size="small"
            prepend-icon="mdi-refresh"
            @click="emit('retry')"
          >
            {{ t("Retry") }}
          </v-btn>
        </div>
      </v-alert>
      <v-table density="comfortable">
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
          <tr v-if="posts.length === 0">
            <td colspan="9" class="text-center text-medium-emphasis py-8">
              {{ t("life.noPosts") }}
            </td>
          </tr>
          <tr
            v-for="post in posts"
            :key="post.id"
            class="cursor-pointer"
            @click="emit('open', post)"
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
          </tr>
        </tbody>
      </v-table>
    </template>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
