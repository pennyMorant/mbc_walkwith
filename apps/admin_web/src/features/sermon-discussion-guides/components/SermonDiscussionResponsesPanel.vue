<script setup lang="ts">
import type {
  SermonDiscussionGuide,
  SermonDiscussionResponse
} from "@mbc/api-contracts";

import {
  sermonDiscussionResponseUserTypeOptions
} from "@/core/api/sermon_discussion_guides";
import { useI18n } from "@/core/i18n/i18n";

type ResponseFilters = {
  userType: "member" | "external" | "";
};

defineProps<{
  canManage: boolean;
  filters: ResponseFilters;
  hidingResponseId: string | null;
  pending: boolean;
  responses: SermonDiscussionResponse[];
  selectedGuide: SermonDiscussionGuide | null;
}>();

defineEmits<{
  hideResponse: [responseId: string];
  refresh: [];
}>();

const { optionItems, t } = useI18n();

function responseStatusColor(status: SermonDiscussionResponse["status"]) {
  return {
    private: "primary",
    shared_with_group: "info",
    hidden: "warning",
    archived: "secondary"
  }[status];
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-md-row justify-space-between ga-3">
      <div>
        <div class="text-subtitle-2 font-weight-bold">
          {{ t("Responses") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{
            selectedGuide
              ? selectedGuide.title
              : t("Select a discussion guide to review responses.")
          }}
        </div>
      </div>
      <div class="d-flex flex-column flex-sm-row ga-2">
        <v-select
          v-model="filters.userType"
          :items="optionItems(['', ...sermonDiscussionResponseUserTypeOptions])"
          :label="t('User type')"
          density="compact"
          hide-details
          style="min-width: 180px"
          variant="outlined"
          @update:model-value="$emit('refresh')"
        />
        <v-btn
          :disabled="!selectedGuide"
          :loading="pending"
          variant="tonal"
          @click="$emit('refresh')"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </div>
    </div>

    <v-progress-linear
      v-if="pending"
      class="mt-4"
      color="primary"
      indeterminate
    />

    <v-alert
      v-else-if="!selectedGuide"
      class="mt-4"
      density="comfortable"
      type="info"
      variant="tonal"
    >
      {{ t("No discussion guide selected.") }}
    </v-alert>

    <v-table v-else class="mt-4" density="comfortable">
      <thead>
        <tr>
          <th>{{ t("User") }}</th>
          <th>{{ t("Question") }}</th>
          <th>{{ t("Response") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Created") }}</th>
          <th class="text-right">{{ t("common.actions") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="responses.length === 0">
          <td colspan="6">
            {{ t("No responses match the current filters.") }}
          </td>
        </tr>
        <tr v-for="response in responses" :key="response.id">
          <td>
            <div class="font-weight-medium">{{ t(response.userType) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ response.userId }}
            </div>
          </td>
          <td>{{ response.questionId || t("common.notSet") }}</td>
          <td class="response-cell">{{ response.content }}</td>
          <td>
            <v-chip
              size="small"
              variant="tonal"
              :color="responseStatusColor(response.status)"
            >
              {{ t(response.status) }}
            </v-chip>
          </td>
          <td>{{ response.createdAt }}</td>
          <td class="text-right">
            <v-btn
              v-if="canManage && response.status !== 'hidden'"
              color="warning"
              size="small"
              variant="tonal"
              :disabled="Boolean(hidingResponseId)"
              :loading="hidingResponseId === response.id"
              @click="$emit('hideResponse', response.id)"
            >
              {{ t("Hide") }}
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped>
.response-cell {
  max-width: 360px;
  white-space: pre-wrap;
}
</style>
