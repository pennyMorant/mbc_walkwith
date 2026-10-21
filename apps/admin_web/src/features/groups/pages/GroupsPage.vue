<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import GroupCatalogCard from "../components/GroupCatalogCard.vue";
import GroupEditorDrawer from "../components/GroupEditorDrawer.vue";
import GroupWorkspaceCard from "../components/GroupWorkspaceCard.vue";
import { useGroupMinistryPage } from "../composables/use_group_ministry_page";

const {
  applicationFilters,
  applications,
  applicationsQuery,
  attendance,
  attendanceFilters,
  attendanceForm,
  attendanceMutation,
  attendanceQuery,
  canCreateMaterial,
  canManage,
  canRecordAttendance,
  canSave,
  drawer,
  editGroup,
  filters,
  filteredMemberships,
  form,
  groups,
  groupsQuery,
  listErrorMessage,
  materialCreateMutation,
  materialFilters,
  materialForm,
  materialMutationPending,
  materials,
  materialsQuery,
  materialUpdateMutation,
  membershipFilters,
  membershipMutation,
  memberships,
  membershipsQuery,
  newGroup,
  optionItems,
  reviewMutation,
  saveMutation,
  selectedGroup,
  selectGroup,
  successMessage,
  successVisible,
  t,
  workspaceErrorMessage
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

    <v-alert
      v-if="workspaceErrorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
      density="comfortable"
    >
      {{ workspaceErrorMessage }}
    </v-alert>

    <v-card class="mt-5" variant="outlined">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="groupsQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :label="t('Status')"
              :items="optionItems(['', 'draft', 'active', 'paused', 'archived'])"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.visibility"
              :label="t('Visibility')"
              :items="optionItems(['', 'public', 'members', 'group', 'private'])"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="1">
            <v-btn block variant="tonal" @click="groupsQuery.refetch()">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <GroupCatalogCard
          :can-manage="canManage"
          :error-message="listErrorMessage"
          :groups="groups"
          :pending="groupsQuery.isPending.value"
          :selected-group-id="selectedGroup?.id ?? null"
          @edit="editGroup"
          @retry="groupsQuery.refetch()"
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
          :memberships-pending="membershipsQuery.isPending.value"
          :materials-pending="materialsQuery.isPending.value"
          :attendance-pending="attendanceQuery.isPending.value"
          :review-pending="reviewMutation.isPending.value"
          :membership-mutation-pending="membershipMutation.isPending.value"
          :material-mutation-pending="materialMutationPending"
          :attendance-mutation-pending="attendanceMutation.isPending.value"
          :can-manage="canManage"
          :can-create-material="canCreateMaterial"
          :can-record-attendance="canRecordAttendance"
          @refresh-applications="applicationsQuery.refetch()"
          @refresh-memberships="membershipsQuery.refetch()"
          @refresh-materials="materialsQuery.refetch()"
          @refresh-attendance="attendanceQuery.refetch()"
          @review="
            (applicationId, status) =>
              reviewMutation.mutate({ applicationId, status })
          "
          @update-membership="
            (membership, status) =>
              membershipMutation.mutate({ membership, status })
          "
          @create-material="materialCreateMutation.mutate()"
          @update-material="
            (material, status) =>
              materialUpdateMutation.mutate({ material, status })
          "
          @record-attendance="attendanceMutation.mutate()"
        />
      </v-col>
    </v-row>

    <GroupEditorDrawer
      v-model="drawer"
      :selected-group="selectedGroup"
      :form="form"
      :can-manage="canManage"
      :can-save="canSave"
      :save-loading="saveMutation.isPending.value"
      @save="saveMutation.mutate()"
    />

    <v-snackbar v-model="successVisible" color="success" timeout="2600">
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>
