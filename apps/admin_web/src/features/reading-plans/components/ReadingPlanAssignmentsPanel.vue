<script setup lang="ts">
import type {
  ReadingPlanAssignment,
  ReadingPlanAssignmentCreateRequest,
  ReadingPlanAssignmentStatus
} from "@mbc/api-contracts";

import {
  readingPlanAssignmentSourceTypeOptions,
  readingPlanAssignmentStatusOptions,
  readingPlanUserTypeOptions
} from "@/core/api/reading_plans";
import { useI18n } from "@/core/i18n/i18n";

type AssignmentFilters = {
  status: ReadingPlanAssignmentStatus | "";
  userType: "member" | "external" | "";
  userId: string;
};

defineProps<{
  assignmentFilters: AssignmentFilters;
  assignmentForm: ReadingPlanAssignmentCreateRequest;
  assignments: ReadingPlanAssignment[];
  canCreateAssignment: boolean;
  canManage: boolean;
  hasSelectedPlan: boolean;
  loading: boolean;
  saving: boolean;
}>();

defineEmits<{
  assign: [];
  refresh: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <div class="mt-4">
    <div class="d-flex align-center justify-space-between mb-3 ga-3">
      <div class="text-subtitle-2">{{ t("Assignments") }}</div>
      <div class="d-flex ga-2">
        <v-select
          v-model="assignmentFilters.status"
          :items="optionItems(['', ...readingPlanAssignmentStatusOptions])"
          :label="t('Status')"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 180px"
        />
        <v-btn
          variant="tonal"
          :loading="loading"
          @click="$emit('refresh')"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" />
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

    <v-row v-if="canManage && hasSelectedPlan" class="mt-4" dense>
      <v-col cols="12" md="3">
        <v-select
          v-model="assignmentForm.userType"
          :label="t('User type')"
          :items="optionItems(readingPlanUserTypeOptions)"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="assignmentForm.userId"
          :label="t('User ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="assignmentForm.sourceType"
          :label="t('Source')"
          :items="optionItems(readingPlanAssignmentSourceTypeOptions)"
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
  </div>
</template>
