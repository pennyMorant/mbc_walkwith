<script setup lang="ts">
import type {
  SermonDiscussionGuide,
  SermonDiscussionResponse
} from "@mbc/api-contracts";

import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

type ResponseFilters = {
  userType: "member" | "external" | "";
};

defineProps<{
  canManage: boolean;
  commandErrorMessage: string;
  errorMessage: string;
  refreshErrorMessage: string;
  filters: ResponseFilters;
  hidingResponseId: string | null;
  pending: boolean;
  fetching: boolean;
  responses: SermonDiscussionResponse[];
  selectedGuide: SermonDiscussionGuide | null;
  userTypeItems: unknown[];
}>();

defineEmits<{
  apply: [];
  hideResponse: [responseId: string];
  retry: [];
}>();

const { locale, t } = useI18n();

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
    <AdminFilterToolbar @apply="$emit('apply')">
      <template #heading>
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
      </template>
      <v-select
        v-model="filters.userType"
        class="admin-filter-control"
        :items="userTypeItems"
        :label="t('User type')"
        density="compact"
        hide-details
        variant="outlined"
      />
      <template #actions>
        <v-btn
          type="submit"
          :disabled="!selectedGuide"
          :loading="fetching"
          variant="tonal"
        >
          {{ t("common.go") }}
        </v-btn>
      </template>
    </AdminFilterToolbar>

    <v-alert
      v-if="!selectedGuide"
      class="mt-4"
      density="comfortable"
      type="info"
      variant="tonal"
    >
      {{ t("No discussion guide selected.") }}
    </v-alert>

    <v-alert
      v-else-if="refreshErrorMessage"
      type="warning"
      variant="tonal"
      class="mt-4 mb-0"
    >
      <div
        class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
      >
        <span>{{ refreshErrorMessage }}</span>
        <v-btn
          prepend-icon="mdi-refresh"
          size="small"
          variant="tonal"
          @click="$emit('retry')"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </div>
    </v-alert>

    <AdminDataState
      v-if="selectedGuide"
      class="mt-4"
      :pending="(pending || fetching) && responses.length === 0"
      :error-message="responses.length === 0 ? errorMessage : ''"
      :empty="!fetching && !errorMessage && responses.length === 0"
      :empty-title="t('No responses match the current filters.')"
      empty-icon="mdi-message-text-off-outline"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-progress-linear
        v-if="fetching && responses.length > 0"
        color="primary"
        indeterminate
      />
      <v-alert
        v-if="commandErrorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ commandErrorMessage }}
      </v-alert>
      <AdminResponsiveTable>
        <template #desktop>
          <v-table density="comfortable">
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
              <tr v-for="response in responses" :key="response.id">
                <td>
                  <div class="font-weight-medium">
                    {{ t(response.userType) }}
                  </div>
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
                <td>{{ formatAdminDateTime(response.createdAt, locale) }}</td>
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
        </template>
        <template #mobile>
          <div class="discussion-response-list">
            <article
              v-for="response in responses"
              :key="response.id"
              class="discussion-response-record"
            >
              <div class="discussion-response-record__heading">
                <div>
                  <div class="font-weight-bold">{{ t(response.userType) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ response.userId }}
                  </div>
                </div>
                <v-chip
                  size="small"
                  variant="tonal"
                  :color="responseStatusColor(response.status)"
                >
                  {{ t(response.status) }}
                </v-chip>
              </div>
              <div class="text-caption text-medium-emphasis mt-3">
                {{ t("Question") }} ·
                {{ response.questionId || t("common.notSet") }}
              </div>
              <div class="discussion-response-record__content mt-1">
                {{ response.content }}
              </div>
              <div class="discussion-response-record__footer mt-3">
                <span class="text-caption text-medium-emphasis">{{
                  formatAdminDateTime(response.createdAt, locale)
                }}</span>
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
              </div>
            </article>
          </div>
        </template>
      </AdminResponsiveTable>
    </AdminDataState>
  </div>
</template>

<style scoped>
.response-cell {
  max-width: 360px;
  white-space: pre-wrap;
}
.discussion-response-list {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.discussion-response-record {
  padding: 16px 2px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.discussion-response-record__heading,
.discussion-response-record__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.discussion-response-record__content {
  line-height: 1.55;
  white-space: pre-wrap;
}
</style>
