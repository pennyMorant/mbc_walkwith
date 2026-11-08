<script setup lang="ts">
import type {
  DiscipleshipAssignment,
  DiscipleshipAssignmentCreateRequest,
  DiscipleshipAssignmentStatus,
  DiscipleshipStage,
  DiscipleshipTask,
  DiscipleshipTaskStatus
} from "@mbc/api-contracts";
import { computed, ref, watch } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";
import DiscipleshipAssignmentResults from "./DiscipleshipAssignmentResults.vue";
import DiscipleshipProgressDrawer from "./DiscipleshipProgressDrawer.vue";
import DiscipleshipRecoveryAlerts from "./DiscipleshipRecoveryAlerts.vue";

type AssignmentFilters = {
  status: DiscipleshipAssignmentStatus | "";
  userId: string;
};

const props = defineProps<{
  assignmentFilters: AssignmentFilters;
  assignmentForm: DiscipleshipAssignmentCreateRequest;
  assignments: DiscipleshipAssignment[];
  assignmentSourceTypeItems: unknown[];
  assignmentStatusItems: unknown[];
  canCreateAssignment: boolean;
  canManage: boolean;
  commandErrorMessage: string;
  errorMessage: string;
  fetching: boolean;
  hasSelectedJourney: boolean;
  pending: boolean;
  progressErrorMessage: string;
  progressErrorAssignmentId: string;
  progressSaving: boolean;
  refreshErrorMessage: string;
  saving: boolean;
  stages: DiscipleshipStage[];
  taskStatusItems: unknown[];
  tasks: DiscipleshipTask[];
}>();

defineEmits<{
  apply: [];
  assign: [];
  retry: [];
  updateProgress: [
    input: {
      assignmentId: string;
      taskId: string;
      status: DiscipleshipTaskStatus;
      note: string;
    }
  ];
}>();

const { t } = useI18n();
const progressDrawer = ref(false);
const selectedAssignmentId = ref<string | null>(null);

const selectedAssignment = computed(
  () =>
    props.assignments.find(
      (assignment) => assignment.id === selectedAssignmentId.value
    ) ?? null
);

watch(selectedAssignment, (assignment) => {
  if (!assignment) progressDrawer.value = false;
});

function openProgress(assignment: DiscipleshipAssignment) {
  selectedAssignmentId.value = assignment.id;
  progressDrawer.value = true;
}

</script>

<template>
  <div>
    <AdminFilterToolbar @apply="$emit('apply')">
      <template #heading>
        <div class="text-subtitle-2 font-weight-bold">
          {{ t("Journey assignments") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Assignments connect a member or newcomer to the selected journey.") }}
        </div>
      </template>
      <v-select
        v-model="assignmentFilters.status"
        class="admin-filter-control"
        :items="assignmentStatusItems"
        :label="t('Status')"
        density="compact"
        hide-details
        variant="outlined"
      />
      <v-text-field
        v-model="assignmentFilters.userId"
        class="admin-filter-control"
        :label="t('User ID')"
        density="compact"
        hide-details
        variant="outlined"
      />
      <template #actions>
        <v-btn type="submit" variant="tonal" :loading="fetching">
          {{ t("common.go") }}
        </v-btn>
      </template>
    </AdminFilterToolbar>

    <DiscipleshipRecoveryAlerts
      class="mt-4"
      :error-message="commandErrorMessage"
      :refresh-error-message="refreshErrorMessage"
      @retry="$emit('retry')"
    />

    <v-alert
      v-if="errorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
    >
      <div class="d-flex align-center justify-space-between ga-3">
        <span>{{ errorMessage }}</span>
        <v-btn size="small" variant="text" @click="$emit('retry')">
          {{ t("common.refresh") }}
        </v-btn>
      </div>
    </v-alert>

    <v-progress-linear
      v-else-if="pending"
      class="mt-4"
      color="primary"
      indeterminate
    />

    <DiscipleshipAssignmentResults
      v-else
      :assignments="assignments"
      :has-tasks="tasks.length > 0"
      @manage-progress="openProgress"
    />

    <v-divider class="my-5" />

    <v-row dense>
      <v-col cols="12" md="3">
        <v-select
          v-model="assignmentForm.sourceType"
          :disabled="!canManage || !hasSelectedJourney || saving"
          :items="assignmentSourceTypeItems"
          :label="t('Source type')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="assignmentForm.userId"
          :disabled="!canManage || !hasSelectedJourney || saving"
          :label="t('User ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="assignmentForm.sourceId"
          :disabled="!canManage || !hasSelectedJourney || saving"
          :label="t('Source ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="assignmentForm.assigneeName"
          :disabled="!canManage || !hasSelectedJourney || saving"
          :label="t('Assignee')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="assignmentForm.assigneeAdminUserId"
          :disabled="!canManage || !hasSelectedJourney || saving"
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
      :error-message="
        selectedAssignmentId === progressErrorAssignmentId
          ? progressErrorMessage
          : ''
      "
      :saving="progressSaving"
      :stages="stages"
      :status-items="taskStatusItems"
      :tasks="tasks"
      @save="$emit('updateProgress', $event)"
    />
  </div>
</template>
