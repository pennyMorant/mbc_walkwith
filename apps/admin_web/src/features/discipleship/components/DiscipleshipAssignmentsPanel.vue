<script setup lang="ts">
import type {
  DiscipleshipAssignment,
  DiscipleshipAssignmentCreateRequest,
  DiscipleshipAssignmentStatus,
  DiscipleshipStage,
  DiscipleshipTask,
  DiscipleshipTaskStatus
} from "@mbc/api-contracts";
import { computed, ref } from "vue";

import {
  discipleshipAssignmentSourceTypeOptions,
  discipleshipAssignmentStatusOptions
} from "@/core/api/discipleship";
import { useI18n } from "@/core/i18n/i18n";
import DiscipleshipProgressDrawer from "./DiscipleshipProgressDrawer.vue";

type AssignmentFilters = {
  status: DiscipleshipAssignmentStatus | "";
  userId: string;
};

const props = defineProps<{
  assignmentFilters: AssignmentFilters;
  assignmentForm: DiscipleshipAssignmentCreateRequest;
  assignments: DiscipleshipAssignment[];
  canCreateAssignment: boolean;
  canManage: boolean;
  hasSelectedJourney: boolean;
  pending: boolean;
  progressSaving: boolean;
  saving: boolean;
  stages: DiscipleshipStage[];
  tasks: DiscipleshipTask[];
}>();

defineEmits<{
  assign: [];
  refresh: [];
  updateProgress: [
    input: {
      assignmentId: string;
      taskId: string;
      status: DiscipleshipTaskStatus;
      note: string;
    }
  ];
}>();

const { optionItems, t } = useI18n();
const progressDrawer = ref(false);
const selectedAssignmentId = ref<string | null>(null);

const selectedAssignment = computed(
  () =>
    props.assignments.find(
      (assignment) => assignment.id === selectedAssignmentId.value
    ) ?? null
);

function openProgress(assignment: DiscipleshipAssignment) {
  selectedAssignmentId.value = assignment.id;
  progressDrawer.value = true;
}

function assignmentStatusColor(status: DiscipleshipAssignmentStatus) {
  return {
    not_started: "grey",
    in_progress: "info",
    blocked: "warning",
    completed: "success",
    paused: "secondary",
    cancelled: "error"
  }[status];
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-md-row justify-space-between ga-3">
      <div>
        <div class="text-subtitle-2 font-weight-bold">
          {{ t("Journey assignments") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Assignments connect a member or newcomer to the selected journey.") }}
        </div>
      </div>
      <div class="d-flex flex-column flex-sm-row ga-2">
        <v-select
          v-model="assignmentFilters.status"
          :items="optionItems(['', ...discipleshipAssignmentStatusOptions])"
          :label="t('Status')"
          density="compact"
          hide-details
          style="min-width: 180px"
          variant="outlined"
          @update:model-value="$emit('refresh')"
        />
        <v-text-field
          v-model="assignmentFilters.userId"
          :label="t('User ID')"
          density="compact"
          hide-details
          style="min-width: 200px"
          variant="outlined"
          @keyup.enter="$emit('refresh')"
        />
        <v-btn variant="tonal" @click="$emit('refresh')">
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

    <v-table v-else class="mt-4" density="comfortable">
      <thead>
        <tr>
          <th>{{ t("User") }}</th>
          <th>{{ t("Source") }}</th>
          <th>{{ t("Assignee") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Progress") }}</th>
          <th>{{ t("Actions") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="assignments.length === 0">
          <td colspan="6">{{ t("No journey assignments yet.") }}</td>
        </tr>
        <tr v-for="assignment in assignments" :key="assignment.id">
          <td>
            <div class="font-weight-medium">{{ assignment.userId }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ assignment.sourceId || t("common.notSet") }}
            </div>
          </td>
          <td>{{ t(assignment.sourceType) }}</td>
          <td>{{ assignment.assigneeName || t("common.notSet") }}</td>
          <td>
            <v-chip
              size="small"
              variant="tonal"
              :color="assignmentStatusColor(assignment.status)"
            >
              {{ t(assignment.status) }}
            </v-chip>
          </td>
          <td>
            <div class="font-weight-medium">
              {{ assignment.completedTaskCount }}/{{ assignment.taskTotalCount }}
            </div>
            <div v-if="assignment.progress.length === 0">
              {{ t("No progress yet.") }}
            </div>
            <div
              v-for="progress in assignment.progress"
              :key="progress.id"
              class="text-caption"
            >
              {{ progress.taskId }} · {{ t(progress.status) }}
            </div>
          </td>
          <td>
            <v-btn
              size="small"
              variant="tonal"
              :disabled="tasks.length === 0"
              @click="openProgress(assignment)"
            >
              {{ t("Manage progress") }}
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-divider class="my-5" />

    <v-row dense>
      <v-col cols="12" md="3">
        <v-select
          v-model="assignmentForm.sourceType"
          :disabled="!canManage || !hasSelectedJourney"
          :items="optionItems(discipleshipAssignmentSourceTypeOptions)"
          :label="t('Source type')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="assignmentForm.userId"
          :disabled="!canManage || !hasSelectedJourney"
          :label="t('User ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="assignmentForm.sourceId"
          :disabled="!canManage || !hasSelectedJourney"
          :label="t('Source ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="assignmentForm.assigneeName"
          :disabled="!canManage || !hasSelectedJourney"
          :label="t('Assignee')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="assignmentForm.assigneeAdminUserId"
          :disabled="!canManage || !hasSelectedJourney"
          :label="t('Assignee admin user ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn
          v-if="canManage"
          block
          color="primary"
          :disabled="!canCreateAssignment || saving"
          :loading="saving"
          @click="$emit('assign')"
        >
          {{ t("Assign") }}
        </v-btn>
      </v-col>
    </v-row>

    <DiscipleshipProgressDrawer
      v-model="progressDrawer"
      :assignment="selectedAssignment"
      :can-manage="canManage"
      :saving="progressSaving"
      :stages="stages"
      :tasks="tasks"
      @save="$emit('updateProgress', $event)"
    />
  </div>
</template>
