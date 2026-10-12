import type {
  GroupAttendanceRecord,
  GroupAttendanceStatus,
  GroupMaterialAssignment,
  GroupMaterialType,
  GroupMembership,
  GroupTaskStatus,
  MinistryGroup
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, type ComputedRef, type Ref } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import {
  createGroupMaterial,
  listGroupAttendance,
  listGroupMaterials,
  updateGroupMaterial,
  upsertGroupAttendance
} from "@/core/api/group_activity";
import {
  currentGroupDateTimeInput,
  resetGroupActivityForms,
  type GroupAttendanceForm,
  type GroupMaterialForm
} from "../group_workspace_models";
import type { GroupMutationFeedback } from "./use_group_mutation_feedback";

type GroupActivityWorkspaceInput = {
  selectedGroup: Ref<MinistryGroup | null>;
  memberships: ComputedRef<GroupMembership[]>;
  canManage: ComputedRef<boolean>;
  feedback: GroupMutationFeedback;
  t: (key: string) => string;
};

export function useGroupActivityWorkspace(input: GroupActivityWorkspaceInput) {
  const queryClient = useQueryClient();
  const materialFilters = reactive({
    status: "" as GroupTaskStatus | "",
    materialType: "" as GroupMaterialType | ""
  });
  const attendanceFilters = reactive({
    status: "" as GroupAttendanceStatus | ""
  });
  const materialForm = reactive<GroupMaterialForm>({
    materialType: "manual",
    materialId: "",
    title: "",
    status: "assigned",
    dueAt: ""
  });
  const attendanceForm = reactive<GroupAttendanceForm>({
    meetingDate: currentGroupDateTimeInput(),
    memberUserId: "",
    status: "present",
    note: ""
  });
  const selectedGroupId = computed(() => input.selectedGroup.value?.id ?? null);

  const materialsQuery = useQuery({
    queryKey: computed(() => [
      "group-materials",
      selectedGroupId.value,
      { ...materialFilters, limit: 100 }
    ]),
    enabled: computed(() => Boolean(selectedGroupId.value)),
    queryFn: ({ queryKey }) => {
      const groupId = queryKey[1] as string | null;
      const query = queryKey[2] as typeof materialFilters & { limit: number };
      return groupId
        ? listGroupMaterials(groupId, query)
        : Promise.resolve([] as GroupMaterialAssignment[]);
    }
  });
  const attendanceQuery = useQuery({
    queryKey: computed(() => [
      "group-attendance",
      selectedGroupId.value,
      { ...attendanceFilters, limit: 100 }
    ]),
    enabled: computed(() => Boolean(selectedGroupId.value)),
    queryFn: ({ queryKey }) => {
      const groupId = queryKey[1] as string | null;
      const query = queryKey[2] as typeof attendanceFilters & { limit: number };
      return groupId
        ? listGroupAttendance(groupId, query)
        : Promise.resolve([] as GroupAttendanceRecord[]);
    }
  });

  function selectedOrThrow() {
    if (!input.canManage.value) {
      throw new Error(input.t("Group manage access required"));
    }
    return requireSelected(
      input.selectedGroup.value,
      input.t("No group selected.")
    );
  }

  const materialCreateMutation = useMutation({
    onMutate: () => input.feedback.begin(),
    mutationFn: () => {
      const group = selectedOrThrow();
      return createGroupMaterial(group.id, {
        materialType: materialForm.materialType,
        materialId: materialForm.materialId.trim(),
        title: materialForm.title.trim(),
        status: materialForm.status,
        dueAt: nullableDateTimeInputToIso(materialForm.dueAt, input.t)
      });
    },
    onSuccess: async (_material, _variables, context) => {
      if (input.feedback.succeed(context, input.t("Material assigned."))) {
        materialForm.materialId = "";
        materialForm.title = "";
        materialForm.dueAt = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["group-materials"] });
    },
    onError: (error, variables, context) =>
      input.feedback.capture(error, variables, context)
  });
  const materialUpdateMutation = useMutation({
    onMutate: () => input.feedback.begin(),
    mutationFn: (update: {
      material: GroupMaterialAssignment;
      status: GroupTaskStatus;
    }) => {
      const group = selectedOrThrow();
      return updateGroupMaterial(group.id, update.material.id, {
        status: update.status
      });
    },
    onSuccess: async (_material, _variables, context) => {
      input.feedback.succeed(context, input.t("Material updated."));
      await queryClient.invalidateQueries({ queryKey: ["group-materials"] });
    },
    onError: (error, variables, context) =>
      input.feedback.capture(error, variables, context)
  });
  const attendanceMutation = useMutation({
    onMutate: () => input.feedback.begin(),
    mutationFn: () => {
      const group = selectedOrThrow();
      const membership = input.memberships.value.find(
        (item) => item.userId === attendanceForm.memberUserId
      );
      if (!membership || membership.status === "inactive") {
        throw new Error(input.t("Select an active group member."));
      }
      return upsertGroupAttendance(group.id, {
        meetingDate: requiredDateTimeInputToIso(
          attendanceForm.meetingDate,
          input.t
        ),
        memberUserId: membership.userId,
        status: attendanceForm.status,
        note: attendanceForm.note.trim()
      });
    },
    onSuccess: async (_record, _variables, context) => {
      if (input.feedback.succeed(context, input.t("Attendance saved."))) {
        attendanceForm.note = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["group-attendance"] });
    },
    onError: (error, variables, context) =>
      input.feedback.capture(error, variables, context)
  });

  const materials = computed(() => materialsQuery.data.value ?? []);
  const attendance = computed(() => attendanceQuery.data.value ?? []);
  const canCreateMaterial = computed(
    () =>
      input.canManage.value &&
      Boolean(input.selectedGroup.value) &&
      materialForm.title.trim().length > 0 &&
      materialForm.materialId.trim().length > 0
  );
  const canRecordAttendance = computed(
    () =>
      input.canManage.value &&
      Boolean(input.selectedGroup.value) &&
      input.memberships.value.some(
        (membership) =>
          membership.userId === attendanceForm.memberUserId &&
          membership.status !== "inactive"
      ) &&
      isValidDateInput(attendanceForm.meetingDate)
  );
  const materialMutationPending = computed(
    () =>
      materialCreateMutation.isPending.value ||
      materialUpdateMutation.isPending.value
  );
  const error = computed(
    () => materialsQuery.error.value || attendanceQuery.error.value
  );

  function resetForGroupChange() {
    resetGroupActivityForms(materialForm, attendanceForm);
  }

  return {
    attendance,
    attendanceFilters,
    attendanceForm,
    attendanceMutation,
    attendanceQuery,
    canCreateMaterial,
    canRecordAttendance,
    error,
    materialCreateMutation,
    materialFilters,
    materialForm,
    materialMutationPending,
    materials,
    materialsQuery,
    materialUpdateMutation,
    resetForGroupChange
  };
}

function requiredDateTimeInputToIso(value: string, t: (key: string) => string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(t("A valid date and time is required."));
  }
  return date.toISOString();
}

function nullableDateTimeInputToIso(value: string, t: (key: string) => string) {
  return value ? requiredDateTimeInputToIso(value, t) : null;
}

function isValidDateInput(value: string) {
  return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}
