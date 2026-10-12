<script setup lang="ts">
import type {
  GroupApplication,
  GroupApplicationStatus,
  GroupAttendanceRecord,
  GroupAttendanceStatus,
  GroupMaterialAssignment,
  GroupMaterialType,
  GroupMembership,
  GroupMembershipStatus,
  GroupTaskStatus,
  MinistryGroup
} from "@mbc/api-contracts";
import { ref } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import type {
  GroupAttendanceForm,
  GroupMaterialForm
} from "../group_workspace_models";
import GroupApplicationsPanel from "./GroupApplicationsPanel.vue";
import GroupAttendancePanel from "./GroupAttendancePanel.vue";
import GroupMaterialsPanel from "./GroupMaterialsPanel.vue";
import GroupMembershipsPanel from "./GroupMembershipsPanel.vue";

const applicationStatus = defineModel<GroupApplicationStatus | "">(
  "applicationStatus",
  { required: true }
);
const applicationQuery = defineModel<string>("applicationQuery", {
  required: true
});
const membershipStatus = defineModel<GroupMembershipStatus | "">(
  "membershipStatus",
  { required: true }
);
const membershipQuery = defineModel<string>("membershipQuery", {
  required: true
});
const materialStatus = defineModel<GroupTaskStatus | "">("materialStatus", {
  required: true
});
const materialType = defineModel<GroupMaterialType | "">("materialType", {
  required: true
});
const attendanceStatus = defineModel<GroupAttendanceStatus | "">(
  "attendanceStatus",
  { required: true }
);
const materialForm = defineModel<GroupMaterialForm>("materialForm", {
  required: true
});
const attendanceForm = defineModel<GroupAttendanceForm>("attendanceForm", {
  required: true
});

defineProps<{
  group: MinistryGroup | null;
  applications: GroupApplication[];
  memberships: GroupMembership[];
  attendanceMemberships: GroupMembership[];
  materials: GroupMaterialAssignment[];
  attendance: GroupAttendanceRecord[];
  applicationsPending: boolean;
  membershipsPending: boolean;
  materialsPending: boolean;
  attendancePending: boolean;
  reviewPending: boolean;
  membershipMutationPending: boolean;
  materialMutationPending: boolean;
  attendanceMutationPending: boolean;
  canManage: boolean;
  canCreateMaterial: boolean;
  canRecordAttendance: boolean;
}>();

const emit = defineEmits<{
  refreshApplications: [];
  refreshMemberships: [];
  refreshMaterials: [];
  refreshAttendance: [];
  review: [applicationId: string, status: "approved" | "declined"];
  updateMembership: [membership: GroupMembership, status: GroupMembershipStatus];
  createMaterial: [];
  updateMaterial: [material: GroupMaterialAssignment, status: GroupTaskStatus];
  recordAttendance: [];
}>();

const { t } = useI18n();
const tab = ref("applications");

function forwardReview(
  applicationId: string,
  status: "approved" | "declined"
) {
  emit("review", applicationId, status);
}

function forwardMembershipUpdate(
  membership: GroupMembership,
  status: GroupMembershipStatus
) {
  emit("updateMembership", membership, status);
}

function forwardMaterialUpdate(
  material: GroupMaterialAssignment,
  status: GroupTaskStatus
) {
  emit("updateMaterial", material, status);
}
</script>

<template>
  <v-card variant="outlined">
    <v-card-title>{{ group?.name || t("Group workspace") }}</v-card-title>
    <v-card-subtitle v-if="group">
      {{ group.meetingTime || t("common.notSet") }} ·
      {{ group.location || t("common.notSet") }}
    </v-card-subtitle>
    <v-card-text v-if="!group">
      {{ t("Select a group to manage its ministry workflow.") }}
    </v-card-text>
    <template v-else>
      <v-tabs v-model="tab" color="primary" show-arrows>
        <v-tab value="applications">{{ t("Applications") }}</v-tab>
        <v-tab value="memberships">{{ t("Members") }}</v-tab>
        <v-tab value="materials">{{ t("Materials") }}</v-tab>
        <v-tab value="attendance">{{ t("Attendance") }}</v-tab>
      </v-tabs>
      <v-divider />
      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="applications">
            <GroupApplicationsPanel
              v-model:status="applicationStatus"
              v-model:query="applicationQuery"
              :applications="applications"
              :pending="applicationsPending"
              :review-pending="reviewPending"
              :can-manage="canManage"
              @refresh="emit('refreshApplications')"
              @review="forwardReview"
            />
          </v-window-item>
          <v-window-item value="memberships">
            <GroupMembershipsPanel
              v-model:status="membershipStatus"
              v-model:query="membershipQuery"
              :memberships="memberships"
              :pending="membershipsPending"
              :update-pending="membershipMutationPending"
              :can-manage="canManage"
              @refresh="emit('refreshMemberships')"
              @update-status="forwardMembershipUpdate"
            />
          </v-window-item>
          <v-window-item value="materials">
            <GroupMaterialsPanel
              v-model:form="materialForm"
              v-model:status="materialStatus"
              v-model:material-type="materialType"
              :materials="materials"
              :pending="materialsPending"
              :mutation-pending="materialMutationPending"
              :can-manage="canManage"
              :can-create="canCreateMaterial"
              @refresh="emit('refreshMaterials')"
              @create="emit('createMaterial')"
              @update-status="forwardMaterialUpdate"
            />
          </v-window-item>
          <v-window-item value="attendance">
            <GroupAttendancePanel
              v-model:form="attendanceForm"
              v-model:status="attendanceStatus"
              :attendance="attendance"
              :memberships="attendanceMemberships"
              :pending="attendancePending"
              :mutation-pending="attendanceMutationPending"
              :can-manage="canManage"
              :can-record="canRecordAttendance"
              @refresh="emit('refreshAttendance')"
              @record="emit('recordAttendance')"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
    </template>
  </v-card>
</template>
