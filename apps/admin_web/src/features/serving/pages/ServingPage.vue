<script setup lang="ts">
import { ref } from "vue";

import ServingAssignmentsCard from "../components/ServingAssignmentsCard.vue";
import ServingAvailabilityPanel from "../components/ServingAvailabilityPanel.vue";
import ServingCheckInsPanel from "../components/ServingCheckInsPanel.vue";
import ServingSetupCard from "../components/ServingSetupCard.vue";
import { useServingPage } from "../composables/use_serving_page";

const workspaceTab = ref("availability");
const {
  activeMembers,
  assignmentDirectory,
  assignmentFilters,
  assignmentForm,
  assignments,
  assignmentsQuery,
  availability,
  availabilityFilters,
  availabilityForm,
  availabilityQuery,
  canCreateAssignment,
  canCreateAvailability,
  canCreateRole,
  canCreateTeam,
  canManage,
  canSaveCheckIn,
  checkInFilters,
  checkInForm,
  checkInNeedsReason,
  checkIns,
  checkInsQuery,
  createAssignment,
  createAssignmentMutation,
  createAvailability,
  createAvailabilityMutation,
  createRole,
  createRoleMutation,
  createTeam,
  createTeamMutation,
  errorMessage,
  members,
  membersQuery,
  refreshAll,
  roleForm,
  roles,
  rolesQuery,
  saveCheckIn,
  successMessage,
  successVisible,
  t,
  teamForm,
  teams,
  teamsQuery,
  updateAssignmentMutation,
  updateAssignmentStatus,
  updateCheckInMutation,
  updateRoleMutation,
  updateRoleStatus,
  updateTeamMutation,
  updateTeamStatus
} = useServingPage();
</script>

<template>
  <div>
    <div
      class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
    >
      <div>
        <div class="text-h5 font-weight-bold">{{ t("Serving schedule") }}</div>
        <div class="text-body-2 text-medium-emphasis">
          {{
            t(
              "Manage teams, roles, assignments, availability, and arrival status."
            )
          }}
        </div>
      </div>
      <v-btn
        variant="tonal"
        prepend-icon="mdi-refresh"
        @click="refreshAll"
      >
        {{ t("common.refresh") }}
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

    <v-row class="mt-4" dense>
      <v-col cols="12" lg="4">
        <ServingSetupCard
          v-model:team-form="teamForm"
          v-model:role-form="roleForm"
          :teams="teams"
          :roles="roles"
          :loading="teamsQuery.isPending.value || rolesQuery.isPending.value"
          :can-manage="canManage"
          :can-create-team="canCreateTeam"
          :can-create-role="canCreateRole"
          :create-team-pending="createTeamMutation.isPending.value"
          :create-role-pending="createRoleMutation.isPending.value"
          :update-pending="
            updateTeamMutation.isPending.value || updateRoleMutation.isPending.value
          "
          @create-team="createTeam"
          @create-role="createRole"
          @update-team-status="updateTeamStatus"
          @update-role-status="updateRoleStatus"
        />
      </v-col>

      <v-col cols="12" lg="8">
        <ServingAssignmentsCard
          v-model:form="assignmentForm"
          v-model:filters="assignmentFilters"
          :assignments="assignments"
          :members="activeMembers"
          :teams="teams"
          :roles="roles"
          :loading="
            assignmentsQuery.isPending.value || membersQuery.isPending.value
          "
          :can-manage="canManage"
          :can-create="canCreateAssignment"
          :create-pending="createAssignmentMutation.isPending.value"
          :update-pending="updateAssignmentMutation.isPending.value"
          @create="createAssignment"
          @refresh="assignmentsQuery.refetch()"
          @update-status="updateAssignmentStatus"
        />
      </v-col>
    </v-row>

    <v-card class="mt-4" variant="outlined">
      <v-tabs v-model="workspaceTab" color="primary">
        <v-tab value="availability">{{ t("Availability") }}</v-tab>
        <v-tab value="check-ins">{{ t("Arrival status") }}</v-tab>
      </v-tabs>
      <v-divider />
      <v-card-text>
        <v-window v-model="workspaceTab">
          <v-window-item value="availability">
            <ServingAvailabilityPanel
              v-model:form="availabilityForm"
              v-model:filters="availabilityFilters"
              :records="availability"
              :members="members"
              :selectable-members="activeMembers"
              :loading="availabilityQuery.isPending.value"
              :can-manage="canManage"
              :can-create="canCreateAvailability"
              :create-pending="createAvailabilityMutation.isPending.value"
              @create="createAvailability"
              @refresh="availabilityQuery.refetch()"
            />
          </v-window-item>
          <v-window-item value="check-ins">
            <ServingCheckInsPanel
              v-model:form="checkInForm"
              v-model:filters="checkInFilters"
              :records="checkIns"
              :assignments="assignmentDirectory"
              :members="members"
              :loading="checkInsQuery.isPending.value"
              :can-manage="canManage"
              :can-save="canSaveCheckIn"
              :needs-reason="checkInNeedsReason"
              :save-pending="updateCheckInMutation.isPending.value"
              @save="saveCheckIn"
              @refresh="checkInsQuery.refetch()"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="successVisible" color="success" timeout="2600">
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>
