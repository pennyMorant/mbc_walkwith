import type {
  ReadingPlan,
  ReadingPlanAssignmentCreateRequest,
  ReadingPlanCreateRequest,
  ReadingPlanDayUpsertRequest,
  ReadingPlanUpdateRequest
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createReadingPlan,
  createReadingPlanAssignment,
  readingPlanAssignmentSourceTypeOptions,
  readingPlanAssignmentStatusOptions,
  readingPlanStatusOptions,
  readingPlanUserTypeOptions,
  readingPlanVisibilityOptions,
  updateReadingPlan,
  upsertReadingPlanDay
} from "@/core/api/reading_plans";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

import {
  readingPlanAssignmentPayload,
  readingPlanCreatePayload,
  readingPlanDayPayload,
  readingPlanUpdatePayload
} from "../reading_plan_form_payloads";
import {
  allowedReadingPlanStatuses,
  readingPlanContentIsLocked,
  readingPlanDayIsEditable,
  readingPlanVisibilityAllowsUserType
} from "../reading_plan_ui_rules";
import {
  createReadingPlanAssignmentForm,
  createReadingPlanForm,
  fillReadingPlanForm,
  readingPlanCommandTargetsSelection,
  resetReadingPlanAssignmentTarget,
  resetReadingPlanForm
} from "../reading_plan_workspace_models";
import { useReadingPlanDayForm } from "./use_reading_plan_day_form";
import { useReadingPlanQueries } from "./use_reading_plan_queries";

type PlanSaveIntent =
  | { planId: null; payload: ReadingPlanCreateRequest; type: "create" }
  | { planId: string; payload: ReadingPlanUpdateRequest; type: "update" };

type DaySaveIntent = {
  planId: string;
  payload: ReadingPlanDayUpsertRequest;
};

type AssignmentCreateIntent = {
  planId: string;
  payload: ReadingPlanAssignmentCreateRequest;
};

export function useReadingPlansPage() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedPlan = ref<ReadingPlan | null>(null);
  const activePanel = ref<"days" | "assignments">("days");
  const planErrorMessage = ref("");
  const dayErrorMessage = ref("");
  const assignmentErrorMessage = ref("");
  const planForm = reactive(createReadingPlanForm());
  const assignmentForm = reactive(createReadingPlanAssignmentForm());
  const queries = useReadingPlanQueries(selectedPlan);
  const {
    clearTextAfterSave,
    dayForm,
    resetForNewPlan: resetDayFormForNewPlan,
    resetForPlan: resetDayFormForPlan
  } = useReadingPlanDayForm(selectedPlan, queries.daysQuery.data);

  const canManage = computed(() => authStore.can("reading_plans:manage"));
  const canSavePlan = computed(
    () => planForm.title.trim().length > 0 && planForm.durationDays > 0
  );
  const planContentLocked = computed(() =>
    readingPlanContentIsLocked(selectedPlan.value?.status)
  );
  const allowedPlanStatuses = computed(() =>
    allowedReadingPlanStatuses(selectedPlan.value?.status)
  );
  const planStructureLocked = computed(
    () =>
      Boolean(selectedPlan.value) &&
      (!queries.assignmentPresenceQuery.isSuccess.value ||
        (queries.assignmentPresenceQuery.data.value?.length ?? 0) > 0)
  );
  const canUpsertDay = computed(
    () =>
      Boolean(selectedPlan.value) &&
      !planStructureLocked.value &&
      readingPlanDayIsEditable(selectedPlan.value?.status) &&
      dayForm.dayNumber <= (selectedPlan.value?.durationDays ?? 0) &&
      dayForm.bookId.trim().length > 0 &&
      dayForm.chapter > 0 &&
      dayForm.startVerse > 0 &&
      dayForm.endVerse >= dayForm.startVerse
  );
  const canCreateAssignment = computed(
    () =>
      Boolean(
        selectedPlan.value &&
          selectedPlan.value.status === "published" &&
          assignmentForm.userId.trim().length > 0 &&
          readingPlanVisibilityAllowsUserType(
            selectedPlan.value.visibility,
            assignmentForm.userType
          )
      )
  );
  const localeItems = computed(() => [
    { title: t("locale.zh-Hans"), value: "zh-Hans" },
    { title: t("locale.zh-Hant"), value: "zh-Hant" },
    { title: t("locale.en"), value: "en" },
    { title: t("locale.es"), value: "es" }
  ]);

  const plansErrorMessage = queryErrorMessage(
    queries.plansInitialError,
    "common.error"
  );
  const plansRefreshErrorMessage = queryErrorMessage(
    queries.plansRefreshError,
    "readingPlans.libraryRefreshFailed"
  );
  const daysErrorMessage = queryErrorMessage(
    queries.daysInitialError,
    "common.error"
  );
  const daysRefreshErrorMessage = queryErrorMessage(
    queries.daysRefreshError,
    "readingPlans.daysRefreshFailed"
  );
  const assignmentsErrorMessage = queryErrorMessage(
    queries.assignmentsInitialError,
    "common.error"
  );
  const assignmentsRefreshErrorMessage = queryErrorMessage(
    queries.assignmentsRefreshError,
    "readingPlans.assignmentsRefreshFailed"
  );

  const savePlanMutation = useMutation({
    mutationFn: (intent: PlanSaveIntent) =>
      intent.type === "create"
        ? createReadingPlan(intent.payload)
        : updateReadingPlan(intent.planId, intent.payload),
    onSuccess: async (plan, intent) => {
      if (
        readingPlanCommandTargetsSelection(
          selectedPlan.value?.id ?? null,
          intent.planId
        )
      ) {
        selectPlan(plan);
      }
      await queryClient.invalidateQueries({ queryKey: ["reading-plans"] });
    },
    onError: (error, intent) => {
      if (
        readingPlanCommandTargetsSelection(
          selectedPlan.value?.id ?? null,
          intent.planId
        )
      ) {
        planErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    }
  });

  const upsertDayMutation = useMutation({
    mutationFn: (intent: DaySaveIntent) =>
      upsertReadingPlanDay(intent.planId, intent.payload),
    onSuccess: async (_day, intent) => {
      if (selectedPlan.value?.id === intent.planId) clearTextAfterSave();
      await queryClient.invalidateQueries({
        queryKey: ["reading-plan-days", intent.planId]
      });
      await queryClient.invalidateQueries({ queryKey: ["reading-plans"] });
    },
    onError: (error, intent) => {
      if (selectedPlan.value?.id === intent.planId) {
        dayErrorMessage.value = formatApiErrorMessage(error, t("common.error"));
      }
    }
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (intent: AssignmentCreateIntent) =>
      createReadingPlanAssignment(intent.payload),
    onSuccess: async (_assignment, intent) => {
      if (selectedPlan.value?.id === intent.planId) {
        resetReadingPlanAssignmentTarget(assignmentForm, intent.planId);
      }
      await queryClient.invalidateQueries({
        queryKey: ["reading-plan-assignments", intent.planId]
      });
      await queryClient.invalidateQueries({
        queryKey: ["reading-plan-assignment-presence", intent.planId]
      });
    },
    onError: (error, intent) => {
      if (selectedPlan.value?.id === intent.planId) {
        assignmentErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    }
  });

  function queryErrorMessage(
    error: { value: unknown },
    fallbackKey: string
  ) {
    return computed(() =>
      error.value
        ? formatApiErrorMessage(error.value, t(fallbackKey))
        : ""
    );
  }

  function selectPlan(plan: ReadingPlan) {
    clearCommandErrors();
    selectedPlan.value = plan;
    fillReadingPlanForm(planForm, plan);
    resetReadingPlanAssignmentTarget(assignmentForm, plan.id);
    resetDayFormForPlan(plan);
  }

  function newPlan() {
    clearCommandErrors();
    selectedPlan.value = null;
    activePanel.value = "days";
    resetReadingPlanForm(planForm);
    resetReadingPlanAssignmentTarget(assignmentForm, "");
    resetDayFormForNewPlan();
  }

  function savePlan() {
    if (!canManage.value || !canSavePlan.value || savePlanMutation.isPending.value) {
      return;
    }
    planErrorMessage.value = "";
    const plan = selectedPlan.value;
    savePlanMutation.mutate(
      plan
        ? {
            type: "update",
            planId: plan.id,
            payload: readingPlanUpdatePayload(planForm)
          }
        : {
            type: "create",
            planId: null,
            payload: readingPlanCreatePayload(planForm)
          }
    );
  }

  function saveDay() {
    if (
      !canManage.value ||
      !canUpsertDay.value ||
      upsertDayMutation.isPending.value ||
      !selectedPlan.value
    ) {
      return;
    }
    dayErrorMessage.value = "";
    upsertDayMutation.mutate({
      planId: selectedPlan.value.id,
      payload: readingPlanDayPayload(dayForm)
    });
  }

  function assignPlan() {
    if (
      !canManage.value ||
      !canCreateAssignment.value ||
      createAssignmentMutation.isPending.value ||
      !selectedPlan.value
    ) {
      return;
    }
    assignmentErrorMessage.value = "";
    createAssignmentMutation.mutate({
      planId: selectedPlan.value.id,
      payload: readingPlanAssignmentPayload(
        selectedPlan.value.id,
        assignmentForm
      )
    });
  }

  function clearCommandErrors() {
    planErrorMessage.value = "";
    dayErrorMessage.value = "";
    assignmentErrorMessage.value = "";
  }

  return {
    activePanel,
    allowedPlanStatuses,
    applyAssignmentFilters: queries.applyAssignmentFilters,
    applyPlanFilters: queries.applyPlanFilters,
    assignPlan,
    assignmentErrorMessage,
    assignmentFilters: queries.assignmentFilters,
    assignmentForm,
    assignments: queries.assignments,
    assignmentsErrorMessage,
    assignmentsQuery: queries.assignmentsQuery,
    assignmentsRefreshErrorMessage,
    assignmentSourceTypeItems: computed(() =>
      optionItems(readingPlanAssignmentSourceTypeOptions)
    ),
    assignmentStatusItems: computed(() =>
      optionItems(["", ...readingPlanAssignmentStatusOptions])
    ),
    assignmentUserTypeItems: computed(() =>
      optionItems(readingPlanUserTypeOptions)
    ),
    canCreateAssignment,
    canManage,
    canSavePlan,
    canUpsertDay,
    createAssignmentMutation,
    dayErrorMessage,
    dayForm,
    days: queries.days,
    daysErrorMessage,
    daysQuery: queries.daysQuery,
    daysRefreshErrorMessage,
    filters: queries.filters,
    localeItems,
    newPlan,
    optionItems,
    planContentLocked,
    planErrorMessage,
    planForm,
    plans: queries.plans,
    plansErrorMessage,
    plansQuery: queries.plansQuery,
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
  };
}
