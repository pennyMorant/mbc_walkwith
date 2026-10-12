import type {
  ServingAssignment,
  ServingAssignmentListQuery,
  ServingAssignmentUpdateRequest,
  ServingAssignmentUpsertRequest,
  ServingAvailabilityListQuery,
  ServingAvailabilityRecord,
  ServingAvailabilityUpsertRequest,
  ServingCheckInListQuery,
  ServingCheckInRecord,
  ServingCheckInUpsertRequest,
  ServingListQuery,
  ServingRole,
  ServingRoleUpdateRequest,
  ServingRoleUpsertRequest,
  ServingTeam,
  ServingTeamUpdateRequest,
  ServingTeamUpsertRequest
} from "@mbc/api-contracts";

export interface ServingRepository {
  listTeams(query: ServingListQuery): Promise<ServingTeam[]>;
  getTeamById(teamId: string): Promise<ServingTeam | null>;
  createTeam(input: ServingTeamUpsertRequest): Promise<ServingTeam>;
  updateTeam(
    teamId: string,
    input: ServingTeamUpdateRequest
  ): Promise<ServingTeam | null>;
  listRoles(
    query: ServingListQuery & { teamId?: string | undefined }
  ): Promise<ServingRole[]>;
  getRoleById(roleId: string): Promise<ServingRole | null>;
  createRole(input: ServingRoleUpsertRequest): Promise<ServingRole>;
  updateRole(
    roleId: string,
    input: ServingRoleUpdateRequest,
    decide: ServingRoleWriteDecision
  ): Promise<ServingRole | null>;
  listAssignments(
    query: ServingAssignmentListQuery
  ): Promise<ServingAssignment[]>;
  listAssignmentsForUser(userId: string): Promise<ServingAssignment[]>;
  getAssignmentById(assignmentId: string): Promise<ServingAssignment | null>;
  createAssignment(
    input: ServingAssignmentUpsertRequest,
    decide: ServingAssignmentWriteDecision
  ): Promise<ServingAssignment>;
  updateAssignment(
    assignmentId: string,
    input: ServingAssignmentUpdateRequest,
    decide: ServingAssignmentWriteDecision
  ): Promise<ServingAssignment | null>;
  listAvailability(
    query: ServingAvailabilityListQuery
  ): Promise<ServingAvailabilityRecord[]>;
  createAvailability(
    userId: string,
    input: ServingAvailabilityUpsertRequest,
    decide: ServingAvailabilityWriteDecision
  ): Promise<ServingAvailabilityRecord>;
  listCheckIns(query: ServingCheckInListQuery): Promise<ServingCheckInRecord[]>;
  upsertCheckIn(
    assignmentId: string,
    input: ServingCheckInUpsertRequest,
    decide: ServingCheckInWriteDecision
  ): Promise<ServingCheckInRecord | null>;
}

export type ServingAssignmentScheduleState = Pick<
  ServingAssignment,
  "id" | "userId" | "startsAt" | "endsAt" | "status"
>;

export type ServingRoleWriteContext = {
  roleId: string;
  currentTeamId: string;
  nextTeamId: string;
  nextTeamExists: boolean;
  assignmentIds: string[];
};

export type ServingRoleWriteDecision = (
  context: ServingRoleWriteContext
) => void;

export type ServingAssignmentWriteContext = {
  current: ServingAssignmentScheduleState | null;
  next: ServingAssignmentScheduleState;
  nextTeamId: string;
  nextRoleId: string;
  nextRoleTeamId: string | null;
  conflictingAssignmentIds: string[];
};

export type ServingAssignmentWriteDecision = (
  context: ServingAssignmentWriteContext
) => void;

export type ServingAvailabilityWriteContext = {
  userId: string;
  startsAt: string;
  endsAt: string;
  conflictingRecordIds: string[];
};

export type ServingAvailabilityWriteDecision = (
  context: ServingAvailabilityWriteContext
) => void;

export type ServingCheckInWriteContext = {
  assignment: ServingAssignmentScheduleState;
  current: ServingCheckInRecord | null;
  nextStatus: ServingCheckInRecord["status"];
};

export type ServingCheckInWriteDecision = (
  context: ServingCheckInWriteContext
) => void;
