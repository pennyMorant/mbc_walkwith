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
import ReadingPlanAssignmentsPanel from "../components/ReadingPlanAssignmentsPanel.vue";
import ReadingPlanDaysPanel from "../components/ReadingPlanDaysPanel.vue";
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
    <div
      class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
    >
      <div>
        <div class="text-h5 font-weight-bold">{{ t("Reading plans") }}</div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Manage church reading plans, scripture references, and assignments.") }}
        </div>
      </div>
      <v-btn
        v-if="canManage"
        color="primary"
        prepend-icon="mdi-plus"
        @click="newPlan"
      >
        {{ t("New reading plan") }}
      </v-btn>
    </div>

    <v-alert
      v-if="errorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
      density="comfortable"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card class="mt-5" variant="outlined">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="plansQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.status"
              :label="t('Status')"
              :items="optionItems(['', ...readingPlanStatusOptions])"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.visibility"
              :label="t('Visibility')"
              :items="optionItems(['', ...readingPlanVisibilityOptions])"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.locale"
              :label="t('Locale')"
              :items="[{ title: t('common.all'), value: '' }, ...localeItems]"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn block variant="tonal" @click="plansQuery.refetch()">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <v-card variant="outlined">
          <v-list lines="three">
            <v-list-item v-if="plansQuery.isPending.value">
              <v-progress-linear indeterminate color="primary" />
            </v-list-item>
            <v-list-item v-else-if="plans.length === 0">
              {{ t("No reading plans match the current filters.") }}
            </v-list-item>
            <v-list-item
              v-for="plan in plans"
              :key="plan.id"
              :active="selectedPlan?.id === plan.id"
              @click="selectPlan(plan)"
            >
              <template #title>
                <div class="font-weight-bold">{{ plan.title }}</div>
              </template>
              <template #subtitle>
                <div class="text-caption text-medium-emphasis">
                  {{ t(plan.status) }} · {{ t(plan.visibility) }} ·
                  {{ plan.durationDays }} {{ t("days") }}
                </div>
                <div>{{ plan.description || t("common.notSet") }}</div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
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
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="planForm.title"
                  :label="t('Title')"
                  :disabled="!canManage || planContentLocked"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="planForm.status"
                  :label="t('Status')"
                  :items="optionItems(allowedPlanStatuses)"
                  :disabled="!canManage"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="planForm.visibility"
                  :label="t('Visibility')"
                  :items="optionItems(readingPlanVisibilityOptions)"
                  :disabled="!canManage || planContentLocked || planStructureLocked"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="planForm.locale"
                  :label="t('Locale')"
                  :items="localeItems"
                  :disabled="!canManage || planContentLocked || planStructureLocked"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model.number="planForm.durationDays"
                  :label="t('Duration days')"
                  :disabled="!canManage || planContentLocked || planStructureLocked"
                  type="number"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="planForm.description"
                  :label="t('Description')"
                  :disabled="!canManage || planContentLocked"
                  rows="2"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
            </v-row>
            <v-btn
              v-if="canManage"
              color="primary"
              :disabled="!canSavePlan || savePlanMutation.isPending.value"
              :loading="savePlanMutation.isPending.value"
              @click="savePlan"
            >
              {{ t("common.save") }}
            </v-btn>
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
