<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import { useDiscipleshipPageController } from "../composables/use_discipleship_page_controller";
import DiscipleshipAssignmentsPanel from "../components/DiscipleshipAssignmentsPanel.vue";
import DiscipleshipJourneyCatalogCard from "../components/DiscipleshipJourneyCatalogCard.vue";
import DiscipleshipJourneyEditor from "../components/DiscipleshipJourneyEditor.vue";

const {
  activePanel,
  addStage,
  addTask,
  assignmentFilters,
  assignmentForm,
  assignments,
  assignmentsPending,
  assignJourney,
  canAddStage,
  canAddTask,
  canCreateAssignment,
  canManage,
  canSaveJourney,
  discipleshipJourneyStatusOptions,
  discipleshipTaskReferenceTypeOptions,
  filters,
  hasSelectedJourney,
  journeyForm,
  journeys,
  journeysPending,
  listErrorMessage,
  lastCreatedStageId,
  newJourney,
  optionItems,
  progressSaving,
  refreshAssignments,
  refreshJourneys,
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
  t,
  taskForm,
  tasks,
  updateProgress,
  workspaceErrorMessage
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

    <v-alert
      v-if="workspaceErrorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
    >
      {{ workspaceErrorMessage }}
    </v-alert>

    <v-card class="mt-5" variant="outlined">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              hide-details
              variant="outlined"
              @keyup.enter="refreshJourneys"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="optionItems(['', ...discipleshipJourneyStatusOptions])"
              :label="t('Status')"
              density="compact"
              hide-details
              variant="outlined"
              @update:model-value="refreshJourneys"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn block variant="tonal" @click="refreshJourneys">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <DiscipleshipJourneyCatalogCard
          :error-message="listErrorMessage"
          :journeys="journeys"
          :pending="journeysPending"
          :selected-journey-id="selectedJourney?.id ?? null"
          @retry="refreshJourneys"
          @select="selectJourney"
        />
      </v-col>

      <v-col cols="12" lg="8">
        <v-card variant="outlined">
          <v-card-title>
            {{ selectedJourney?.title || t("Discipleship journey") }}
          </v-card-title>
          <v-card-subtitle>
            {{
              selectedJourney?.id ||
              t("Create a journey before adding stages, tasks, or assignments.")
            }}
          </v-card-subtitle>
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
              :journey-form="journeyForm"
              :journey-status-options="discipleshipJourneyStatusOptions"
              :last-created-stage-id="lastCreatedStageId"
              :saving-journey="savingJourney"
              :saving-stage="savingStage"
              :saving-task="savingTask"
              :stage-form="stageForm"
              :stages="stages"
              :task-form="taskForm"
              :task-reference-type-options="discipleshipTaskReferenceTypeOptions"
              :tasks="tasks"
              :structure-pending="structurePending"
              @add-stage="addStage"
              @add-task="addTask"
              @save-journey="saveJourney"
            />

            <DiscipleshipAssignmentsPanel
              v-else
              :assignment-filters="assignmentFilters"
              :assignment-form="assignmentForm"
              :assignments="assignments"
              :can-create-assignment="canCreateAssignment"
              :can-manage="canManage"
              :has-selected-journey="hasSelectedJourney"
              :pending="assignmentsPending"
              :progress-saving="progressSaving"
              :saving="savingAssignment"
              :stages="stages"
              :tasks="tasks"
              @assign="assignJourney"
              @refresh="refreshAssignments"
              @update-progress="updateProgress"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
