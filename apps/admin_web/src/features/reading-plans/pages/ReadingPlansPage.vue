<script setup lang="ts">
import type {
  ReadingPlan,
  ReadingPlanAssignment,
  ReadingPlanAssignmentCreateRequest,
  ReadingPlanAssignmentStatus,
  ReadingPlanCreateRequest,
  ReadingPlanStatus,
  ReadingPlanVisibility
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createReadingPlan,
  createReadingPlanAssignment,
  listReadingPlanAssignments,
  listReadingPlanDays,
  listReadingPlans,
  readingPlanStatusOptions,
  readingPlanVisibilityOptions,
  updateReadingPlan,
  upsertReadingPlanDay
} from "@/core/api/reading_plans";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import ReadingPlanAssignmentsPanel from "../components/ReadingPlanAssignmentsPanel.vue";
import ReadingPlanDaysPanel from "../components/ReadingPlanDaysPanel.vue";
import ReadingPlanEditorFields from "../components/ReadingPlanEditorFields.vue";
import ReadingPlanFiltersCard from "../components/ReadingPlanFiltersCard.vue";
import ReadingPlanLibraryPanel from "../components/ReadingPlanLibraryPanel.vue";
import { useReadingPlanDayForm } from "../composables/use_reading_plan_day_form";
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

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();

const selectedPlan = ref<ReadingPlan | null>(null);
const activePanel = ref<"days" | "assignments">("days");
const mutationErrorMessage = ref("");

const filters = reactive({
  query: "",
  status: "" as ReadingPlanStatus | "",
  visibility: "" as ReadingPlanVisibility | "",
  locale: ""
});

const assignmentFilters = reactive({
  status: "" as ReadingPlanAssignmentStatus | "",
  userType: "" as "member" | "external" | "",
  userId: ""
});

const planForm = reactive<ReadingPlanCreateRequest>({
  title: "",
  description: "",
  status: "draft",
  visibility: "public",
  locale: "zh-Hans",
  durationDays: 7
});

const assignmentForm = reactive<ReadingPlanAssignmentCreateRequest>({
  planId: "",
  userType: "member",
  userId: "",
  sourceType: "admin",
  sourceId: null
});

const activeFilters = computed(() => ({ ...filters, limit: 50 }));
const plansQuery = useQuery({
  queryKey: ["reading-plans", activeFilters],
  queryFn: () => listReadingPlans(activeFilters.value)
});

const daysQuery = useQuery({
  queryKey: computed(() => ["reading-plan-days", selectedPlan.value?.id]),
  enabled: computed(() => Boolean(selectedPlan.value)),
  queryFn: () =>
    selectedPlan.value
      ? listReadingPlanDays(selectedPlan.value.id)
      : Promise.resolve([])
});
const {
  clearTextAfterSave,
  dayForm,
  resetForNewPlan: resetDayFormForNewPlan,
  resetForPlan: resetDayFormForPlan
} = useReadingPlanDayForm(selectedPlan, daysQuery.data);

const assignmentsQuery = useQuery({
  queryKey: computed(() => [
    "reading-plan-assignments",
    selectedPlan.value?.id,
    { ...assignmentFilters }
  ]),
  enabled: computed(() => Boolean(selectedPlan.value)),
  queryFn: () =>
    selectedPlan.value
      ? listReadingPlanAssignments({
          ...assignmentFilters,
          planId: selectedPlan.value.id,
          limit: 100
        })
      : Promise.resolve([] as ReadingPlanAssignment[])
});

const savePlanMutation = useMutation({
  onMutate: clearMutationError,
  mutationFn: () => {
    if (!canManage.value || !canSavePlan.value) {
      throw new Error(t("Reading plan manage access required"));
    }
    return selectedPlan.value
      ? updateReadingPlan(
          selectedPlan.value.id,
          readingPlanUpdatePayload(planForm)
        )
      : createReadingPlan(readingPlanCreatePayload(planForm));
  },
  onSuccess: async (plan) => {
    selectPlan(plan);
    await queryClient.invalidateQueries({ queryKey: ["reading-plans"] });
  },
  onError: captureMutationError
});

const upsertDayMutation = useMutation({
  onMutate: clearMutationError,
  mutationFn: () => {
    if (!selectedPlan.value) {
      throw new Error(t("No reading plan selected."));
    }
    if (!canManage.value || !canUpsertDay.value) {
      throw new Error(t("Reading plan manage access required"));
    }
    return upsertReadingPlanDay(
      selectedPlan.value.id,
      readingPlanDayPayload(dayForm)
    );
  },
  onSuccess: async () => {
    clearTextAfterSave();
    await queryClient.invalidateQueries({ queryKey: ["reading-plan-days"] });
    await queryClient.invalidateQueries({ queryKey: ["reading-plans"] });
  },
  onError: captureMutationError
});

const createAssignmentMutation = useMutation({
  onMutate: clearMutationError,
  mutationFn: () => {
    if (!selectedPlan.value) {
      throw new Error(t("No reading plan selected."));
    }
    if (!canManage.value || !canCreateAssignment.value) {
      throw new Error(t("Reading plan manage access required"));
    }
    return createReadingPlanAssignment(
      readingPlanAssignmentPayload(selectedPlan.value.id, assignmentForm)
    );
  },
  onSuccess: async () => {
    assignmentForm.userId = "";
    assignmentForm.sourceId = null;
    await queryClient.invalidateQueries({
      queryKey: ["reading-plan-assignments"]
    });
  },
  onError: captureMutationError
});

const plans = computed(() => plansQuery.data.value ?? []);
const days = computed(() => daysQuery.data.value ?? []);
const assignments = computed(() => assignmentsQuery.data.value ?? []);
const canManage = computed(() => authStore.can("reading_plans:manage"));
const canSavePlan = computed(
  () => planForm.title.trim().length > 0 && planForm.durationDays > 0
);
const planContentLocked = computed(
  () => readingPlanContentIsLocked(selectedPlan.value?.status)
);
const allowedPlanStatuses = computed(() =>
  allowedReadingPlanStatuses(selectedPlan.value?.status)
);
const planStructureLocked = computed(
  () =>
    Boolean(selectedPlan.value) &&
    (!assignmentsQuery.isSuccess.value || assignments.value.length > 0)
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
const queryErrorMessage = computed(() => {
  const error =
    plansQuery.error.value ||
    daysQuery.error.value ||
    assignmentsQuery.error.value;
  return error ? formatApiErrorMessage(error, t("common.error")) : "";
});
const errorMessage = computed(
  () => queryErrorMessage.value || mutationErrorMessage.value
);

function selectPlan(plan: ReadingPlan) {
  clearMutationError();
  selectedPlan.value = plan;
  assignmentForm.planId = plan.id;
  planForm.title = plan.title;
  planForm.description = plan.description;
  planForm.status = plan.status;
  planForm.visibility = plan.visibility;
  planForm.locale = plan.locale;
  planForm.durationDays = plan.durationDays;
  resetDayFormForPlan(plan);
}

function newPlan() {
  clearMutationError();
  selectedPlan.value = null;
  assignmentForm.planId = "";
  planForm.title = "";
  planForm.description = "";
  planForm.status = "draft";
  planForm.visibility = "public";
  planForm.locale = "zh-Hans";
  planForm.durationDays = 7;
  resetDayFormForNewPlan();
}

function clearMutationError() {
  mutationErrorMessage.value = "";
}

function captureMutationError(error: unknown) {
  mutationErrorMessage.value = formatApiErrorMessage(error, t("common.error"));
}

function savePlan() {
  if (!canManage.value || !canSavePlan.value || savePlanMutation.isPending.value) {
    return;
  }
  savePlanMutation.mutate();
}

function saveDay() {
  if (!canManage.value || !canUpsertDay.value || upsertDayMutation.isPending.value) {
    return;
  }
  upsertDayMutation.mutate();
}

function assignPlan() {
  if (
    !canManage.value ||
    !canCreateAssignment.value ||
    createAssignmentMutation.isPending.value
  ) {
    return;
  }
  createAssignmentMutation.mutate();
}
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

    <v-alert
      v-if="errorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
      density="comfortable"
    >
      {{ errorMessage }}
    </v-alert>

    <ReadingPlanFiltersCard
      v-model="filters"
      :status-items="optionItems(['', ...readingPlanStatusOptions])"
      :visibility-items="optionItems(['', ...readingPlanVisibilityOptions])"
      :locale-items="localeItems"
      @refresh="plansQuery.refetch()"
    />

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <ReadingPlanLibraryPanel
          :plans="plans"
          :selected-plan-id="selectedPlan?.id ?? null"
          :pending="plansQuery.isPending.value"
          @select="selectPlan"
        />
      </v-col>

      <v-col cols="12" lg="8">
        <v-card variant="outlined">
          <v-card-title>
            {{ selectedPlan?.title || t("Reading plan") }}
          </v-card-title>
          <v-card-subtitle>
            {{ t("Scripture text stays in the App local Bible data.") }}
          </v-card-subtitle>

          <v-card-text>
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
              :days="days"
              :day-form="dayForm"
              :has-selected-plan="Boolean(selectedPlan)"
              :loading="daysQuery.isFetching.value"
              :saving="upsertDayMutation.isPending.value"
              @save-day="saveDay"
            />

            <ReadingPlanAssignmentsPanel
              v-else
              :assignment-filters="assignmentFilters"
              :assignment-form="assignmentForm"
              :assignments="assignments"
              :can-create-assignment="canCreateAssignment"
              :can-manage="canManage"
              :has-selected-plan="Boolean(selectedPlan)"
              :loading="assignmentsQuery.isFetching.value"
              :saving="createAssignmentMutation.isPending.value"
              @assign="assignPlan"
              @refresh="assignmentsQuery.refetch()"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
