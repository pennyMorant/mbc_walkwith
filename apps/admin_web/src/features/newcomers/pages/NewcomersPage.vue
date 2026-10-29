<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import NewcomerFiltersCard from "../components/NewcomerFiltersCard.vue";
import NewcomerResults from "../components/NewcomerResults.vue";
import { useNewcomerPage } from "../composables/use_newcomer_page";
import {
  conversionStatusOptions,
  followUpStatusOptions,
  newcomerContactLine,
  newcomerFilterStatusOptions,
  newcomerStatusColor,
  newcomerStatusOptions
} from "../newcomer_presenters";

const { optionItems, t } = useI18n();
const {
  addFollowUp,
  applyFilters,
  assignedCount,
  canCreateFollowUp,
  canManage,
  canSave,
  clearFilters,
  discipleshipCount,
  drawer,
  filters,
  followUpForm,
  followUpMutation,
  followUps,
  followUpsInitialErrorMessage,
  followUpsQuery,
  followUpsRefreshErrorMessage,
  form,
  newCount,
  newcomers,
  newcomersQuery,
  listErrorMessage,
  listRefreshErrorMessage,
  mutationErrorMessage,
  openNewcomer,
  refreshList,
  saveNewcomer,
  selectedNewcomer,
  updateMutation
} = useNewcomerPage();
const summaryMetrics = computed(() => [
  { id: "new", label: t("New newcomer profiles"), value: newCount.value, icon: "mdi-account-star-outline", tone: "primary" as const },
  { id: "follow_up", label: t("Active follow-up"), value: assignedCount.value, icon: "mdi-account-clock-outline", tone: "warning" as const },
  { id: "discipleship", label: t("In discipleship"), value: discipleshipCount.value, icon: "mdi-school-outline", tone: "success" as const }
]);
</script>

<template>
  <div>
    <AdminPageHeader :title="t('nav.newcomers')" :subtitle="t('newcomers.pageSubtitle')">
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          :loading="newcomersQuery.isFetching.value"
          prepend-icon="mdi-refresh"
          @click="refreshList"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <AdminMetricGrid :items="summaryMetrics" />

    <NewcomerFiltersCard
      v-model:query="filters.query"
      v-model:status="filters.status"
      class="mt-6"
      :fetching="newcomersQuery.isFetching.value"
      :status-items="optionItems(newcomerFilterStatusOptions)"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <v-card class="mt-4" variant="outlined">
      <NewcomerResults
        :newcomers="newcomers"
        :pending="newcomersQuery.isPending.value"
        :error-message="listErrorMessage"
        :refresh-error-message="listRefreshErrorMessage"
        @open="openNewcomer"
        @retry="refreshList"
      />
    </v-card>

    <AdminResponsiveDrawer v-model="drawer" :desktop-width="640">
      <div v-if="selectedNewcomer" class="pa-5">
        <div class="d-flex align-start justify-space-between ga-4">
          <div>
            <div class="text-h6 font-weight-bold">
              {{ selectedNewcomer.displayName }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ newcomerContactLine(selectedNewcomer) || t("common.notSet") }}
            </div>
          </div>
          <v-chip
            size="small"
            :color="newcomerStatusColor(selectedNewcomer.status)"
          >
            {{ t(selectedNewcomer.status) }}
          </v-chip>
        </div>

        <v-alert type="info" variant="tonal" class="mt-5">
          {{ t("newcomers.privacyNotice") }}
        </v-alert>

        <v-alert
          v-if="mutationErrorMessage"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ mutationErrorMessage }}
        </v-alert>

        <v-divider class="my-5" />

        <v-form @submit.prevent="saveNewcomer">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                :label="t('Status')"
                :items="optionItems(newcomerStatusOptions)"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.conversionStatus"
                :label="t('Conversion')"
                :items="optionItems(conversionStatusOptions)"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.assigneeName"
                :label="t('Assignee')"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.nextFollowUpAt"
                :label="t('Next follow-up')"
                type="datetime-local"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.preferredLanguage"
                :label="t('Preferred language')"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.linkedMemberUserId"
                :label="t('Linked member user ID')"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-textarea
            v-model="form.interest"
            :label="t('Interest')"
            :disabled="!canManage"
            rows="4"
            density="comfortable"
            variant="outlined"
          />
          <v-btn
            type="submit"
            color="primary"
            :disabled="!canSave || updateMutation.isPending.value"
            :loading="updateMutation.isPending.value"
          >
            {{ t("common.save") }}
          </v-btn>
        </v-form>

        <v-divider class="my-5" />

        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Follow-up records") }}
        </div>
        <v-form class="mt-3" @submit.prevent="addFollowUp">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="followUpForm.status"
                :label="t('Status')"
                :items="optionItems(followUpStatusOptions)"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="followUpForm.plannedAt"
                :label="t('Planned time')"
                type="datetime-local"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-textarea
            v-model="followUpForm.note"
            :label="t('Follow-up note')"
            :disabled="!canManage"
            rows="3"
            density="comfortable"
            variant="outlined"
          />
          <v-btn
            type="submit"
            color="primary"
            variant="tonal"
            :disabled="!canCreateFollowUp || followUpMutation.isPending.value"
            :loading="followUpMutation.isPending.value"
          >
            {{ t("Add follow-up") }}
          </v-btn>
        </v-form>

        <v-alert
          v-if="followUpsRefreshErrorMessage"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          <div class="d-flex align-center justify-space-between ga-3">
            <span>{{ followUpsRefreshErrorMessage }}</span>
            <v-btn size="small" variant="text" @click="followUpsQuery.refetch()">
              {{ t("common.refresh") }}
            </v-btn>
          </div>
        </v-alert>
        <AdminDataState
          class="mt-4"
          :pending="followUpsQuery.isPending.value"
          :error-message="followUpsInitialErrorMessage"
          :empty="followUps.length === 0"
          :empty-title="t('No follow-ups recorded.')"
          empty-icon="mdi-account-clock-outline"
          :retry-label="t('common.refresh')"
          @retry="followUpsQuery.refetch()"
        >
          <v-list lines="three">
            <v-list-item v-for="followUp in followUps" :key="followUp.id">
              <v-list-item-title>
                {{ followUp.authorName || t("Admin") }} · {{ t(followUp.status) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ followUp.note }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </AdminDataState>
      </div>
    </AdminResponsiveDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
