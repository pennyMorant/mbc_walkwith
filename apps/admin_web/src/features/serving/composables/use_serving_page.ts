import type {
  ServingAdminAssignmentCreateRequest,
  ServingAdminAvailabilityCreateRequest,
  ServingAssignment,
  ServingAssignmentStatus,
  ServingRoleUpsertRequest,
  ServingRole,
  ServingStatus,
  ServingTeam,
  ServingTeamUpsertRequest
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createServingAssignment,
  createServingAvailability,
  createServingRole,
  createServingTeam,
  updateServingAssignment,
  updateServingCheckIn,
  updateServingRole,
  updateServingTeam
} from "@/core/api/serving";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  assignmentPayload,
  availabilityPayload,
  checkInPayload,
  createAssignmentForm,
  createAvailabilityForm,
  createRoleForm,
  createTeamForm,
  rolePayload,
  sameServingPayload,
  teamPayload,
  type ServingCheckInIntent
} from "../serving_workspace_models";
import { useServingMutationFeedback } from "./use_serving_mutation_feedback";
import { useServingWorkspaceState } from "./use_serving_workspace_state";

export function useServingPage() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const workspace = useServingWorkspaceState();
  const canManage = computed(() => authStore.can("serving:manage"));
  const successMessage = ref("");
  const mutationFeedback = useServingMutationFeedback(successMessage, t);
  const setupCommandErrorMessage = mutationFeedback.messageFor(
    "team-create",
    "team-update",
    "role-create",
    "role-update"
  );
  const assignmentsCommandErrorMessage = mutationFeedback.messageFor(
    "assignment-create",
    "assignment-update"
  );
  const availabilityCommandErrorMessage =
    mutationFeedback.messageFor("availability-create");
  const checkInsCommandErrorMessage = mutationFeedback.messageFor("check-in");
  const successVisible = computed({
    get: () => successMessage.value.length > 0,
    set: (visible: boolean) => {
      if (!visible) successMessage.value = "";
    }
  });

  function assertManage() {
    if (!canManage.value) {
      throw new Error(t("Serving manage access required"));
    }
  }
  async function invalidate(...keys: string[]) {
    await Promise.all(
      keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    );
  }

  const createTeamMutation = useMutation({
    onMutate: () => mutationFeedback.begin("team-create"),
    mutationFn: (input: ServingTeamUpsertRequest) => {
      assertManage();
      return createServingTeam(input);
    },
    onSuccess: async (team, input, context) => {
      if (mutationFeedback.isCurrent(context)) {
        if (sameServingPayload(teamPayload(workspace.teamForm), input)) {
          Object.assign(workspace.teamForm, createTeamForm());
        }
        if (!workspace.roleForm.teamId) {
          workspace.roleForm.teamId = team.id;
        }
        if (!workspace.assignmentForm.teamId) {
          workspace.assignmentForm.teamId = team.id;
        }
        mutationFeedback.succeed(context, t("Team created."));
      }
      await invalidate("serving-teams");
    },
    onError: mutationFeedback.capture
  });
  const updateTeamMutation = useMutation({
    onMutate: () => mutationFeedback.begin("team-update"),
    mutationFn: (input: { teamId: string; status: ServingStatus }) => {
      assertManage();
      return updateServingTeam(input.teamId, { status: input.status });
    },
    onSuccess: async (_team, _input, context) => {
      mutationFeedback.succeed(context, t("Team updated."));
      await invalidate("serving-teams");
    },
    onError: mutationFeedback.capture
  });
  const createRoleMutation = useMutation({
    onMutate: () => mutationFeedback.begin("role-create"),
    mutationFn: (input: ServingRoleUpsertRequest) => {
      assertManage();
      return createServingRole(input);
    },
    onSuccess: async (role, input, context) => {
      if (mutationFeedback.isCurrent(context)) {
        if (sameServingPayload(rolePayload(workspace.roleForm), input)) {
          Object.assign(workspace.roleForm, createRoleForm(), {
            teamId: role.teamId
          });
        }
        if (!workspace.assignmentForm.teamId && !workspace.assignmentForm.roleId) {
          workspace.assignmentForm.teamId = role.teamId;
          workspace.assignmentForm.roleId = role.id;
        }
        mutationFeedback.succeed(context, t("Role created."));
      }
      await invalidate("serving-roles");
    },
    onError: mutationFeedback.capture
  });
  const updateRoleMutation = useMutation({
    onMutate: () => mutationFeedback.begin("role-update"),
    mutationFn: (input: { roleId: string; status: ServingStatus }) => {
      assertManage();
      return updateServingRole(input.roleId, { status: input.status });
    },
    onSuccess: async (_role, _input, context) => {
      mutationFeedback.succeed(context, t("Role updated."));
      await invalidate("serving-roles");
    },
    onError: mutationFeedback.capture
  });
  const createAssignmentMutation = useMutation({
    onMutate: () => mutationFeedback.begin("assignment-create"),
    mutationFn: (input: ServingAdminAssignmentCreateRequest) => {
      assertManage();
      return createServingAssignment(input);
    },
    onSuccess: async (_assignment, input, context) => {
      if (
        mutationFeedback.isCurrent(context) &&
        sameServingPayload(assignmentPayload(workspace.assignmentForm), input)
      ) {
        Object.assign(workspace.assignmentForm, createAssignmentForm(), {
          roleId: input.roleId,
          teamId: input.teamId,
          userId: input.userId
        });
      }
      mutationFeedback.succeed(context, t("Assignment created."));
      await invalidate("serving-assignments");
    },
    onError: mutationFeedback.capture
  });
  const updateAssignmentMutation = useMutation({
    onMutate: () => mutationFeedback.begin("assignment-update"),
    mutationFn: (input: {
      assignmentId: string;
      status: ServingAssignmentStatus;
    }) => {
      assertManage();
      return updateServingAssignment(input.assignmentId, {
        status: input.status
      });
    },
    onSuccess: async (_assignment, _input, context) => {
      mutationFeedback.succeed(context, t("Assignment updated."));
      await invalidate("serving-assignments");
    },
    onError: mutationFeedback.capture
  });
  const createAvailabilityMutation = useMutation({
    onMutate: () => mutationFeedback.begin("availability-create"),
    mutationFn: (input: ServingAdminAvailabilityCreateRequest) => {
      assertManage();
      return createServingAvailability(input);
    },
    onSuccess: async (_record, input, context) => {
      if (
        mutationFeedback.isCurrent(context) &&
        sameServingPayload(availabilityPayload(workspace.availabilityForm), input)
      ) {
        Object.assign(workspace.availabilityForm, createAvailabilityForm(), {
          userId: input.userId
        });
      }
      mutationFeedback.succeed(context, t("Availability saved."));
      await invalidate("serving-availability");
    },
    onError: mutationFeedback.capture
  });
  const updateCheckInMutation = useMutation({
    onMutate: () => mutationFeedback.begin("check-in"),
    mutationFn: (input: ServingCheckInIntent) => {
      assertManage();
      return updateServingCheckIn(input.assignmentId, {
        status: input.status,
        note: input.note
      });
    },
    onSuccess: async (_record, input, context) => {
      if (
        mutationFeedback.isCurrent(context) &&
        sameServingPayload(checkInPayload(workspace.checkInForm), input)
      ) {
        workspace.checkInForm.note = "";
      }
      mutationFeedback.succeed(context, t("Arrival status saved."));
      await invalidate("serving-check-ins");
    },
    onError: mutationFeedback.capture
  });

  const setupQueries = [workspace.teamsQuery, workspace.rolesQuery];
  const assignmentQueries = [
    workspace.assignmentsQuery,
    workspace.membersQuery,
    workspace.teamsQuery,
    workspace.rolesQuery
  ];
  const availabilityQueries = [
    workspace.availabilityQuery,
    workspace.membersQuery
  ];
  const checkInQueries = [
    workspace.checkInsQuery,
    workspace.assignmentDirectoryQuery,
    workspace.checkInDirectoryQuery,
    workspace.membersQuery
  ];
  const setupErrorMessage = computed(() =>
    formatQueryError(setupQueries, false)
  );
  const setupRefreshErrorMessage = computed(() =>
    formatQueryError(setupQueries, true)
  );
  const assignmentsErrorMessage = computed(() =>
    formatQueryError(assignmentQueries, false)
  );
  const assignmentsRefreshErrorMessage = computed(() =>
    formatQueryError(assignmentQueries, true)
  );
  const availabilityErrorMessage = computed(() =>
    formatQueryError(availabilityQueries, false)
  );
  const availabilityRefreshErrorMessage = computed(() =>
    formatQueryError(availabilityQueries, true)
  );
  const checkInsErrorMessage = computed(() =>
    formatQueryError(checkInQueries, false)
  );
  const checkInsRefreshErrorMessage = computed(() =>
    formatQueryError(checkInQueries, true)
  );

  function formatQueryError(
    queries: Array<{
      data: { value: unknown };
      error: { value: unknown };
    }>,
    forRefresh: boolean
  ) {
    const error = queries.find(
      (query) =>
        query.error.value != null &&
        (query.data.value !== undefined) === forRefresh
    )?.error.value;
    return formatApiErrorMessage(error ?? null, t("common.error"));
  }

  function mutateWhen(allowed: boolean, action: () => void) {
    if (canManage.value && allowed) action();
  }
  function updateTeamStatus(team: ServingTeam, status: ServingStatus) {
    mutateWhen(!updateTeamMutation.isPending.value, () =>
      updateTeamMutation.mutate({ teamId: team.id, status })
    );
  }
  function updateRoleStatus(role: ServingRole, status: ServingStatus) {
    mutateWhen(!updateRoleMutation.isPending.value, () =>
      updateRoleMutation.mutate({ roleId: role.id, status })
    );
  }
  function updateAssignmentStatus(
    assignment: ServingAssignment,
    status: ServingAssignmentStatus
  ) {
    mutateWhen(!updateAssignmentMutation.isPending.value, () =>
      updateAssignmentMutation.mutate({ assignmentId: assignment.id, status })
    );
  }
  async function refreshAll() {
    await Promise.all([
      workspace.membersQuery.refetch(),
      workspace.teamsQuery.refetch(),
      workspace.rolesQuery.refetch(),
      workspace.assignmentsQuery.refetch(),
      workspace.assignmentDirectoryQuery.refetch(),
      workspace.availabilityQuery.refetch(),
      workspace.checkInsQuery.refetch(),
      workspace.checkInDirectoryQuery.refetch()
    ]);
  }
  async function refreshSetup() {
    await Promise.all([
      workspace.teamsQuery.refetch(),
      workspace.rolesQuery.refetch()
    ]);
  }
  async function refreshAssignments() {
    await Promise.all([
      workspace.assignmentsQuery.refetch(),
      workspace.membersQuery.refetch(),
      workspace.teamsQuery.refetch(),
      workspace.rolesQuery.refetch()
    ]);
  }
  async function refreshAvailability() {
    await Promise.all([
      workspace.availabilityQuery.refetch(),
      workspace.membersQuery.refetch()
    ]);
  }
  async function refreshCheckIns() {
    await Promise.all([
      workspace.checkInsQuery.refetch(),
      workspace.assignmentDirectoryQuery.refetch(),
      workspace.checkInDirectoryQuery.refetch(),
      workspace.membersQuery.refetch()
    ]);
  }

  return {
    ...workspace,
    assignmentsCommandErrorMessage,
    assignmentsErrorMessage,
    assignmentsRefreshErrorMessage,
    availabilityCommandErrorMessage,
    availabilityErrorMessage,
    availabilityRefreshErrorMessage,
    canManage,
    checkInsCommandErrorMessage,
    checkInsErrorMessage,
    checkInsRefreshErrorMessage,
    createAssignment: () =>
      mutateWhen(workspace.canCreateAssignment.value, () => {
        const payload = assignmentPayload(workspace.assignmentForm);
        if (payload) createAssignmentMutation.mutate(payload);
      }),
    createAssignmentMutation,
    createAvailability: () =>
      mutateWhen(workspace.canCreateAvailability.value, () => {
        const payload = availabilityPayload(workspace.availabilityForm);
        if (payload) createAvailabilityMutation.mutate(payload);
      }),
    createAvailabilityMutation,
    createRole: () =>
      mutateWhen(workspace.canCreateRole.value, () =>
        createRoleMutation.mutate(rolePayload(workspace.roleForm))
      ),
    createRoleMutation,
    createTeam: () =>
      mutateWhen(workspace.canCreateTeam.value, () =>
        createTeamMutation.mutate(teamPayload(workspace.teamForm))
      ),
    createTeamMutation,
    optionItems,
    refreshAll,
    refreshAssignments,
    refreshAvailability,
    refreshCheckIns,
    refreshSetup,
    saveCheckIn: () =>
      mutateWhen(workspace.canSaveCheckIn.value, () =>
        updateCheckInMutation.mutate(checkInPayload(workspace.checkInForm))
      ),
    successMessage,
    successVisible,
    setupCommandErrorMessage,
    setupErrorMessage,
    setupRefreshErrorMessage,
    t,
    updateAssignmentMutation,
    updateAssignmentStatus,
    updateCheckInMutation,
    updateRoleMutation,
    updateRoleStatus,
    updateTeamMutation,
    updateTeamStatus
  };
}
