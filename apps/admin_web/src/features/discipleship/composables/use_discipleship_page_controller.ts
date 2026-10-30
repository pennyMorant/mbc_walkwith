import type {
  DiscipleshipAssignmentCreateRequest,
  DiscipleshipJourney,
  DiscipleshipJourneyCreateRequest,
  DiscipleshipJourneyUpdateRequest,
  DiscipleshipStageCreateRequest,
  DiscipleshipTaskCreateRequest,
  DiscipleshipTaskProgressUpdateRequest,
  DiscipleshipTaskStatus
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createDiscipleshipAssignment,
  createDiscipleshipJourney,
  createDiscipleshipStage,
  createDiscipleshipTask,
  discipleshipAssignmentSourceTypeOptions,
  discipleshipAssignmentStatusOptions,
  discipleshipJourneyStatusOptions,
  discipleshipTaskReferenceTypeOptions,
  discipleshipTaskStatusOptions,
  updateDiscipleshipJourney,
  updateDiscipleshipTaskProgress
} from "@/core/api/discipleship";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

import {
  buildDiscipleshipAssignmentPayload,
  buildDiscipleshipJourneyPayload,
  buildDiscipleshipProgressPayload,
  buildDiscipleshipStagePayload,
  buildDiscipleshipTaskPayload,
  createDiscipleshipAssignmentForm,
  createDiscipleshipJourneyForm,
  createDiscipleshipStageForm,
  createDiscipleshipTaskForm,
  discipleshipCommandTargetsJourney,
  resetDiscipleshipAssignmentForm,
  resetDiscipleshipWorkForms
} from "../discipleship_workspace_models";
import { useDiscipleshipQueries } from "./use_discipleship_queries";

type JourneySaveIntent =
  | {
      journeyId: null;
      payload: DiscipleshipJourneyCreateRequest;
      type: "create";
    }
  | {
      journeyId: string;
      payload: DiscipleshipJourneyUpdateRequest;
      type: "update";
    };
type StageCreateIntent = {
  journeyId: string;
  payload: DiscipleshipStageCreateRequest;
};
type TaskCreateIntent = {
  journeyId: string;
  payload: DiscipleshipTaskCreateRequest;
};
type AssignmentCreateIntent = {
  journeyId: string;
  payload: DiscipleshipAssignmentCreateRequest;
};
type ProgressUpdateIntent = {
  assignmentId: string;
  journeyId: string;
  payload: DiscipleshipTaskProgressUpdateRequest;
  taskId: string;
};

export function useDiscipleshipPageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedJourney = ref<DiscipleshipJourney | null>(null);
  const activePanel = ref<"journey" | "assignments">("journey");
  const lastCreatedStageId = ref("");
  const journeyCommandError = ref("");
  const structureCommandError = ref("");
  const assignmentCommandError = ref("");
  const progressCommandError = ref("");
  const progressCommandErrorAssignmentId = ref("");
  const journeyForm = reactive(createDiscipleshipJourneyForm());
  const stageForm = reactive(createDiscipleshipStageForm());
  const taskForm = reactive(createDiscipleshipTaskForm());
  const assignmentForm = reactive(createDiscipleshipAssignmentForm());
  const queries = useDiscipleshipQueries(selectedJourney);

  const canManage = computed(() => authStore.can("discipleship:manage"));
  const savingJourney = computed(() => saveJourneyMutation.isPending.value);
  const savingStage = computed(() => createStageMutation.isPending.value);
  const savingTask = computed(() => createTaskMutation.isPending.value);
  const savingAssignment = computed(
    () => createAssignmentMutation.isPending.value
  );
  const progressSaving = computed(
    () => updateTaskProgressMutation.isPending.value
  );
  const hasSelectedJourney = computed(() => Boolean(selectedJourney.value));
  const taskReferenceReady = computed(
    () => taskForm.referenceType === "manual_review" || taskForm.referenceId.trim().length > 0
  );
  const canSaveJourney = computed(
    () => canManage.value && !savingJourney.value && journeyForm.title.trim().length > 0
  );
  const canAddStage = computed(
    () =>
      canManage.value &&
      !savingStage.value &&
      !savingTask.value &&
      Boolean(selectedJourney.value) &&
      !queries.structureInitialError.value &&
      stageForm.title.trim().length > 0
  );
  const canAddTask = computed(
    () =>
      canManage.value &&
      !savingTask.value &&
      !savingStage.value &&
      Boolean(selectedJourney.value) &&
      !queries.structureInitialError.value &&
      taskForm.title.trim().length > 0 &&
      taskReferenceReady.value
  );
  const canCreateAssignment = computed(
    () =>
      canManage.value &&
      !savingAssignment.value &&
      selectedJourney.value?.status === "active" &&
      assignmentForm.userId.trim().length > 0 &&
      (assignmentForm.sourceType === "member" ||
        Boolean(assignmentForm.sourceId?.trim()))
  );

  const listErrorMessage = queryErrorMessage(queries.journeysInitialError, "common.error");
  const listRefreshErrorMessage = queryErrorMessage(
    queries.journeysRefreshError,
    "discipleship.libraryRefreshFailed"
  );
  const structureErrorMessage = queryErrorMessage(queries.structureInitialError, "common.error");
  const structureRefreshErrorMessage = queryErrorMessage(
    queries.structureRefreshError,
    "discipleship.structureRefreshFailed"
  );
  const assignmentsErrorMessage = queryErrorMessage(
    queries.assignmentsInitialError,
    "common.error"
  );
  const assignmentsRefreshErrorMessage = queryErrorMessage(
    queries.assignmentsRefreshError,
    "discipleship.assignmentsRefreshFailed"
  );

  const saveJourneyMutation = useMutation({
    mutationFn: (intent: JourneySaveIntent) => intent.type === "create"
      ? createDiscipleshipJourney(intent.payload)
      : updateDiscipleshipJourney(intent.journeyId, intent.payload),
    onSuccess: async (journey, intent) => {
      if (commandTargetsSelection(intent.journeyId)) selectJourney(journey);
      await queryClient.invalidateQueries({ queryKey: ["discipleship-journeys"] });
    },
    onError: captureCommandError(journeyCommandError)
  });

  const createStageMutation = useMutation({
    mutationFn: (intent: StageCreateIntent) =>
      createDiscipleshipStage(intent.journeyId, intent.payload),
    onSuccess: async (stage, intent) => {
      if (commandTargetsSelection(intent.journeyId)) {
        lastCreatedStageId.value = stage.id;
        taskForm.stageId = stage.id;
        stageForm.title = "";
        stageForm.description = "";
        stageForm.position += 1;
      }
      await invalidateJourneyQuery("discipleship-stages", intent.journeyId);
    },
    onError: captureCommandError(structureCommandError)
  });

  const createTaskMutation = useMutation({
    mutationFn: (intent: TaskCreateIntent) =>
      createDiscipleshipTask(intent.journeyId, intent.payload),
    onSuccess: async (_task, intent) => {
      if (commandTargetsSelection(intent.journeyId)) {
        taskForm.title = "";
        taskForm.description = "";
        taskForm.referenceId = "";
        taskForm.position += 1;
      }
      await Promise.all([
        invalidateJourneyQuery("discipleship-tasks", intent.journeyId),
        invalidateJourneyQuery("discipleship-assignments", intent.journeyId)
      ]);
    },
    onError: captureCommandError(structureCommandError)
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (intent: AssignmentCreateIntent) =>
      createDiscipleshipAssignment(intent.payload),
    onSuccess: async (_assignment, intent) => {
      if (commandTargetsSelection(intent.journeyId)) {
        resetDiscipleshipAssignmentForm(assignmentForm, intent.journeyId);
      }
      await invalidateJourneyQuery(
        "discipleship-assignments",
        intent.journeyId
      );
    },
    onError: captureCommandError(assignmentCommandError)
  });

  const updateTaskProgressMutation = useMutation({
    mutationFn: (intent: ProgressUpdateIntent) =>
      updateDiscipleshipTaskProgress(
        intent.assignmentId,
        intent.taskId,
        intent.payload
      ),
    onSuccess: async (_progress, intent) => {
      await invalidateJourneyQuery(
        "discipleship-assignments",
        intent.journeyId
      );
    },
    onError: (error, intent) => {
      if (commandTargetsSelection(intent.journeyId)) {
        progressCommandError.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
        progressCommandErrorAssignmentId.value = intent.assignmentId;
      }
    }
  });

  function queryErrorMessage(error: { value: unknown }, fallbackKey: string) {
    return computed(() =>
      error.value
        ? formatApiErrorMessage(error.value, t(fallbackKey))
        : ""
    );
  }

  function commandTargetsSelection(journeyId: string | null) {
    return discipleshipCommandTargetsJourney(
      selectedJourney.value?.id ?? null,
      journeyId
    );
  }

  function captureCommandError(target: { value: string }) {
    return (error: unknown, intent: { journeyId: string | null }) => {
      if (commandTargetsSelection(intent.journeyId)) {
        target.value = formatApiErrorMessage(error, t("common.error"));
      }
    };
  }

  function invalidateJourneyQuery(key: string, journeyId: string) {
    return queryClient.invalidateQueries({ queryKey: [key, journeyId] });
  }

  function selectJourney(journey: DiscipleshipJourney) {
    clearCommandErrors();
    const journeyChanged = selectedJourney.value?.id !== journey.id;
    selectedJourney.value = journey;
    Object.assign(journeyForm, {
      title: journey.title,
      description: journey.description,
      status: journey.status
    });
    if (journeyChanged) {
      resetJourneyWorkForms();
      resetDiscipleshipAssignmentForm(assignmentForm, journey.id);
    } else {
      assignmentForm.journeyId = journey.id;
    }
  }

  function newJourney() {
    clearCommandErrors();
    selectedJourney.value = null;
    activePanel.value = "journey";
    resetJourneyWorkForms();
    Object.assign(journeyForm, createDiscipleshipJourneyForm());
    resetDiscipleshipAssignmentForm(assignmentForm, "");
  }

  function saveJourney() {
    if (!canSaveJourney.value) return;
    journeyCommandError.value = "";
    const journey = selectedJourney.value;
    saveJourneyMutation.mutate(journey
      ? {
          type: "update",
          journeyId: journey.id,
          payload: buildDiscipleshipJourneyPayload(journeyForm)
        }
      : { type: "create", journeyId: null, payload: buildDiscipleshipJourneyPayload(journeyForm) });
  }

  function addStage() {
    if (!canAddStage.value || !selectedJourney.value) return;
    structureCommandError.value = "";
    createStageMutation.mutate({
      journeyId: selectedJourney.value.id,
      payload: buildDiscipleshipStagePayload(stageForm)
    });
  }

  function addTask() {
    if (!canAddTask.value || !selectedJourney.value) return;
    structureCommandError.value = "";
    createTaskMutation.mutate({
      journeyId: selectedJourney.value.id,
      payload: buildDiscipleshipTaskPayload(taskForm)
    });
  }

  function assignJourney() {
    if (!canCreateAssignment.value || !selectedJourney.value) return;
    assignmentCommandError.value = "";
    createAssignmentMutation.mutate({
      journeyId: selectedJourney.value.id,
      payload: buildDiscipleshipAssignmentPayload(assignmentForm, selectedJourney.value.id)
    });
  }

  function updateProgress(input: {
    assignmentId: string;
    taskId: string;
    status: DiscipleshipTaskStatus;
    note: string;
  }) {
    const journey = selectedJourney.value;
    if (
      !canManage.value ||
      progressSaving.value ||
      !journey ||
      !queries.assignments.value.some(
        (item) => item.id === input.assignmentId
      ) ||
      !queries.tasks.value.some((task) => task.id === input.taskId)
    ) {
      return;
    }
    progressCommandError.value = "";
    progressCommandErrorAssignmentId.value = "";
    updateTaskProgressMutation.mutate({
      assignmentId: input.assignmentId,
      journeyId: journey.id,
      taskId: input.taskId,
      payload: buildDiscipleshipProgressPayload(input)
    });
  }

  function resetJourneyWorkForms() {
    lastCreatedStageId.value = "";
    resetDiscipleshipWorkForms(stageForm, taskForm);
  }

  function clearCommandErrors() {
    journeyCommandError.value = "";
    structureCommandError.value = "";
    assignmentCommandError.value = "";
    progressCommandError.value = "";
    progressCommandErrorAssignmentId.value = "";
  }

  return {
    activePanel,
    addStage,
    addTask,
    applyAssignmentFilters: queries.applyAssignmentFilters,
    applyJourneyFilters: queries.applyJourneyFilters,
    assignmentCommandError,
    assignmentFilters: queries.assignmentFilters,
    assignmentForm,
    assignments: queries.assignments,
    assignmentsErrorMessage,
    assignmentsFetching: queries.assignmentsQuery.isFetching,
    assignmentsPending: queries.assignmentsPending,
    assignmentsRefreshErrorMessage,
    assignmentSourceTypeItems: computed(() =>
      optionItems(discipleshipAssignmentSourceTypeOptions)
    ),
    assignmentStatusItems: computed(() =>
      optionItems(["", ...discipleshipAssignmentStatusOptions])
    ),
    assignJourney,
    canAddStage,
    canAddTask,
    canCreateAssignment,
    canManage,
    canSaveJourney,
    filters: queries.filters,
    hasSelectedJourney,
    journeyCommandError,
    journeyForm,
    journeys: queries.journeys,
    journeysFetching: queries.journeysQuery.isFetching,
    journeysPending: queries.journeysPending,
    journeyStatusItems: computed(() =>
      optionItems(discipleshipJourneyStatusOptions)
    ),
    lastCreatedStageId,
    listErrorMessage,
    listRefreshErrorMessage,
    newJourney,
    progressCommandError,
    progressCommandErrorAssignmentId,
    progressSaving,
    refreshAssignments: queries.assignmentsQuery.refetch,
    refreshJourneys: queries.journeysQuery.refetch,
    refreshStructure: queries.refreshStructure,
    saveJourney,
    savingAssignment,
    savingJourney,
    savingStage,
    savingTask,
    selectedJourney,
    selectJourney,
    stageForm,
    stages: queries.stages,
    structureCommandError,
    structureErrorMessage,
    structurePending: queries.structurePending,
    structureRefreshErrorMessage,
    t,
    taskForm,
    taskReferenceTypeItems: computed(() =>
      optionItems(discipleshipTaskReferenceTypeOptions)
    ),
    taskStatusItems: computed(() =>
      optionItems(discipleshipTaskStatusOptions)
    ),
    tasks: queries.tasks,
    updateProgress
  };
}
