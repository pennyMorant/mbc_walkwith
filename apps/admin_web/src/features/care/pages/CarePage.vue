<script setup lang="ts">
import type {
  CareFollowUpCreateRequest,
  CarePrivacyLevel,
  CareRequestAdmin,
  CareRequestStatus,
  CareRequestUpdateRequest
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { requireSelected } from "@/core/actions/action_guard";
import {
  createCareFollowUp,
  listCareAssignees,
  listCareFollowUps,
  listCareRequests,
  updateCareRequest,
  type CareRequestFilters
} from "@/core/api/care";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminRefreshButton from "@/core/ui/AdminRefreshButton.vue";

import CareRequestDrawer from "../components/CareRequestDrawer.vue";
import CareRequestResults from "../components/CareRequestResults.vue";
import {
  careFilterSnapshot,
  careFollowUpPayloadFromForm,
  careRequestPayloadFromForm,
  createCareFollowUpEditorForm,
  createCareRequestEditorForm,
  dateTimeInputToIso,
  loadCareRequestEditorForm,
  resetCareFollowUpEditorForm,
  type CareFilterDraft
} from "../care_workspace_models";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();

const filters = reactive<CareFilterDraft>({
  query: "",
  status: ""
});
const appliedFilters = ref<CareRequestFilters>(careFilterSnapshot(filters));
const selectedRequest = ref<CareRequestAdmin | null>(null);
const form = reactive(createCareRequestEditorForm());
const followUpForm = reactive(createCareFollowUpEditorForm());
const updateErrorMessage = ref("");
const followUpErrorMessage = ref("");
let careContextVersion = 0;

type CareUpdateIntent = {
  requestId: string;
  contextVersion: number;
  payload: CareRequestUpdateRequest;
};

type CareFollowUpIntent = {
  requestId: string;
  contextVersion: number;
  payload: CareFollowUpCreateRequest;
};

const requestsQuery = useQuery({
  queryKey: ["care-requests", appliedFilters],
  queryFn: () => listCareRequests(appliedFilters.value)
});
const assigneesQuery = useQuery({
  queryKey: ["care-assignees"],
  queryFn: listCareAssignees
});
const followUpsQuery = useQuery({
  queryKey: computed(() => ["care-follow-ups", selectedRequest.value?.id]),
  queryFn: () => listCareFollowUps(selectedRequest.value!.id),
  enabled: computed(() => Boolean(selectedRequest.value))
});

const updateMutation = useMutation({
  onMutate: (intent: CareUpdateIntent) => {
    updateErrorMessage.value = "";
    return intent;
  },
  mutationFn: (intent: CareUpdateIntent) =>
    updateCareRequest(intent.requestId, intent.payload),
  onSuccess: async (request, _variables, context) => {
    if (isCurrentCareContext(context)) {
      selectedRequest.value = request;
      loadCareRequestEditorForm(form, request);
    }
    await queryClient.invalidateQueries({ queryKey: ["care-requests"] });
    await queryClient.invalidateQueries({ queryKey: ["care-follow-ups"] });
  },
  onError: (error, _variables, context) => {
    if (isCurrentCareContext(context)) {
      updateErrorMessage.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }
});

const followUpMutation = useMutation({
  onMutate: (intent: CareFollowUpIntent) => {
    followUpErrorMessage.value = "";
    return intent;
  },
  mutationFn: (intent: CareFollowUpIntent) =>
    createCareFollowUp(intent.requestId, intent.payload),
  onSuccess: async (_followUp, _variables, context) => {
    if (isCurrentCareContext(context)) {
      resetCareFollowUpEditorForm(followUpForm);
    }
    await queryClient.invalidateQueries({ queryKey: ["care-requests"] });
    await queryClient.invalidateQueries({ queryKey: ["care-follow-ups"] });
  },
  onError: (error, _variables, context) => {
    if (isCurrentCareContext(context)) {
      followUpErrorMessage.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }
});

const requests = computed(() => requestsQuery.data.value ?? []);
const assignees = computed(() => assigneesQuery.data.value ?? []);
const followUps = computed(() => followUpsQuery.data.value ?? []);
const canManage = computed(() => authStore.can("care:manage"));
const submittedCount = computed(
  () => requests.value.filter((request) => request.status === "submitted").length
);
const scheduledCount = computed(
  () =>
    requests.value.filter((request) => Boolean(request.nextFollowUpAt)).length
);
const summaryMetrics = computed(() => [
  {
    id: "requests",
    label: t("Care requests"),
    value: requests.value.length,
    icon: "mdi-hand-heart-outline",
    tone: "primary" as const
  },
  {
    id: "submitted",
    label: t("New submissions"),
    value: submittedCount.value,
    icon: "mdi-inbox-arrow-down-outline",
    tone: "warning" as const
  },
  {
    id: "scheduled",
    label: t("Scheduled follow-ups"),
    value: scheduledCount.value,
    icon: "mdi-calendar-clock-outline",
    tone: "info" as const
  }
]);
const drawer = computed({
  get: () => Boolean(selectedRequest.value),
  set: (value: boolean) => {
    if (!value) {
      closeRequest();
    }
  }
});
const canSave = computed(() => Boolean(selectedRequest.value && canManage.value));
const canCreateFollowUp = computed(
  () =>
    Boolean(selectedRequest.value && canManage.value) &&
    followUpForm.note.trim().length > 0 &&
    (followUpForm.status !== "planned" ||
      dateTimeInputToIso(followUpForm.plannedAt) !== null)
);
const listErrorMessage = computed(() =>
  requestsQuery.error.value
    ? formatApiErrorMessage(requestsQuery.error.value, t("common.error"))
    : ""
);
const assigneesErrorMessage = computed(() =>
  assigneesQuery.error.value
    ? formatApiErrorMessage(assigneesQuery.error.value, t("common.error"))
    : ""
);
const followUpsErrorMessage = computed(() =>
  followUpsQuery.error.value
    ? formatApiErrorMessage(followUpsQuery.error.value, t("common.error"))
    : ""
);

function openRequest(request: CareRequestAdmin) {
  beginCareContext();
  selectedRequest.value = request;
  loadCareRequestEditorForm(form, request);
}

function closeRequest() {
  beginCareContext();
  selectedRequest.value = null;
}

function beginCareContext() {
  careContextVersion += 1;
  updateErrorMessage.value = "";
  followUpErrorMessage.value = "";
  resetCareFollowUpEditorForm(followUpForm);
  updateMutation.reset();
  followUpMutation.reset();
}

function isCurrentCareContext(
  context: { requestId: string; contextVersion: number } | undefined
) {
  return Boolean(
    context &&
      context.contextVersion === careContextVersion &&
      context.requestId === selectedRequest.value?.id
  );
}

function statusColor(status: CareRequestStatus) {
  if (status === "resolved") return "success";
  if (status === "archived") return "secondary";
  if (status === "assigned" || status === "in_progress") return "primary";
  return "warning";
}

function privacyColor(privacy: CarePrivacyLevel) {
  if (privacy === "admin_restricted") return "error";
  if (privacy === "assigned_team") return "primary";
  return "warning";
}

function applyFilters() {
  const nextFilters = careFilterSnapshot(filters);
  if (JSON.stringify(nextFilters) === JSON.stringify(appliedFilters.value)) {
    void requestsQuery.refetch();
    return;
  }
  appliedFilters.value = nextFilters;
}

function saveCareRequest() {
  if (!canSave.value || updateMutation.isPending.value) {
    return;
  }
  const request = requireSelected(
    selectedRequest.value,
    t("No care request selected.")
  );
  updateMutation.mutate({
    requestId: request.id,
    contextVersion: careContextVersion,
    payload: careRequestPayloadFromForm(form)
  });
}

function addCareFollowUp() {
  if (!canCreateFollowUp.value || followUpMutation.isPending.value) {
    return;
  }
  const request = requireSelected(
    selectedRequest.value,
    t("No care request selected.")
  );
  followUpMutation.mutate({
    requestId: request.id,
    contextVersion: careContextVersion,
    payload: careFollowUpPayloadFromForm(followUpForm)
  });
}
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('nav.care')"
      :subtitle="t('Care request assignment, privacy, follow-up, and audit queue.')"
    >
      <template #actions>
        <AdminRefreshButton
          :label="t('common.refresh')"
          :loading="requestsQuery.isFetching.value"
          @refresh="requestsQuery.refetch()"
        />
      </template>
    </AdminPageHeader>

    <AdminMetricGrid :items="summaryMetrics" />

    <v-card class="mt-6" variant="outlined">
      <div class="pa-5">
        <v-row dense>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.status"
              :label="t('Status')"
              :items="
                optionItems([
                  '',
                  'submitted',
                  'assigned',
                  'in_progress',
                  'resolved',
                  'archived'
                ])
              "
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn block variant="tonal" @click="applyFilters">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
      <v-divider />
      <CareRequestResults
        :requests="requests"
        :pending="requestsQuery.isPending.value"
        :error-message="listErrorMessage"
        :status-color="statusColor"
        :privacy-color="privacyColor"
        @open="openRequest"
        @retry="requestsQuery.refetch()"
      />
    </v-card>

    <CareRequestDrawer
      v-model="drawer"
      :request="selectedRequest"
      :form="form"
      :follow-up-form="followUpForm"
      :assignees="assignees"
      :follow-ups="followUps"
      :can-manage="canManage"
      :can-save="canSave"
      :can-create-follow-up="canCreateFollowUp"
      :update-saving="updateMutation.isPending.value"
      :follow-up-saving="followUpMutation.isPending.value"
      :assignees-loading="assigneesQuery.isFetching.value"
      :assignees-error-message="assigneesErrorMessage"
      :follow-ups-loading="followUpsQuery.isPending.value"
      :follow-ups-error-message="followUpsErrorMessage"
      :update-error-message="updateErrorMessage"
      :follow-up-error-message="followUpErrorMessage"
      :status-color="statusColor"
      :privacy-color="privacyColor"
      @save="saveCareRequest"
      @add-follow-up="addCareFollowUp"
      @retry-assignees="assigneesQuery.refetch()"
      @retry-follow-ups="followUpsQuery.refetch()"
    />
  </div>
</template>
