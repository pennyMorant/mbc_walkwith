<script setup lang="ts">
import type {
  ServingAssignment,
  ServingCheckInRecord,
  ServingMemberOption
} from "@mbc/api-contracts";
import { computed } from "vue";

import type { ServingCheckInFilters } from "@/core/api/serving";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";
import ServingFeedbackAlerts from "./ServingFeedbackAlerts.vue";
import {
  formatServingDateTime,
  servingAssignmentLabel,
  servingMemberLabelById
} from "../serving_presenters";
import type { ServingCheckInForm } from "../serving_workspace_models";

const form = defineModel<ServingCheckInForm>("form", { required: true });
const filters = defineModel<ServingCheckInFilters>("filters", {
  required: true
});
const props = defineProps<{
  records: ServingCheckInRecord[];
  assignments: ServingAssignment[];
  members: ServingMemberOption[];
  errorMessage: string;
  refreshErrorMessage: string;
  commandErrorMessage: string;
  loading: boolean;
  canManage: boolean;
  canSave: boolean;
  needsReason: boolean;
  savePending: boolean;
}>();
const emit = defineEmits<{ save: []; refresh: []; retry: [] }>();
const { locale, optionItems, t } = useI18n();

const assignmentItems = computed(() =>
  props.assignments.map((assignment) => ({
    title: servingAssignmentLabel(assignment),
    value: assignment.id
  }))
);
const memberItems = computed(() =>
  props.members.map((member) => ({
    title: member.displayName || member.email,
    value: member.id
  }))
);
function assignmentById(assignmentId: string) {
  return props.assignments.find((item) => item.id === assignmentId);
}
</script>

<template>
  <div>
    <ServingFeedbackAlerts
      :refresh-error-message="refreshErrorMessage"
      :command-error-message="commandErrorMessage"
      @retry="emit('retry')"
    />
    <AdminDataState
      :pending="loading"
      :error-message="errorMessage"
      :empty="false"
      empty-title=""
      :retry-label="t('common.refresh')"
      @retry="emit('retry')"
    >
      <v-row v-if="canManage" dense>
      <v-col cols="12" md="5">
        <v-select
          v-model="form.assignmentId"
          :items="assignmentItems"
          :label="t('Assignment')"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="form.status"
          :items="optionItems(['pending', 'checked_in', 'missed'])"
          :label="t('Arrival status')"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="form.note"
          :label="needsReason ? t('Correction reason') : t('Note')"
          :hint="needsReason ? t('A correction reason is required.') : ''"
          :persistent-hint="needsReason"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12">
        <v-btn
          color="primary"
          prepend-icon="mdi-account-check-outline"
          :disabled="!canSave || savePending"
          :loading="savePending"
          @click="emit('save')"
        >
          {{ t("Save arrival status") }}
        </v-btn>
      </v-col>
      </v-row>

      <v-divider v-if="canManage" class="my-4" />
      <v-row dense class="mb-3">
      <v-col cols="12" md="4">
        <v-select
          v-model="filters.assignmentId"
          :items="[{ title: t('common.all'), value: '' }, ...assignmentItems]"
          :label="t('Assignment')"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.userId"
          :items="[{ title: t('common.all'), value: '' }, ...memberItems]"
          :label="t('Member')"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.status"
          :items="optionItems(['', 'pending', 'checked_in', 'missed'])"
          :label="t('Status')"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn block variant="tonal" @click="emit('refresh')">
          {{ t("common.go") }}
        </v-btn>
      </v-col>
      </v-row>

      <AdminResponsiveTable>
        <template #desktop>
          <v-table density="compact">
            <thead>
              <tr>
                <th>{{ t("Assignment") }}</th>
                <th>{{ t("Member") }}</th>
                <th>{{ t("Status") }}</th>
                <th>{{ t("Arrival time") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!loading && records.length === 0">
                <td colspan="4" class="text-medium-emphasis py-6">
                  {{ t("No arrival records match the current filters.") }}
                </td>
              </tr>
              <tr v-for="record in records" :key="record.id">
                <td>
                  {{ assignmentById(record.assignmentId)?.title ?? record.assignmentId }}
                </td>
                <td>{{ servingMemberLabelById(members, record.userId) }}</td>
                <td>{{ t(record.status) }}</td>
                <td>{{ formatServingDateTime(record.checkedInAt, locale) }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
        <template #mobile>
          <div v-if="!loading && records.length === 0" class="text-medium-emphasis py-6">
            {{ t("No arrival records match the current filters.") }}
          </div>
          <AdminMobileDataRow v-for="record in records" :key="record.id">
            <strong>{{ assignmentById(record.assignmentId)?.title ?? record.assignmentId }}</strong>
            <span>{{ servingMemberLabelById(members, record.userId) }}</span>
            <template #trailing>
              <v-chip size="small">{{ t(record.status) }}</v-chip>
            </template>
            <template #meta>
              <span>{{ formatServingDateTime(record.checkedInAt, locale) }}</span>
              <span v-if="record.note">{{ record.note }}</span>
            </template>
          </AdminMobileDataRow>
        </template>
      </AdminResponsiveTable>
    </AdminDataState>
  </div>
</template>
