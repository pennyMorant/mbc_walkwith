import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, watch } from "vue";

import {
  listServingAssignments,
  listServingAvailability,
  listServingCheckIns,
  listServingMembers,
  listServingRoles,
  listServingTeams,
  type ServingAssignmentFilters,
  type ServingAvailabilityFilters,
  type ServingCheckInFilters
} from "@/core/api/serving";
import { servingCheckInRequiresReason } from "../serving_presenters";
import {
  createAssignmentForm,
  createAvailabilityForm,
  createCheckInForm,
  createRoleForm,
  createTeamForm,
  hasValidDateRange
} from "../serving_workspace_models";

export function useServingWorkspaceState() {
  const teamForm = reactive(createTeamForm());
  const roleForm = reactive(createRoleForm());
  const assignmentForm = reactive(createAssignmentForm());
  const availabilityForm = reactive(createAvailabilityForm());
  const checkInForm = reactive(createCheckInForm());
  const assignmentFilters = reactive<ServingAssignmentFilters>({
    status: "",
    query: ""
  });
  const availabilityFilters = reactive<ServingAvailabilityFilters>({
    status: "",
    userId: ""
  });
  const checkInFilters = reactive<ServingCheckInFilters>({
    status: "",
    assignmentId: "",
    userId: ""
  });

  const membersQuery = useQuery({
    queryKey: ["serving-members"],
    queryFn: () => listServingMembers({ limit: 200 })
  });
  const teamsQuery = useQuery({
    queryKey: ["serving-teams"],
    queryFn: () => listServingTeams({ limit: 200 })
  });
  const rolesQuery = useQuery({
    queryKey: ["serving-roles"],
    queryFn: () => listServingRoles({ limit: 200 })
  });
  const assignmentDirectoryQuery = useQuery({
    queryKey: ["serving-assignments", "directory"],
    queryFn: () => listServingAssignments({ limit: 500 })
  });
  const assignmentsQuery = useQuery({
    queryKey: computed(() => [
      "serving-assignments",
      "workspace",
      { ...assignmentFilters }
    ]),
    queryFn: () =>
      listServingAssignments({ ...assignmentFilters, limit: 100 })
  });
  const availabilityQuery = useQuery({
    queryKey: computed(() => [
      "serving-availability",
      "workspace",
      { ...availabilityFilters }
    ]),
    queryFn: () =>
      listServingAvailability({ ...availabilityFilters, limit: 100 })
  });
  const checkInDirectoryQuery = useQuery({
    queryKey: ["serving-check-ins", "directory"],
    queryFn: () => listServingCheckIns({ limit: 500 })
  });
  const checkInsQuery = useQuery({
    queryKey: computed(() => [
      "serving-check-ins",
      "workspace",
      { ...checkInFilters }
    ]),
    queryFn: () => listServingCheckIns({ ...checkInFilters, limit: 100 })
  });

  const members = computed(() => membersQuery.data.value ?? []);
  const activeMembers = computed(() =>
    members.value.filter((member) => member.status === "active")
  );
  const teams = computed(() => teamsQuery.data.value ?? []);
  const roles = computed(() => rolesQuery.data.value ?? []);
  const assignments = computed(() => assignmentsQuery.data.value ?? []);
  const assignmentDirectory = computed(
    () => assignmentDirectoryQuery.data.value ?? []
  );
  const availability = computed(() => availabilityQuery.data.value ?? []);
  const checkIns = computed(() => checkInsQuery.data.value ?? []);
  const checkInDirectory = computed(
    () => checkInDirectoryQuery.data.value ?? []
  );
  const selectedAssignmentRole = computed(() =>
    roles.value.find((role) => role.id === assignmentForm.roleId)
  );
  const selectedCheckIn = computed(() =>
    checkInDirectory.value.find(
      (record) => record.assignmentId === checkInForm.assignmentId
    )
  );

  const canCreateTeam = computed(() => teamForm.name.trim().length > 0);
  const canCreateRole = computed(() =>
    Boolean(roleForm.teamId && roleForm.name.trim())
  );
  const canCreateAssignment = computed(() =>
    Boolean(
      assignmentForm.teamId &&
        assignmentForm.roleId &&
        selectedAssignmentRole.value?.teamId === assignmentForm.teamId &&
        assignmentForm.userId &&
        assignmentForm.title.trim() &&
        hasValidDateRange(assignmentForm.startsAt, assignmentForm.endsAt)
    )
  );
  const canCreateAvailability = computed(() =>
    Boolean(
      availabilityForm.userId &&
        availabilityForm.endsAt &&
        hasValidDateRange(
          availabilityForm.startsAt,
          availabilityForm.endsAt
        )
    )
  );
  const checkInNeedsReason = computed(() =>
    servingCheckInRequiresReason(
      selectedCheckIn.value,
      checkInForm.status
    )
  );
  const canSaveCheckIn = computed(() =>
    Boolean(
      checkInForm.assignmentId &&
        (!checkInNeedsReason.value || checkInForm.note.trim())
    )
  );

  watch(
    () => assignmentForm.teamId,
    () => {
      if (selectedAssignmentRole.value?.teamId !== assignmentForm.teamId) {
        assignmentForm.roleId = "";
      }
    }
  );
  watch(
    [
      () => checkInForm.assignmentId,
      () => selectedCheckIn.value?.status
    ],
    () => {
      checkInForm.status = selectedCheckIn.value?.status ?? "checked_in";
      checkInForm.note = "";
    }
  );

  return {
    activeMembers,
    assignmentDirectory,
    assignmentDirectoryQuery,
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
    canSaveCheckIn,
    checkInDirectoryQuery,
    checkInFilters,
    checkInForm,
    checkInNeedsReason,
    checkIns,
    checkInsQuery,
    members,
    membersQuery,
    roleForm,
    roles,
    rolesQuery,
    teamForm,
    teams,
    teamsQuery
  };
}
