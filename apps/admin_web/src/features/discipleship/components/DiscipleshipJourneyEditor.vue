<script setup lang="ts">
import type {
  DiscipleshipJourneyCreateRequest,
  DiscipleshipStage,
  DiscipleshipTask,
  DiscipleshipTaskReferenceType
} from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import DiscipleshipJourneyFields from "./DiscipleshipJourneyFields.vue";
import DiscipleshipRecoveryAlerts from "./DiscipleshipRecoveryAlerts.vue";
import DiscipleshipStagesTable from "./DiscipleshipStagesTable.vue";
import DiscipleshipTasksTable from "./DiscipleshipTasksTable.vue";

type StageForm = {
  title: string;
  description: string;
  position: number;
};

type TaskForm = {
  stageId: string;
  title: string;
  description: string;
  referenceType: DiscipleshipTaskReferenceType;
  referenceId: string;
  required: boolean;
  position: number;
};

const props = defineProps<{
  canAddStage: boolean;
  canAddTask: boolean;
  canManage: boolean;
  canSaveJourney: boolean;
  journeyCommandError: string;
  journeyForm: DiscipleshipJourneyCreateRequest;
  journeyStatusItems: unknown[];
  lastCreatedStageId: string;
  savingJourney: boolean;
  savingStage: boolean;
  savingTask: boolean;
  stageForm: StageForm;
  stages: DiscipleshipStage[];
  structureCommandError: string;
  structureErrorMessage: string;
  structurePending: boolean;
  structureRefreshErrorMessage: string;
  taskForm: TaskForm;
  taskReferenceTypeItems: unknown[];
  tasks: DiscipleshipTask[];
}>();

defineEmits<{
  addStage: [];
  addTask: [];
  retryStructure: [];
  saveJourney: [];
}>();

const { t } = useI18n();

const stageOptions = computed(() => [
  { title: t("No stage"), value: "" },
  ...props.stages.map((stage) => ({
    title: `${stage.position + 1}. ${stage.title}`,
    value: stage.id
  }))
]);
</script>

<template>
  <div>
    <DiscipleshipRecoveryAlerts :error-message="journeyCommandError" />
    <DiscipleshipJourneyFields
      :can-manage="canManage"
      :can-save="canSaveJourney"
      :form="journeyForm"
      :saving="savingJourney"
      :status-items="journeyStatusItems"
      @save="$emit('saveJourney')"
    />

    <v-divider class="my-5" />

    <DiscipleshipRecoveryAlerts
      :error-message="structureErrorMessage || structureCommandError"
      :refresh-error-message="structureRefreshErrorMessage"
      @retry="$emit('retryStructure')"
    />
    <v-btn
      v-if="structureErrorMessage"
      class="mb-4"
      size="small"
      variant="tonal"
      @click="$emit('retryStructure')"
    >
      {{ t("common.refresh") }}
    </v-btn>

    <div class="text-subtitle-2 font-weight-bold">
      {{ t("Journey stage") }}
    </div>
    <div class="text-body-2 text-medium-emphasis mb-3">
      {{
        t("Stages are saved by the backend and can be selected when creating tasks.")
      }}
    </div>
    <v-alert
      v-if="lastCreatedStageId"
      class="mb-3"
      density="comfortable"
      type="success"
      variant="tonal"
    >
      {{ t("Last created stage") }}: {{ lastCreatedStageId }}
    </v-alert>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="stageForm.title"
          :disabled="!canManage || savingStage || Boolean(structureErrorMessage)"
          :label="t('Stage title')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model.number="stageForm.position"
          :disabled="!canManage || savingStage || Boolean(structureErrorMessage)"
          :label="t('Order')"
          density="compact"
          min="0"
          type="number"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn
          v-if="canManage"
          block
          color="primary"
          variant="tonal"
          :disabled="!canAddStage || savingStage"
          :loading="savingStage"
          @click="$emit('addStage')"
        >
          {{ t("Add stage") }}
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-textarea
          v-model="stageForm.description"
          :disabled="!canManage || savingStage || Boolean(structureErrorMessage)"
          :label="t('Description')"
          density="compact"
          rows="2"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <v-progress-linear
      v-if="structurePending"
      class="my-3"
      color="primary"
      indeterminate
    />
    <DiscipleshipStagesTable v-else :stages="stages" />

    <v-divider class="my-5" />

    <div class="text-subtitle-2 font-weight-bold">
      {{ t("Journey task") }}
    </div>
    <div class="text-body-2 text-medium-emphasis mb-3">
      {{ t("Tasks store only reference type and reference id.") }}
    </div>
    <v-row dense>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="taskForm.title"
          :disabled="!canManage || savingTask || Boolean(structureErrorMessage)"
          :label="t('Task title')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="taskForm.stageId"
          :disabled="!canManage || savingTask || Boolean(structureErrorMessage)"
          :items="stageOptions"
          :label="t('Stage')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model.number="taskForm.position"
          :disabled="!canManage || savingTask || Boolean(structureErrorMessage)"
          :label="t('Order')"
          density="compact"
          min="0"
          type="number"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="taskForm.referenceType"
          :disabled="!canManage || savingTask || Boolean(structureErrorMessage)"
          :items="taskReferenceTypeItems"
          :label="t('Reference type')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="taskForm.referenceId"
          :disabled="!canManage || savingTask || Boolean(structureErrorMessage)"
          :label="t('Reference ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-switch
          v-model="taskForm.required"
          :disabled="!canManage || savingTask || Boolean(structureErrorMessage)"
          :label="t('Required')"
          color="primary"
          hide-details
        />
      </v-col>
      <v-col cols="12">
        <v-textarea
          v-model="taskForm.description"
          :disabled="!canManage || savingTask || Boolean(structureErrorMessage)"
          :label="t('Description')"
          density="compact"
          rows="2"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12">
        <v-btn
          v-if="canManage"
          color="primary"
          variant="tonal"
          :disabled="!canAddTask || savingTask"
          :loading="savingTask"
          @click="$emit('addTask')"
        >
          {{ t("Add task") }}
        </v-btn>
      </v-col>
    </v-row>

    <DiscipleshipTasksTable
      v-if="!structurePending"
      :stages="stages"
      :tasks="tasks"
    />
  </div>
</template>
