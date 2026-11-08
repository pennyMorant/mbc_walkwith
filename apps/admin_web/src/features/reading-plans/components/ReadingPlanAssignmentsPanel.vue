<script setup lang="ts">
import type {
  ReadingPlanAssignment,
  ReadingPlanAssignmentCreateRequest,
  ReadingPlanAssignmentStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

type AssignmentFilters = {
  status: ReadingPlanAssignmentStatus | "";
  userType: "member" | "external" | "";
  userId: string;
};

defineProps<{
  assignmentFilters: AssignmentFilters;
  assignmentForm: ReadingPlanAssignmentCreateRequest;
  assignments: ReadingPlanAssignment[];
  assignmentSourceTypeItems: unknown[];
  assignmentStatusItems: unknown[];
  assignmentUserTypeItems: unknown[];
  commandErrorMessage: string;
  errorMessage: string;
  canCreateAssignment: boolean;
  canManage: boolean;
  hasSelectedPlan: boolean;
  loading: boolean;
  pending: boolean;
  refreshErrorMessage: string;
  saving: boolean;
}>();

defineEmits<{
  apply: [];
  assign: [];
  retry: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="mt-4">
    <AdminFilterToolbar class="mb-3" @apply="$emit('apply')">
      <template #heading>
        <div class="text-subtitle-2">{{ t("Assignments") }}</div>
      </template>
      <v-select
        v-model="assignmentFilters.status"
        class="admin-filter-control"
        :items="assignmentStatusItems"
        :label="t('Status')"
        density="compact"
        variant="outlined"
        hide-details
      />
      <template #actions>
        <v-btn type="submit" variant="tonal" :loading="loading">
          {{ t("common.go") }}
        </v-btn>
      </template>
    </AdminFilterToolbar>

    <AdminRefreshAlert
      class="mb-4"
      :message="refreshErrorMessage"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    />
    <v-alert
      v-if="commandErrorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ commandErrorMessage }}
    </v-alert>

    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="false"
      empty-title=""
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      <AdminResponsiveTable>
        <template #desktop>
          <v-table density="compact">
            <thead>
              <tr>
                <th>{{ t("User") }}</th>
                <th>{{ t("Source") }}</th>
                <th>{{ t("Status") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!loading && assignments.length === 0">
                <td colspan="3">{{ t("No assignments yet.") }}</td>
              </tr>
              <tr v-for="assignment in assignments" :key="assignment.id">
                <td>{{ t(assignment.userType) }} · {{ assignment.userId }}</td>
                <td>{{ t(assignment.sourceType) }}</td>
                <td>{{ t(assignment.status) }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
        <template #mobile>
          <div v-if="!loading && assignments.length === 0" class="text-medium-emphasis py-4">
            {{ t("No assignments yet.") }}
          </div>
          <AdminMobileDataRow
            v-for="assignment in assignments"
            :key="assignment.id"
          >
            <strong>{{ t(assignment.userType) }} · {{ assignment.userId }}</strong>
            <span>{{ t(assignment.sourceType) }}</span>
            <template #trailing>
              <v-chip size="small">{{ t(assignment.status) }}</v-chip>
            </template>
          </AdminMobileDataRow>
        </template>
      </AdminResponsiveTable>

      <v-row v-if="canManage && hasSelectedPlan" class="mt-4" dense>
      <v-col cols="12" md="3">
        <v-select
          v-model="assignmentForm.userType"
          :label="t('User type')"
          :items="assignmentUserTypeItems"
          :disabled="saving"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="assignmentForm.userId"
          :label="t('User ID')"
          :disabled="saving"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="assignmentForm.sourceType"
          :label="t('Source')"
          :items="assignmentSourceTypeItems"
          :disabled="saving"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn
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
    </AdminDataState>
  </div>
</template>
