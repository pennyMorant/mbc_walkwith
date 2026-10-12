<script setup lang="ts">
import type {
  LifePost,
  LifePostStatus,
  LifePostVisibility
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

type LifePostFilters = {
  query: string;
  visibility: LifePostVisibility | "";
  status: LifePostStatus | "";
};

defineProps<{
  filters: LifePostFilters;
  posts: LifePost[];
  pending: boolean;
  fetching: boolean;
  error: unknown;
  publicPostCount: number;
  privatePostCount: number;
  statusColor: (status: LifePostStatus) => string;
  visibilityColor: (visibility: LifePostVisibility) => string;
  formatSchedule: (post: LifePost) => string;
  formatDateTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  refetch: [];
  open: [post: LifePost];
}>();

const { optionItems, t } = useI18n();

function displayWeightLabel(weight: number) {
  if (weight >= 100) {
    return t("life.displayWeight.veryImportant");
  }
  if (weight >= 50) {
    return t("life.displayWeight.important");
  }
  return t("life.displayWeight.normal");
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
      <v-row dense>
        <v-col cols="12" md="5">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="emit('refetch')"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.visibility"
            :label="t('Visibility')"
            :items="optionItems(['', 'public', 'members', 'group', 'private'])"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="emit('refetch')"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.status"
            :label="t('Status')"
            :items="
              optionItems(['', 'draft', 'needs_review', 'published', 'archived'])
            "
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="emit('refetch')"
          />
        </v-col>
        <v-col cols="12" md="1">
          <v-btn block variant="tonal" @click="emit('refetch')">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <v-divider />
    <v-progress-linear v-if="pending" indeterminate color="primary" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <v-table v-else density="comfortable">
      <thead>
        <tr>
          <th>{{ t("Title") }}</th>
          <th>{{ t("Type") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("life.displayWeight.label") }}</th>
          <th>{{ t("Visibility") }}</th>
          <th>{{ t("Registrations") }}</th>
          <th>{{ t("Meta") }}</th>
          <th>{{ t("Schedule") }}</th>
          <th>{{ t("Updated") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="post in posts"
          :key="post.id"
          class="cursor-pointer"
          @click="emit('open', post)"
        >
          <td class="font-weight-bold">{{ post.title }}</td>
          <td>{{ t(post.type) }}</td>
          <td>
            <v-chip size="small" :color="statusColor(post.status)" variant="tonal">
              {{ t(post.status) }}
            </v-chip>
          </td>
          <td>
            <v-chip size="small" color="primary" variant="tonal">
              {{ displayWeightLabel(post.displayWeight) }}
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
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
