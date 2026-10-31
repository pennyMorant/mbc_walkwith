<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminCatalogFilters from "@/core/ui/AdminCatalogFilters.vue";

import GroupCatalogCard from "../components/GroupCatalogCard.vue";
import GroupEditorDrawer from "../components/GroupEditorDrawer.vue";
import GroupWorkspaceCard from "../components/GroupWorkspaceCard.vue";
import { useGroupMinistryPage } from "../composables/use_group_ministry_page";

const {
  applyApplicationFilters,
  applyAttendanceFilters,
  applyGroupFilters,
  applyMaterialFilters,
  applicationFilters,
  applications,
  applicationsCommandErrorMessage,
  applicationsErrorMessage,
  applicationsQuery,
  applicationsRefreshErrorMessage,
  attendance,
  attendanceCommandErrorMessage,
  attendanceErrorMessage,
  attendanceFilters,
  attendanceForm,
  attendanceMutationPending,
  attendanceQuery,
  attendanceRefreshErrorMessage,
  canCreateMaterial,
  canManage,
  canRecordAttendance,
  canSave,
  clearGroupFilters,
  drawer,
  editorCommandErrorMessage,
  editGroup,
  filters,
  filteredMemberships,
  form,
  groups,
  groupsQuery,
  listErrorMessage,
  listRefreshErrorMessage,
  materialFilters,
  materialForm,
  materialMutationPending,
  materials,
  materialsCommandErrorMessage,
  materialsErrorMessage,
  materialsQuery,
  materialsRefreshErrorMessage,
  membershipFilters,
  membershipMutationPending,
  memberships,
  membershipsCommandErrorMessage,
  membershipsErrorMessage,
  membershipsQuery,
  membershipsRefreshErrorMessage,
  newGroup,
  optionItems,
  reviewPending,
  reviewApplication,
  refreshGroups,
  savePending,
  saveGroup,
  selectedGroup,
  selectGroup,
  successMessage,
  successVisible,
  t,
  updateMaterialStatus,
  updateMembershipStatus,
  recordAttendance,
  createMaterial
} = useGroupMinistryPage();
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('Groups')"
      :subtitle="t('Manage fellowship groups, applications, and member assignment.')"
    >
      <template #actions>
        <v-btn
          v-if="canManage"
          color="primary"
          prepend-icon="mdi-plus"
          @click="newGroup"
        >
          {{ t("New group") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <AdminCatalogFilters
      v-model:query="filters.query"
      v-model:status="filters.status"
      v-model:visibility="filters.visibility"
      :status-items="optionItems(['', 'draft', 'active', 'paused', 'archived'])"
      :visibility-items="optionItems(['', 'public', 'members', 'group', 'private'])"
      :fetching="groupsQuery.isFetching.value"
      @apply="applyGroupFilters"
      @clear="clearGroupFilters"
    />

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <GroupCatalogCard
          :can-manage="canManage"
          :error-message="listErrorMessage"
          :refresh-error-message="listRefreshErrorMessage"
          :groups="groups"
          :pending="groupsQuery.isPending.value"
          :selected-group-id="selectedGroup?.id ?? null"
          @edit="editGroup"
          @retry="refreshGroups"
          @select="selectGroup"
        />
      </v-col>

      <v-col cols="12" lg="8">
        <GroupWorkspaceCard
          v-model:application-status="applicationFilters.status"
          v-model:application-query="applicationFilters.query"
          v-model:membership-status="membershipFilters.status"
          v-model:membership-query="membershipFilters.query"
          v-model:material-status="materialFilters.status"
          v-model:material-type="materialFilters.materialType"
          v-model:attendance-status="attendanceFilters.status"
          v-model:material-form="materialForm"
          v-model:attendance-form="attendanceForm"
          :group="selectedGroup"
          :applications="applications"
          :memberships="filteredMemberships"
          :attendance-memberships="memberships"
          :materials="materials"
          :attendance="attendance"
          :applications-pending="applicationsQuery.isPending.value"
          :applications-error-message="applicationsErrorMessage"
          :applications-refresh-error-message="applicationsRefreshErrorMessage"
          :applications-command-error-message="applicationsCommandErrorMessage"
          :memberships-pending="membershipsQuery.isPending.value"
          :memberships-error-message="membershipsErrorMessage"
          :memberships-refresh-error-message="membershipsRefreshErrorMessage"
          :memberships-command-error-message="membershipsCommandErrorMessage"
          :materials-pending="materialsQuery.isPending.value"
          :materials-error-message="materialsErrorMessage"
          :materials-refresh-error-message="materialsRefreshErrorMessage"
          :materials-command-error-message="materialsCommandErrorMessage"
          :attendance-pending="attendanceQuery.isPending.value"
          :attendance-error-message="attendanceErrorMessage"
          :attendance-refresh-error-message="attendanceRefreshErrorMessage"
          :attendance-command-error-message="attendanceCommandErrorMessage"
          :review-pending="reviewPending"
          :membership-mutation-pending="membershipMutationPending"
          :material-mutation-pending="materialMutationPending"
          :attendance-mutation-pending="attendanceMutationPending"
          :can-manage="canManage"
          :can-create-material="canCreateMaterial"
          :can-record-attendance="canRecordAttendance"
          @apply-application-filters="applyApplicationFilters"
          @retry-applications="applicationsQuery.refetch()"
          @refresh-memberships="membershipsQuery.refetch()"
          @apply-material-filters="applyMaterialFilters"
          @retry-materials="materialsQuery.refetch()"
          @apply-attendance-filters="applyAttendanceFilters"
          @retry-attendance="attendanceQuery.refetch()"
          @review="reviewApplication"
          @update-membership="updateMembershipStatus"
          @create-material="createMaterial"
          @update-material="updateMaterialStatus"
          @record-attendance="recordAttendance"
        />
      </v-col>
    </v-row>

    <GroupEditorDrawer
      v-model="drawer"
      :selected-group="selectedGroup"
      :form="form"
      :can-manage="canManage"
      :can-save="canSave"
      :save-loading="savePending"
      :command-error-message="editorCommandErrorMessage"
      @save="saveGroup"
    />

    <v-snackbar v-model="successVisible" color="success" timeout="2600">
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>
