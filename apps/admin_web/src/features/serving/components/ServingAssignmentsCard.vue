<script setup lang="ts">
import type {
  ServingAssignment,
  ServingAssignmentStatus,
  ServingMemberOption,
  ServingRole,
  ServingTeam
} from "@mbc/api-contracts";
import { computed } from "vue";

import type { ServingAssignmentFilters } from "@/core/api/serving";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";
import ServingAssignmentResults from "./ServingAssignmentResults.vue";
import ServingFeedbackAlerts from "./ServingFeedbackAlerts.vue";
import { servingMemberLabel } from "../serving_presenters";
import type { ServingAssignmentForm } from "../serving_workspace_models";

const form = defineModel<ServingAssignmentForm>("form", { required: true });
const filters = defineModel<ServingAssignmentFilters>("filters", {
  required: true
});
const props = defineProps<{
  assignments: ServingAssignment[];
  members: ServingMemberOption[];
  teams: ServingTeam[];
  roles: ServingRole[];
  errorMessage: string;
  refreshErrorMessage: string;
  commandErrorMessage: string;
  loading: boolean;
  canManage: boolean;
  canCreate: boolean;
  createPending: boolean;
  updatePending: boolean;
}>();
const emit = defineEmits<{
  create: [];
  refresh: [];
  retry: [];
  updateStatus: [
    assignment: ServingAssignment,
    status: ServingAssignmentStatus
  ];
}>();
const { optionItems, t } = useI18n();

const teamItems = computed(() =>
  props.teams.map((team) => ({ title: team.name, value: team.id }))
);
const roleItems = computed(() =>
  props.roles
    .filter((role) => !form.value.teamId || role.teamId === form.value.teamId)
    .map((role) => ({ title: role.name, value: role.id }))
);
const memberItems = computed(() =>
  props.members.map((member) => ({
    title: servingMemberLabel(member),
    value: member.id
  }))
);
</script>

<template>
  <v-card variant="outlined">
    <div class="pa-5 pb-3">
      <AdminPanelHeader :title="t('Assignments')" />
    </div>
    <ServingFeedbackAlerts
      :refresh-error-message="refreshErrorMessage"
      :command-error-message="commandErrorMessage"
      inset
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
      <v-card-text v-if="canManage">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.teamId"
            :items="teamItems"
            :label="t('Team')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.roleId"
            :items="roleItems"
            :label="t('Role')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.userId"
            :items="memberItems"
            :label="t('Member')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.title"
            :label="t('Assignment title')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.location"
            :label="t('Location')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.startsAt"
            :label="t('Starts at')"
            type="datetime-local"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.endsAt"
            :label="t('Ends at')"
            type="datetime-local"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="form.note"
            :label="t('Note')"
            rows="2"
            variant="outlined"
            density="compact"
          />
        </v-col>
      </v-row>
      <v-btn
        color="primary"
        prepend-icon="mdi-calendar-plus"
        :disabled="!canCreate || createPending"
        :loading="createPending"
        @click="emit('create')"
      >
        {{ t("Create assignment") }}
      </v-btn>
      </v-card-text>

      <v-divider />
      <v-card-text>
      <v-row dense class="mb-3">
        <v-col cols="12" md="7">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="emit('refresh')"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.status"
            :items="
              optionItems([
                '',
                'scheduled',
                'confirmed',
                'declined',
                'swap_requested',
                'covered',
                'cancelled'
              ])
            "
            :label="t('Status')"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="1">
          <v-btn block variant="tonal" @click="emit('refresh')">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
      <ServingAssignmentResults
        :assignments="assignments"
        :loading="loading"
        :can-manage="canManage"
        :update-pending="updatePending"
        @update-status="(assignment, status) => emit('updateStatus', assignment, status)"
      />
      </v-card-text>
    </AdminDataState>
  </v-card>
</template>
