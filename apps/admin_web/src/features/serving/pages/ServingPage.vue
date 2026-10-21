<script setup lang="ts">
import { ref } from "vue";

import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import ServingAssignmentsCard from "../components/ServingAssignmentsCard.vue";
import ServingAvailabilityPanel from "../components/ServingAvailabilityPanel.vue";
import ServingCheckInsPanel from "../components/ServingCheckInsPanel.vue";
import ServingSetupCard from "../components/ServingSetupCard.vue";
import { useServingPage } from "../composables/use_serving_page";

const workspaceTab = ref("availability");
const {
  activeMembers,
  assignmentDirectory,
  assignmentDirectoryQuery,
  assignmentFilters,
  assignmentForm,
  assignments,
  assignmentsErrorMessage,
  assignmentsQuery,
  availability,
  availabilityErrorMessage,
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
  checkInDirectoryQuery,
  checkIns,
  checkInsErrorMessage,
  checkInsQuery,
  commandErrorMessage,
  createAssignment,
  createAssignmentMutation,
  createAvailability,
  createAvailabilityMutation,
  createRole,
  createRoleMutation,
  createTeam,
  createTeamMutation,
  members,
  membersQuery,
  refreshAll,
  refreshAssignments,
  refreshAvailability,
  refreshCheckIns,
  refreshSetup,
  roleForm,
  roles,
  rolesQuery,
  saveCheckIn,
  successMessage,
  successVisible,
  setupErrorMessage,
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
    <AdminPageHeader
      :title="t('Serving schedule')"
      :subtitle="t('Manage teams, roles, assignments, availability, and arrival status.')"
    >
      <template #actions>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="refreshAll"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-alert
      v-if="commandErrorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
      density="comfortable"
    >
      {{ commandErrorMessage }}
    </v-alert>

    <v-row class="mt-4" dense>
      <v-col cols="12" lg="4">
        <ServingSetupCard
          v-model:team-form="teamForm"
          v-model:role-form="roleForm"
          :teams="teams"
          :roles="roles"
          :error-message="setupErrorMessage"
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
          @retry="refreshSetup"
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
          :error-message="assignmentsErrorMessage"
          :loading="
            assignmentsQuery.isPending.value ||
            membersQuery.isPending.value ||
            teamsQuery.isPending.value ||
            rolesQuery.isPending.value
          "
          :can-manage="canManage"
          :can-create="canCreateAssignment"
          :create-pending="createAssignmentMutation.isPending.value"
          :update-pending="updateAssignmentMutation.isPending.value"
          @create="createAssignment"
          @refresh="assignmentsQuery.refetch()"
          @retry="refreshAssignments"
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
              :error-message="availabilityErrorMessage"
              :loading="
                availabilityQuery.isPending.value || membersQuery.isPending.value
              "
              :can-manage="canManage"
              :can-create="canCreateAvailability"
              :create-pending="createAvailabilityMutation.isPending.value"
              @create="createAvailability"
              @refresh="availabilityQuery.refetch()"
              @retry="refreshAvailability"
            />
          </v-window-item>
          <v-window-item value="check-ins">
            <ServingCheckInsPanel
              v-model:form="checkInForm"
              v-model:filters="checkInFilters"
              :records="checkIns"
              :assignments="assignmentDirectory"
              :members="members"
              :error-message="checkInsErrorMessage"
              :loading="
                checkInsQuery.isPending.value ||
                assignmentDirectoryQuery.isPending.value ||
                checkInDirectoryQuery.isPending.value ||
                membersQuery.isPending.value
              "
              :can-manage="canManage"
              :can-save="canSaveCheckIn"
              :needs-reason="checkInNeedsReason"
              :save-pending="updateCheckInMutation.isPending.value"
              @save="saveCheckIn"
              @refresh="checkInsQuery.refetch()"
              @retry="refreshCheckIns"
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
