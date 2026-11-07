<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";

import { useDiscipleshipPageController } from "../composables/use_discipleship_page_controller";
import DiscipleshipAssignmentsPanel from "../components/DiscipleshipAssignmentsPanel.vue";
import DiscipleshipFiltersCard from "../components/DiscipleshipFiltersCard.vue";
import DiscipleshipJourneyCatalogCard from "../components/DiscipleshipJourneyCatalogCard.vue";
import DiscipleshipJourneyEditor from "../components/DiscipleshipJourneyEditor.vue";

const {
  activePanel,
  addStage,
  addTask,
  applyAssignmentFilters,
  applyJourneyFilters,
  assignmentCommandError,
  assignmentFilters,
  assignmentForm,
  assignments,
  assignmentsErrorMessage,
  assignmentsFetching,
  assignmentsPending,
  assignmentsRefreshErrorMessage,
  assignmentSourceTypeItems,
  assignmentStatusItems,
  assignJourney,
  canAddStage,
  canAddTask,
  canCreateAssignment,
  canManage,
  canSaveJourney,
  filters,
  hasSelectedJourney,
  journeyForm,
  journeyCommandError,
  journeyStatusItems,
  journeys,
  journeysFetching,
  journeysPending,
  listErrorMessage,
  listRefreshErrorMessage,
  lastCreatedStageId,
  newJourney,
  progressCommandError,
  progressCommandErrorAssignmentId,
  progressSaving,
  refreshAssignments,
  refreshJourneys,
  refreshStructure,
  saveJourney,
  savingAssignment,
  savingJourney,
  savingStage,
  savingTask,
  selectedJourney,
  selectJourney,
  stageForm,
  stages,
  structurePending,
  structureCommandError,
  structureErrorMessage,
  structureRefreshErrorMessage,
  t,
  taskForm,
  taskReferenceTypeItems,
  taskStatusItems,
  tasks,
  updateProgress
} = useDiscipleshipPageController();
</script>

<template>
  <div>
    <AdminPageHeader :title="t('nav.discipleship')" :subtitle="t('discipleship.subtitle')">
      <template #actions>
        <v-btn
          v-if="canManage"
          color="primary"
          prepend-icon="mdi-plus"
          @click="newJourney"
        >
          {{ t("New journey") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <DiscipleshipFiltersCard
      v-model="filters"
      :status-items="journeyStatusItems"
      @apply="applyJourneyFilters"
    />

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <DiscipleshipJourneyCatalogCard
          :error-message="listErrorMessage"
          :fetching="journeysFetching"
          :journeys="journeys"
          :pending="journeysPending"
          :refresh-error-message="listRefreshErrorMessage"
          :selected-journey-id="selectedJourney?.id ?? null"
          @retry="refreshJourneys"
          @select="selectJourney"
        />
      </v-col>

      <v-col cols="12" lg="8">
        <v-card variant="outlined">
          <div class="pa-5 pb-3">
            <AdminPanelHeader
              :title="selectedJourney?.title || t('Discipleship journey')"
              :subtitle="
                selectedJourney?.id ||
                t('Create a journey before adding stages, tasks, or assignments.')
              "
            />
          </div>
          <v-card-text>
            <v-btn-toggle
              v-model="activePanel"
              class="mb-5"
              density="comfortable"
              mandatory
            >
              <v-btn value="journey">{{ t("Journey") }}</v-btn>
              <v-btn value="assignments">{{ t("Assignments") }}</v-btn>
            </v-btn-toggle>

            <DiscipleshipJourneyEditor
              v-if="activePanel === 'journey'"
              :can-add-stage="canAddStage"
              :can-add-task="canAddTask"
              :can-manage="canManage"
              :can-save-journey="canSaveJourney"
              :journey-command-error="journeyCommandError"
              :journey-form="journeyForm"
              :journey-status-items="journeyStatusItems"
              :last-created-stage-id="lastCreatedStageId"
              :saving-journey="savingJourney"
              :saving-stage="savingStage"
              :saving-task="savingTask"
              :stage-form="stageForm"
              :stages="stages"
              :structure-command-error="structureCommandError"
              :structure-error-message="structureErrorMessage"
              :task-form="taskForm"
              :structure-refresh-error-message="structureRefreshErrorMessage"
              :task-reference-type-items="taskReferenceTypeItems"
              :tasks="tasks"
              :structure-pending="structurePending"
              @add-stage="addStage"
              @add-task="addTask"
              @retry-structure="refreshStructure"
              @save-journey="saveJourney"
            />

            <DiscipleshipAssignmentsPanel
              v-else
              :assignment-filters="assignmentFilters"
              :assignment-form="assignmentForm"
              :assignments="assignments"
              :assignment-source-type-items="assignmentSourceTypeItems"
              :assignment-status-items="assignmentStatusItems"
              :can-create-assignment="canCreateAssignment"
              :can-manage="canManage"
              :command-error-message="assignmentCommandError"
              :error-message="assignmentsErrorMessage"
              :fetching="assignmentsFetching"
              :has-selected-journey="hasSelectedJourney"
              :pending="assignmentsPending"
              :progress-error-message="progressCommandError"
              :progress-error-assignment-id="progressCommandErrorAssignmentId"
              :progress-saving="progressSaving"
              :saving="savingAssignment"
              :stages="stages"
              :refresh-error-message="assignmentsRefreshErrorMessage"
              :task-status-items="taskStatusItems"
              :tasks="tasks"
              @apply="applyAssignmentFilters"
              @assign="assignJourney"
              @retry="refreshAssignments"
              @update-progress="updateProgress"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
