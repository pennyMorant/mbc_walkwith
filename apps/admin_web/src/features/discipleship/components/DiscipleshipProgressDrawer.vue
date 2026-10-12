<script setup lang="ts">
import type {
  DiscipleshipAssignment,
  DiscipleshipStage,
  DiscipleshipTask,
  DiscipleshipTaskProgress,
  DiscipleshipTaskStatus
} from "@mbc/api-contracts";
import { computed, reactive, watch } from "vue";

import { discipleshipTaskStatusOptions } from "@/core/api/discipleship";
import { useI18n } from "@/core/i18n/i18n";

type TaskDraft = {
  status: DiscipleshipTaskStatus;
  note: string;
};

defineOptions({
  name: "DiscipleshipProgressDrawer"
});

const drawer = defineModel<boolean>({ required: true });

const props = defineProps<{
  assignment: DiscipleshipAssignment | null;
  canManage: boolean;
  saving: boolean;
  stages: DiscipleshipStage[];
  tasks: DiscipleshipTask[];
}>();

const emit = defineEmits<{
  save: [
    input: {
      assignmentId: string;
      taskId: string;
      status: DiscipleshipTaskStatus;
      note: string;
    }
  ];
}>();

const { optionItems, t } = useI18n();
const drafts = reactive<Record<string, TaskDraft>>({});

const statusItems = computed(() => optionItems(discipleshipTaskStatusOptions));
const taskRows = computed(() =>
  props.tasks.map((task) => ({
    task,
    draft: draftForTask(task.id)
  }))
);

watch(
  () => [
    props.assignment?.id,
    props.assignment?.updatedAt,
    props.tasks.map((task) => task.id).join("|")
  ],
  syncDrafts,
  { immediate: true }
);

function syncDrafts() {
  for (const key of Object.keys(drafts)) {
    delete drafts[key];
  }
  for (const task of props.tasks) {
    const progress = progressForTask(task.id);
    drafts[task.id] = {
      status: progress?.status ?? "available",
      note: progress?.note ?? ""
    };
  }
}

function progressForTask(taskId: string): DiscipleshipTaskProgress | undefined {
  return props.assignment?.progress.find((item) => item.taskId === taskId);
}

function draftForTask(taskId: string): TaskDraft {
  if (!drafts[taskId]) {
    drafts[taskId] = { status: "available", note: "" };
  }
  return drafts[taskId];
}

function baselineForTask(taskId: string): TaskDraft {
  const progress = progressForTask(taskId);
  return {
    status: progress?.status ?? "available",
    note: progress?.note.trim() ?? ""
  };
}

function isTaskDirty(taskId: string, draft: TaskDraft) {
  const baseline = baselineForTask(taskId);
  return (
    draft.status !== baseline.status || draft.note.trim() !== baseline.note
  );
}

function stageTitle(stageId: string | null) {
  if (!stageId) {
    return t("No stage");
  }
  return props.stages.find((stage) => stage.id === stageId)?.title ?? stageId;
}

function statusColor(status: DiscipleshipTaskStatus) {
  return {
    locked: "grey",
    available: "info",
    in_progress: "primary",
    completed: "success",
    skipped: "secondary",
    needs_review: "warning"
  }[status];
}

function saveTask(task: DiscipleshipTask, draft: TaskDraft) {
  if (
    !props.canManage ||
    props.saving ||
    !props.assignment ||
    !isTaskDirty(task.id, draft)
  ) {
    return;
  }
  emit("save", {
    assignmentId: props.assignment.id,
    taskId: task.id,
    status: draft.status,
    note: draft.note.trim()
  });
}
</script>

<template>
  <v-navigation-drawer v-model="drawer" location="right" temporary width="680">
    <div v-if="assignment" class="pa-5">
      <div class="d-flex align-start justify-space-between ga-4">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ t("Manage progress") }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ assignment.userId }}
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="drawer = false" />
      </div>

      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-chip size="small" variant="tonal">
          {{ t(assignment.sourceType) }}
        </v-chip>
        <v-chip size="small" variant="tonal">
          {{ assignment.assigneeName || t("common.notSet") }}
        </v-chip>
        <v-chip size="small" variant="tonal" color="primary">
          {{ assignment.completedTaskCount }}/{{ assignment.taskTotalCount }}
        </v-chip>
      </div>

      <v-alert v-if="tasks.length === 0" class="mt-5" type="info" variant="tonal">
        {{ t("No tasks yet.") }}
      </v-alert>

      <div v-for="row in taskRows" :key="row.task.id" class="mt-4">
        <v-card variant="outlined">
          <v-card-text>
            <div class="d-flex align-start justify-space-between ga-3">
              <div>
                <div class="font-weight-bold">{{ row.task.title }}</div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ stageTitle(row.task.stageId) }}
                  <span> · {{ t(row.task.referenceType) }}</span>
                  <span v-if="row.task.referenceId">
                    · {{ row.task.referenceId }}
                  </span>
                </div>
              </div>
              <div class="d-flex ga-2">
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="statusColor(row.draft.status)"
                >
                  {{ t(row.draft.status) }}
                </v-chip>
                <v-chip v-if="row.task.required" size="x-small" variant="tonal">
                  {{ t("Required") }}
                </v-chip>
              </div>
            </div>

            <div
              v-if="row.task.description"
              class="text-body-2 text-medium-emphasis mt-3"
            >
              {{ row.task.description }}
            </div>

            <v-row class="mt-3" dense>
              <v-col cols="12" md="5">
                <v-select
                  v-model="row.draft.status"
                  :disabled="!canManage || saving"
                  :items="statusItems"
                  :label="t('Status')"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="7">
                <v-textarea
                  v-model="row.draft.note"
                  :disabled="!canManage || saving"
                  :label="t('Note')"
                  auto-grow
                  density="compact"
                  rows="1"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" class="d-flex justify-end">
                <v-btn
                  v-if="canManage"
                  color="primary"
                  :disabled="saving || !isTaskDirty(row.task.id, row.draft)"
                  :loading="saving"
                  variant="tonal"
                  @click="saveTask(row.task, row.draft)"
                >
                  {{ t("Save progress") }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </v-navigation-drawer>
</template>
