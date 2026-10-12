import type {
  DiscipleshipAssignmentStatus,
  DiscipleshipJourney,
  DiscipleshipJourneyStatus,
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
  discipleshipJourneyStatusOptions,
  discipleshipTaskReferenceTypeOptions,
  updateDiscipleshipJourney,
  updateDiscipleshipTaskProgress
} from "@/core/api/discipleship";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import { useDiscipleshipMutationError } from "./use_discipleship_mutation_error";
import { useDiscipleshipQueries } from "./use_discipleship_queries";
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
  discipleshipJourneyStatusColor,
  resetDiscipleshipAssignmentForm,
  resetDiscipleshipWorkForms
} from "../discipleship_workspace_models";

export function useDiscipleshipPageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();

  const selectedJourney = ref<DiscipleshipJourney | null>(null);
  const activePanel = ref<"journey" | "assignments">("journey");
  const lastCreatedStageId = ref("");
  const mutationError = useDiscipleshipMutationError(selectedJourney);

  const filters = reactive({
    query: "",
    status: "" as DiscipleshipJourneyStatus | ""
  });

  const assignmentFilters = reactive({
    status: "" as DiscipleshipAssignmentStatus | "",
    userId: ""
  });

  const journeyForm = reactive(createDiscipleshipJourneyForm());
  const stageForm = reactive(createDiscipleshipStageForm());
  const taskForm = reactive(createDiscipleshipTaskForm());
  const assignmentForm = reactive(createDiscipleshipAssignmentForm());

  const {
    assignments,
    assignmentsPending,
    assignmentsQuery,
    journeys,
    journeysPending,
    journeysQuery,
    queryError,
    stages,
    structurePending,
    tasks
  } = useDiscipleshipQueries(selectedJourney, filters, assignmentFilters);

  const saveJourneyMutation = useMutation({
    onMutate: mutationError.begin,
    mutationFn: () => {
      requireCanManage();
      if (!canSaveJourney.value) {
        throw new Error(t("Journey title is required."));
      }
      return selectedJourney.value
        ? updateDiscipleshipJourney(
            selectedJourney.value.id,
            buildDiscipleshipJourneyPayload(journeyForm)
          )
        : createDiscipleshipJourney(
            buildDiscipleshipJourneyPayload(journeyForm)
          );
    },
    onSuccess: async (journey, _variables, context) => {
      if (mutationError.isCurrent(context?.journeyId ?? null)) {
        selectJourney(journey);
      }
      await queryClient.invalidateQueries({
        queryKey: ["discipleship-journeys"]
      });
    },
    onError: mutationError.capture
  });

  const createStageMutation = useMutation({
    onMutate: mutationError.begin,
    mutationFn: () => {
      requireCanManage();
      if (!canAddStage.value) {
        throw new Error(t("Stage title is required."));
      }
      const journey = requireSelectedJourney();
      return createDiscipleshipStage(
        journey.id,
        buildDiscipleshipStagePayload(stageForm)
      );
    },
    onSuccess: async (stage, _variables, context) => {
      if (mutationError.isCurrent(context?.journeyId ?? null)) {
        lastCreatedStageId.value = stage.id;
        taskForm.stageId = stage.id;
        stageForm.title = "";
        stageForm.description = "";
        stageForm.sortOrder += 1;
      }
      await queryClient.invalidateQueries({
        queryKey: ["discipleship-stages"]
      });
    },
    onError: mutationError.capture
  });

  const createTaskMutation = useMutation({
    onMutate: mutationError.begin,
    mutationFn: () => {
      requireCanManage();
      if (!canAddTask.value) {
        throw new Error(t("Task title and reference are required."));
      }
      const journey = requireSelectedJourney();
      return createDiscipleshipTask(
        journey.id,
        buildDiscipleshipTaskPayload(taskForm)
      );
    },
    onSuccess: async (_task, _variables, context) => {
      if (mutationError.isCurrent(context?.journeyId ?? null)) {
        taskForm.title = "";
        taskForm.description = "";
        taskForm.referenceId = "";
        taskForm.sortOrder += 1;
      }
      await queryClient.invalidateQueries({
        queryKey: ["discipleship-tasks"]
      });
      await queryClient.invalidateQueries({
        queryKey: ["discipleship-assignments"]
      });
    },
    onError: mutationError.capture
  });

  const createAssignmentMutation = useMutation({
    onMutate: mutationError.begin,
    mutationFn: () => {
      requireCanManage();
      if (!canCreateAssignment.value) {
        throw new Error(t("Only active journeys can be assigned."));
      }
      const journey = requireSelectedJourney();
      return createDiscipleshipAssignment(
        buildDiscipleshipAssignmentPayload(assignmentForm, journey.id)
      );
    },
    onSuccess: async (_assignment, _variables, context) => {
      if (mutationError.isCurrent(context?.journeyId ?? null)) {
        assignmentForm.userId = "";
        assignmentForm.sourceId = null;
      }
      await queryClient.invalidateQueries({
        queryKey: ["discipleship-assignments"]
      });
    },
    onError: mutationError.capture
  });

  const updateTaskProgressMutation = useMutation({
    onMutate: mutationError.begin,
    mutationFn: (input: {
      assignmentId: string;
      taskId: string;
      status: DiscipleshipTaskStatus;
      note: string;
    }) => {
      requireCanManage();
      if (!assignments.value.some((item) => item.id === input.assignmentId)) {
        throw new Error(t("No journey assignment selected."));
      }
      if (!tasks.value.some((task) => task.id === input.taskId)) {
        throw new Error(t("Task is not part of the selected journey."));
      }
      return updateDiscipleshipTaskProgress(
        input.assignmentId,
        input.taskId,
        buildDiscipleshipProgressPayload(input)
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["discipleship-assignments"]
      });
    },
    onError: mutationError.capture
  });

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
    () =>
      taskForm.referenceType === "manual_review" ||
      taskForm.referenceId.trim().length > 0
  );
  const canSaveJourney = computed(
    () =>
      canManage.value &&
      !savingJourney.value &&
      journeyForm.title.trim().length > 0
  );
  const canAddStage = computed(
    () =>
      canManage.value &&
      !savingStage.value &&
      Boolean(selectedJourney.value) &&
      stageForm.title.trim().length > 0
  );
  const canAddTask = computed(
    () =>
      canManage.value &&
      !savingTask.value &&
      Boolean(selectedJourney.value) &&
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
  const queryErrorMessage = computed(() => {
    const error = queryError.value;
    return error ? formatApiErrorMessage(error, t("common.error")) : "";
  });
  const errorMessage = computed(
    () => queryErrorMessage.value || mutationError.message.value
  );

  function selectJourney(journey: DiscipleshipJourney) {
    mutationError.clear();
    const journeyChanged = selectedJourney.value?.id !== journey.id;
    selectedJourney.value = journey;
    journeyForm.title = journey.title;
    journeyForm.description = journey.description;
    journeyForm.status = journey.status;
    if (journeyChanged) {
      resetJourneyWorkForms();
      resetAssignmentForm(journey.id);
    } else {
      assignmentForm.journeyId = journey.id;
    }
  }

  function newJourney() {
    mutationError.clear();
    selectedJourney.value = null;
    activePanel.value = "journey";
    resetJourneyWorkForms();
    journeyForm.title = "";
    journeyForm.description = "";
    journeyForm.status = "draft";
    resetAssignmentForm("");
  }

  function refreshJourneys() {
    void journeysQuery.refetch();
  }

  function refreshAssignments() {
    void assignmentsQuery.refetch();
  }

  function saveJourney() {
    if (canSaveJourney.value) {
      saveJourneyMutation.mutate(undefined);
    }
  }

  function addStage() {
    if (canAddStage.value) {
      createStageMutation.mutate(undefined);
    }
  }

  function addTask() {
    if (canAddTask.value) {
      createTaskMutation.mutate(undefined);
    }
  }

  function assignJourney() {
    if (canCreateAssignment.value) {
      createAssignmentMutation.mutate(undefined);
    }
  }

  function updateProgress(input: {
    assignmentId: string;
    taskId: string;
    status: DiscipleshipTaskStatus;
    note: string;
  }) {
    if (canManage.value && !progressSaving.value) {
      updateTaskProgressMutation.mutate(input);
    }
  }

  function resetJourneyWorkForms() {
    lastCreatedStageId.value = "";
    resetDiscipleshipWorkForms(stageForm, taskForm);
  }

  function resetAssignmentForm(journeyId: string) {
    resetDiscipleshipAssignmentForm(assignmentForm, journeyId);
  }

  function requireSelectedJourney() {
    if (!selectedJourney.value) {
      throw new Error(t("No discipleship journey selected."));
    }
    return selectedJourney.value;
  }

  function requireCanManage() {
    if (!canManage.value) {
      throw new Error(
        t("You do not have permission to manage discipleship journeys.")
      );
    }
  }

  return {
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
    errorMessage,
    filters,
    hasSelectedJourney,
    journeyForm,
    journeys,
    journeyStatusColor: discipleshipJourneyStatusColor,
    journeysPending,
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
    updateProgress
  };
}
