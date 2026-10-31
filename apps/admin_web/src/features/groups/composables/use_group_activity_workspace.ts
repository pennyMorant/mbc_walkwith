import type {
  GroupAttendanceRecord,
  GroupAttendanceStatus,
  GroupAttendanceUpsertRequest,
  GroupMaterialAssignment,
  GroupMaterialAssignmentCreateRequest,
  GroupMaterialType,
  GroupMembership,
  GroupTaskStatus,
  MinistryGroup
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, type ComputedRef, type Ref } from "vue";

import {
  createGroupMaterial,
  listGroupAttendance,
  listGroupMaterials,
  updateGroupMaterial,
  upsertGroupAttendance
} from "@/core/api/group_activity";
import {
  currentGroupDateTimeInput,
  groupAttendanceFilterSnapshot,
  groupMaterialFilterSnapshot,
  resetGroupActivityForms,
  sameGroupIntent,
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
  const appliedMaterialFilters = ref(groupMaterialFilterSnapshot(materialFilters));
  const appliedAttendanceFilters = ref(
    groupAttendanceFilterSnapshot(attendanceFilters)
  );
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
      { ...appliedMaterialFilters.value, limit: 100 }
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
      { ...appliedAttendanceFilters.value, limit: 100 }
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

  function assertManage() {
    if (!input.canManage.value) {
      throw new Error(input.t("Group manage access required"));
    }
  }

  const materialCreateMutation = useMutation({
    onMutate: (intent: GroupMaterialCreateIntent) =>
      input.feedback.begin("material-command", intent.groupId),
    mutationFn: (intent: GroupMaterialCreateIntent) => {
      assertManage();
      return createGroupMaterial(intent.groupId, intent.payload);
    },
    onSuccess: async (_material, intent, context) => {
      const currentPayload = materialCreatePayload(materialForm);
      if (
        input.feedback.isCurrent(context) &&
        currentPayload &&
        sameGroupIntent(currentPayload, intent.payload)
      ) {
        materialForm.materialId = "";
        materialForm.title = "";
        materialForm.dueAt = "";
      }
      input.feedback.succeed(context, input.t("Material assigned."));
      await queryClient.invalidateQueries({ queryKey: ["group-materials"] });
    },
    onError: (error, variables, context) =>
      input.feedback.capture(error, variables, context)
  });
  const materialUpdateMutation = useMutation({
    onMutate: (intent: {
      groupId: string;
      materialId: string;
      status: GroupTaskStatus;
    }) => input.feedback.begin("material-command", intent.groupId),
    mutationFn: (intent: {
      groupId: string;
      materialId: string;
      status: GroupTaskStatus;
    }) => {
      assertManage();
      return updateGroupMaterial(intent.groupId, intent.materialId, {
        status: intent.status
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
    onMutate: (intent: GroupAttendanceIntent) =>
      input.feedback.begin("attendance-save", intent.groupId),
    mutationFn: (intent: GroupAttendanceIntent) => {
      assertManage();
      return upsertGroupAttendance(intent.groupId, intent.payload);
    },
    onSuccess: async (_record, intent, context) => {
      const currentPayload = attendancePayload(attendanceForm);
      if (
        input.feedback.isCurrent(context) &&
        currentPayload &&
        sameGroupIntent(currentPayload, intent.payload)
      ) {
        attendanceForm.note = "";
      }
      input.feedback.succeed(context, input.t("Attendance saved."));
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
      materialForm.materialId.trim().length > 0 &&
      materialCreatePayload(materialForm) != null
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
  const attendanceMutationPending = computed(
    () => attendanceMutation.isPending.value
  );
  const materialsInitialError = computed(() =>
    materialsQuery.data.value === undefined ? materialsQuery.error.value : null
  );
  const materialsRefreshError = computed(() =>
    materialsQuery.data.value !== undefined ? materialsQuery.error.value : null
  );
  const attendanceInitialError = computed(() =>
    attendanceQuery.data.value === undefined ? attendanceQuery.error.value : null
  );
  const attendanceRefreshError = computed(() =>
    attendanceQuery.data.value !== undefined ? attendanceQuery.error.value : null
  );

  function applyMaterialFilters() {
    appliedMaterialFilters.value = groupMaterialFilterSnapshot(materialFilters);
  }

  function applyAttendanceFilters() {
    appliedAttendanceFilters.value =
      groupAttendanceFilterSnapshot(attendanceFilters);
  }

  function createMaterial() {
    const groupId = input.selectedGroup.value?.id;
    const payload = materialCreatePayload(materialForm);
    if (
      !groupId ||
      !canCreateMaterial.value ||
      !payload ||
      materialMutationPending.value
    ) {
      return;
    }
    materialCreateMutation.mutate({
      groupId,
      payload
    });
  }

  function updateMaterialStatus(
    material: GroupMaterialAssignment,
    status: GroupTaskStatus
  ) {
    const groupId = input.selectedGroup.value?.id;
    if (
      !groupId ||
      !input.canManage.value ||
      materialMutationPending.value
    ) {
      return;
    }
    materialUpdateMutation.mutate({ groupId, materialId: material.id, status });
  }

  function recordAttendance() {
    const groupId = input.selectedGroup.value?.id;
    const payload = attendancePayload(attendanceForm);
    const membership = input.memberships.value.find(
      (item) => item.userId === attendanceForm.memberUserId
    );
    if (
      !groupId ||
      !payload ||
      !canRecordAttendance.value ||
      attendanceMutation.isPending.value ||
      !membership ||
      membership.status === "inactive"
    ) {
      return;
    }
    attendanceMutation.mutate({ groupId, payload });
  }

  function resetForGroupChange() {
    resetGroupActivityForms(materialForm, attendanceForm);
  }

  return {
    applyAttendanceFilters,
    applyMaterialFilters,
    attendance,
    attendanceFilters,
    attendanceForm,
    attendanceMutationPending,
    attendanceInitialError,
    attendanceQuery,
    attendanceRefreshError,
    canCreateMaterial,
    canRecordAttendance,
    createMaterial,
    materialFilters,
    materialForm,
    materialMutationPending,
    materials,
    materialsInitialError,
    materialsQuery,
    materialsRefreshError,
    recordAttendance,
    resetForGroupChange,
    updateMaterialStatus
  };
}

type GroupMaterialCreateIntent = {
  groupId: string;
  payload: GroupMaterialAssignmentCreateRequest;
};

type GroupAttendanceIntent = {
  groupId: string;
  payload: GroupAttendanceUpsertRequest;
};

function materialCreatePayload(
  form: GroupMaterialForm
): GroupMaterialAssignmentCreateRequest | null {
  const dueAt = optionalDateTimeInputToIso(form.dueAt);
  if (dueAt === undefined) return null;
  return {
    materialType: form.materialType,
    materialId: form.materialId.trim(),
    title: form.title.trim(),
    status: form.status,
    dueAt
  };
}

function attendancePayload(
  form: GroupAttendanceForm
): GroupAttendanceUpsertRequest | null {
  const meetingDate = dateTimeInputToIso(form.meetingDate);
  if (!meetingDate) return null;
  return {
    meetingDate,
    memberUserId: form.memberUserId,
    status: form.status,
    note: form.note.trim()
  };
}

function dateTimeInputToIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function optionalDateTimeInputToIso(value: string) {
  return value ? dateTimeInputToIso(value) ?? undefined : null;
}

function isValidDateInput(value: string) {
  return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}
