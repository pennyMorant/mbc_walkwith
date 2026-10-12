<script setup lang="ts">
import type {
  CareFollowUpStatus,
  CarePrivacyLevel,
  CareRequestAdmin,
  CareRequestStatus
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { requireSelected } from "@/core/actions/action_guard";
import {
  createCareFollowUp,
  listCareAssignees,
  listCareFollowUps,
  listCareRequests,
  updateCareRequest
} from "@/core/api/care";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();

const filters = reactive({
  query: "",
  status: "" as CareRequestStatus | ""
});
const selectedRequest = ref<CareRequestAdmin | null>(null);
const form = reactive({
  status: "submitted" as CareRequestStatus,
  privacyLevel: "pastoral_only" as CarePrivacyLevel,
  assigneeAdminUserId: null as string | null,
  nextFollowUpAt: "",
  internalNote: ""
});
const followUpForm = reactive({
  note: "",
  status: "completed" as CareFollowUpStatus,
  plannedAt: ""
});

const requestsQuery = useQuery({
  queryKey: computed(() => ["care-requests", { ...filters }]),
  queryFn: () => listCareRequests({ ...filters, limit: 100 })
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
  mutationFn: () => {
    const request = requireSelected(
      selectedRequest.value,
      t("No care request selected.")
    );
    if (!canManage.value) {
      throw new Error(t("Care manage access required"));
    }
    return updateCareRequest(request.id, {
      status: form.status,
      privacyLevel: form.privacyLevel,
      assigneeAdminUserId: form.assigneeAdminUserId,
      nextFollowUpAt: dateTimeInputToIso(form.nextFollowUpAt),
      internalNote: form.internalNote.trim()
    });
  },
  onSuccess: async (request) => {
    selectedRequest.value = request;
    await queryClient.invalidateQueries({ queryKey: ["care-requests"] });
    await queryClient.invalidateQueries({ queryKey: ["care-follow-ups"] });
  }
});

const followUpMutation = useMutation({
  mutationFn: () => {
    const request = requireSelected(
      selectedRequest.value,
      t("No care request selected.")
    );
    if (!canCreateFollowUp.value) {
      throw new Error(t("Care manage access required"));
    }
    return createCareFollowUp(request.id, {
      note: followUpForm.note.trim(),
      status: followUpForm.status,
      plannedAt: dateTimeInputToIso(followUpForm.plannedAt)
    });
  },
  onSuccess: async () => {
    followUpForm.note = "";
    followUpForm.plannedAt = "";
    await queryClient.invalidateQueries({ queryKey: ["care-requests"] });
    await queryClient.invalidateQueries({ queryKey: ["care-follow-ups"] });
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
const drawer = computed({
  get: () => Boolean(selectedRequest.value),
  set: (value: boolean) => {
    if (!value) {
      selectedRequest.value = null;
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
const errorMessage = computed(() =>
  formatApiErrorMessage(
    requestsQuery.error.value ||
      assigneesQuery.error.value ||
      updateMutation.error.value ||
      followUpMutation.error.value ||
      followUpsQuery.error.value,
    t("common.error")
  )
);

watch(selectedRequest, (request) => {
  if (!request) {
    return;
  }
  form.status = request.status;
  form.privacyLevel = request.privacyLevel;
  form.assigneeAdminUserId = request.assigneeAdminUserId;
  form.nextFollowUpAt = isoToDateTimeInput(request.nextFollowUpAt);
  form.internalNote = request.internalNote;
});

function openRequest(request: CareRequestAdmin) {
  selectedRequest.value = request;
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

function isoToDateTimeInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function dateTimeInputToIso(value: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function saveCareRequest() {
  if (!canSave.value || updateMutation.isPending.value) {
    return;
  }
  updateMutation.mutate();
}

function addCareFollowUp() {
  if (!canCreateFollowUp.value || followUpMutation.isPending.value) {
    return;
  }
  followUpMutation.mutate();
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("nav.care") }}</div>
        <div class="page-subtitle">
          {{ t("Care request assignment, privacy, follow-up, and audit queue.") }}
        </div>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        :loading="requestsQuery.isFetching.value"
        prepend-icon="mdi-refresh"
        @click="requestsQuery.refetch()"
      >
        {{ t("common.refresh") }}
      </v-btn>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
      {{ errorMessage }}
    </v-alert>

    <v-row class="mt-5" dense>
      <v-col cols="12" md="4">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">
            {{ t("Care requests") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ requests.length }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">
            {{ t("New submissions") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ submittedCount }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">
            {{ t("Scheduled follow-ups") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ scheduledCount }}</div>
        </v-card>
      </v-col>
    </v-row>

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
              @keyup.enter="requestsQuery.refetch()"
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
              @update:model-value="requestsQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn block variant="tonal" @click="requestsQuery.refetch()">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
      <v-divider />
      <v-progress-linear
        v-if="requestsQuery.isPending.value"
        indeterminate
        color="primary"
      />
      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>{{ t("Member") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("Privacy") }}</th>
            <th>{{ t("Assignee") }}</th>
            <th>{{ t("Updated") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="requests.length === 0">
            <td colspan="5" class="text-medium-emphasis">
              {{ t("No care requests match the current filters.") }}
            </td>
          </tr>
          <tr
            v-for="request in requests"
            :key="request.id"
            class="cursor-pointer"
            @click="openRequest(request)"
          >
            <td>
              <div class="font-weight-bold">{{ request.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ request.memberDisplayName }} · {{ request.memberEmail }}
              </div>
            </td>
            <td>
              <v-chip size="small" :color="statusColor(request.status)">
                {{ t(request.status) }}
              </v-chip>
            </td>
            <td>
              <v-chip
                size="small"
                variant="tonal"
                :color="privacyColor(request.privacyLevel)"
              >
                {{ t(request.privacyLevel) }}
              </v-chip>
            </td>
            <td>{{ request.assigneeName || t("common.notSet") }}</td>
            <td>{{ request.updatedAt }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-navigation-drawer v-model="drawer" location="right" temporary width="620">
      <div v-if="selectedRequest" class="pa-5">
        <div class="d-flex align-start justify-space-between ga-4">
          <div>
            <div class="text-h6 font-weight-bold">
              {{ selectedRequest.title }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ selectedRequest.memberDisplayName }} · {{ selectedRequest.memberEmail }}
            </div>
          </div>
          <v-chip
            size="small"
            variant="tonal"
            :color="privacyColor(selectedRequest.privacyLevel)"
          >
            {{ t(selectedRequest.privacyLevel) }}
          </v-chip>
        </div>

        <v-alert type="warning" variant="tonal" class="mt-5">
          {{ t("Care notes are sensitive and are not returned to member App APIs.") }}
        </v-alert>

        <div class="mt-5 text-body-1 care-body">
          {{ selectedRequest.body }}
        </div>

        <v-divider class="my-5" />

        <v-form @submit.prevent="saveCareRequest">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                :label="t('Status')"
                :items="
                  optionItems([
                    'submitted',
                    'assigned',
                    'in_progress',
                    'resolved',
                    'archived'
                  ])
                "
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.privacyLevel"
                :label="t('Privacy')"
                :items="optionItems(['pastoral_only', 'assigned_team', 'admin_restricted'])"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.assigneeAdminUserId"
                :label="t('Assignee')"
                :items="assignees"
                item-title="name"
                item-value="id"
                clearable
                :disabled="!canManage"
                :loading="assigneesQuery.isFetching.value"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.nextFollowUpAt"
                :label="t('Next follow-up')"
                type="datetime-local"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-textarea
            v-model="form.internalNote"
            :label="t('Internal note')"
            :disabled="!canManage"
            rows="4"
            density="comfortable"
            variant="outlined"
          />
          <v-btn
            type="submit"
            color="primary"
            :disabled="!canSave || updateMutation.isPending.value"
            :loading="updateMutation.isPending.value"
          >
            {{ t("common.save") }}
          </v-btn>
        </v-form>

        <v-divider class="my-5" />

        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Follow-up records") }}
        </div>
        <v-form class="mt-3" @submit.prevent="addCareFollowUp">
          <v-select
            v-model="followUpForm.status"
            :label="t('Status')"
            :items="optionItems(['completed', 'planned', 'cancelled'])"
            :disabled="!canManage"
            density="comfortable"
            variant="outlined"
          />
          <v-text-field
            v-model="followUpForm.plannedAt"
            :label="t('Planned time')"
            type="datetime-local"
            :disabled="!canManage"
            density="comfortable"
            variant="outlined"
          />
          <v-textarea
            v-model="followUpForm.note"
            :label="t('Follow-up note')"
            :disabled="!canManage"
            rows="3"
            density="comfortable"
            variant="outlined"
          />
          <v-btn
            type="submit"
            color="primary"
            variant="tonal"
            :disabled="!canCreateFollowUp || followUpMutation.isPending.value"
            :loading="followUpMutation.isPending.value"
          >
            {{ t("Add follow-up") }}
          </v-btn>
        </v-form>

        <v-list class="mt-4" lines="three">
          <v-list-item v-if="followUps.length === 0">
            <v-list-item-title>{{ t("No follow-ups recorded.") }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-for="followUp in followUps" :key="followUp.id">
            <v-list-item-title>
              {{ followUp.authorName || t("Admin") }} · {{ t(followUp.status) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ followUp.note }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.care-body {
  white-space: pre-wrap;
}
</style>
