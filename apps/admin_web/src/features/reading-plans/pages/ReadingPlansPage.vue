<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";

import ReadingPlanAssignmentsPanel from "../components/ReadingPlanAssignmentsPanel.vue";
import ReadingPlanDaysPanel from "../components/ReadingPlanDaysPanel.vue";
import ReadingPlanEditorFields from "../components/ReadingPlanEditorFields.vue";
import ReadingPlanFiltersCard from "../components/ReadingPlanFiltersCard.vue";
import ReadingPlanLibraryPanel from "../components/ReadingPlanLibraryPanel.vue";
import { useReadingPlansPage } from "../composables/use_reading_plans_page";

const {
  activePanel,
  allowedPlanStatuses,
  applyAssignmentFilters,
  applyPlanFilters,
  assignPlan,
  assignmentErrorMessage,
  assignmentFilters,
  assignmentForm,
  assignments,
  assignmentsErrorMessage,
  assignmentsQuery,
  assignmentsRefreshErrorMessage,
  assignmentSourceTypeItems,
  assignmentStatusItems,
  assignmentUserTypeItems,
  canCreateAssignment,
  canManage,
  canSavePlan,
  canUpsertDay,
  createAssignmentMutation,
  dayErrorMessage,
  dayForm,
  days,
  daysErrorMessage,
  daysQuery,
  daysRefreshErrorMessage,
  filters,
  localeItems,
  newPlan,
  optionItems,
  planContentLocked,
  planErrorMessage,
  planForm,
  plans,
  plansErrorMessage,
  plansQuery,
  plansRefreshErrorMessage,
  planStructureLocked,
  readingPlanStatusOptions,
  readingPlanVisibilityOptions,
  saveDay,
  savePlan,
  savePlanMutation,
  selectedPlan,
  selectPlan,
  t,
  upsertDayMutation
} = useReadingPlansPage();
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('Reading plans')"
      :subtitle="t('Manage church reading plans, scripture references, and assignments.')"
    >
      <template #actions>
        <v-btn
          v-if="canManage"
          color="primary"
          prepend-icon="mdi-plus"
          @click="newPlan"
        >
          {{ t("New reading plan") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <ReadingPlanFiltersCard
      v-model="filters"
      :status-items="optionItems(['', ...readingPlanStatusOptions])"
      :visibility-items="optionItems(['', ...readingPlanVisibilityOptions])"
      :locale-items="localeItems"
      @apply="applyPlanFilters"
    />

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <ReadingPlanLibraryPanel
          :plans="plans"
          :selected-plan-id="selectedPlan?.id ?? null"
          :pending="plansQuery.isPending.value"
          :fetching="plansQuery.isFetching.value"
          :error-message="plansErrorMessage"
          :refresh-error-message="plansRefreshErrorMessage"
          @retry="plansQuery.refetch()"
          @select="selectPlan"
        />
      </v-col>

      <v-col cols="12" lg="8">
        <v-card variant="outlined">
          <div class="pa-5 pb-3">
            <AdminPanelHeader
              :title="selectedPlan?.title || t('Reading plan')"
              :subtitle="t('Scripture text stays in the App local Bible data.')"
            />
          </div>

          <v-card-text>
            <v-alert
              v-if="planErrorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ planErrorMessage }}
            </v-alert>
            <ReadingPlanEditorFields
              v-model="planForm"
              :status-items="optionItems(allowedPlanStatuses)"
              :visibility-items="optionItems(readingPlanVisibilityOptions)"
              :locale-items="localeItems"
              :can-manage="canManage"
              :can-save="canSavePlan"
              :content-locked="planContentLocked"
              :structure-locked="planStructureLocked"
              :saving="savePlanMutation.isPending.value"
              @save="savePlan"
            />
          </v-card-text>

          <v-divider />

          <v-card-text>
            <v-btn-toggle v-model="activePanel" mandatory density="comfortable">
              <v-btn value="days">{{ t("Plan days") }}</v-btn>
              <v-btn value="assignments">{{ t("Assignments") }}</v-btn>
            </v-btn-toggle>

            <ReadingPlanDaysPanel
              v-if="activePanel === 'days'"
              :can-manage="canManage"
              :can-upsert-day="canUpsertDay"
              :command-error-message="dayErrorMessage"
              :days="days"
              :day-form="dayForm"
              :error-message="daysErrorMessage"
              :refresh-error-message="daysRefreshErrorMessage"
              :has-selected-plan="Boolean(selectedPlan)"
              :loading="daysQuery.isFetching.value"
              :pending="daysQuery.isPending.value"
              :saving="upsertDayMutation.isPending.value"
              @retry="daysQuery.refetch()"
              @save-day="saveDay"
            />

            <ReadingPlanAssignmentsPanel
              v-else
              :assignment-filters="assignmentFilters"
              :assignment-form="assignmentForm"
              :assignments="assignments"
              :assignment-source-type-items="assignmentSourceTypeItems"
              :assignment-status-items="assignmentStatusItems"
              :assignment-user-type-items="assignmentUserTypeItems"
              :command-error-message="assignmentErrorMessage"
              :error-message="assignmentsErrorMessage"
              :refresh-error-message="assignmentsRefreshErrorMessage"
              :can-create-assignment="canCreateAssignment"
              :can-manage="canManage"
              :has-selected-plan="Boolean(selectedPlan)"
              :loading="assignmentsQuery.isFetching.value"
              :pending="assignmentsQuery.isPending.value"
              :saving="createAssignmentMutation.isPending.value"
              @apply="applyAssignmentFilters"
              @assign="assignPlan"
              @retry="assignmentsQuery.refetch()"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
