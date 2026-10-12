import type {
  MemberListQuery,
  ServingAssignmentActionRequest,
  ServingAdminAssignmentCreateRequest,
  ServingAdminAssignmentUpdateRequest,
  ServingAssignmentListQuery,
  ServingAssignmentUpdateRequest,
  ServingAssignmentUpsertRequest,
  ServingAvailabilityListQuery,
  ServingAvailabilityUpsertRequest,
  ServingCheckInListQuery,
  ServingCheckInUpsertRequest,
  ServingListQuery,
  ServingRoleUpdateRequest,
  ServingRoleUpsertRequest,
  ServingTeamUpdateRequest,
  ServingTeamUpsertRequest
} from "@mbc/api-contracts";

import type { MemberRepository } from "../members/member.repository.js";
import {
  servingAssignmentConflict,
  servingAssignmentNotFound,
  servingAvailabilityConflict,
  servingCheckInInvalid,
  servingCheckInReasonRequired,
  servingMemberNotFound,
  servingPermissionDenied,
  servingRoleInUse,
  servingRoleNotFound,
  servingTeamNotFound,
  servingTimeRangeInvalid
} from "./serving-errors.js";
import type {
  ServingAssignmentWriteContext,
  ServingAvailabilityWriteContext,
  ServingCheckInWriteContext,
  ServingRepository,
  ServingRoleWriteContext
} from "./serving.repository.js";

export class ServingService {
  constructor(
    private readonly repository: ServingRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async listMembers(query: MemberListQuery) {
    const members = await this.memberRepository.list(query);
    return members.map(({ id, displayName, email, status }) => ({
      id,
      displayName,
      email,
      status
    }));
  }

  listTeams(query: ServingListQuery) {
    return this.repository.listTeams(query);
  }

  createTeam(input: ServingTeamUpsertRequest) {
    return this.repository.createTeam(input);
  }

  async updateTeam(teamId: string, input: ServingTeamUpdateRequest) {
    const team = await this.repository.updateTeam(teamId, input);
    if (!team) {
      throw servingTeamNotFound(teamId);
    }
    return team;
  }

  listRoles(query: ServingListQuery & { teamId?: string | undefined }) {
    return this.repository.listRoles(query);
  }

  async createRole(input: ServingRoleUpsertRequest) {
    await this.requireTeam(input.teamId);
    return this.repository.createRole(input);
  }

  async updateRole(roleId: string, input: ServingRoleUpdateRequest) {
    if (input.teamId) {
      await this.requireTeam(input.teamId);
    }
    const role = await this.repository.updateRole(
      roleId,
      input,
      assertRoleWriteAllowed
    );
    if (!role) {
      throw servingRoleNotFound(roleId);
    }
    return role;
  }

  listAssignments(query: ServingAssignmentListQuery) {
    return this.repository.listAssignments(query);
  }

  listAssignmentsForUser(userId: string) {
    return this.repository.listAssignmentsForUser(userId);
  }

  async createAssignment(input: ServingAdminAssignmentCreateRequest) {
    await this.requireTeam(input.teamId);
    const role = await this.repository.getRoleById(input.roleId);
    if (!role || role.teamId !== input.teamId) {
      throw servingRoleNotFound(input.roleId);
    }
    const member = await this.requireMember(input.userId);
    const repositoryInput: ServingAssignmentUpsertRequest = {
      ...input,
      memberDisplayName: member.displayName,
      memberEmail: member.email
    };
    return this.repository.createAssignment(
      repositoryInput,
      assertAssignmentWriteAllowed
    );
  }

  async updateAssignment(
    assignmentId: string,
    input: ServingAdminAssignmentUpdateRequest
  ) {
    const existing = await this.requireAssignment(assignmentId);
    const targetTeamId = input.teamId ?? existing.teamId;
    const targetRoleId = input.roleId ?? existing.roleId;
    if (input.teamId) {
      await this.requireTeam(input.teamId);
    }
    if (input.teamId || input.roleId) {
      const role = await this.repository.getRoleById(targetRoleId);
      if (!role || role.teamId !== targetTeamId) {
        throw servingRoleNotFound(targetRoleId);
      }
    }
    const repositoryInput: ServingAssignmentUpdateRequest = { ...input };
    if (input.userId) {
      const member = await this.requireMember(input.userId);
      repositoryInput.memberDisplayName = member.displayName;
      repositoryInput.memberEmail = member.email;
    }
    const assignment = await this.repository.updateAssignment(
      assignmentId,
      repositoryInput,
      assertAssignmentWriteAllowed
    );
    if (!assignment) {
      throw servingAssignmentNotFound(assignmentId);
    }
    return assignment;
  }

  async confirmAssignment(
    assignmentId: string,
    userId: string,
    input: ServingAssignmentActionRequest
  ) {
    const updated = await this.repository.updateAssignment(
      assignmentId,
      {
        status: "confirmed",
        responseNote: input.note?.trim() ?? ""
      },
      (context) => {
        assertMemberAssignmentWriteAllowed(context, userId);
        assertAssignmentWriteAllowed(context);
      }
    );
    if (!updated) {
      throw servingAssignmentNotFound(assignmentId);
    }
    return updated;
  }

  async requestLeave(
    assignmentId: string,
    userId: string,
    input: ServingAssignmentActionRequest
  ) {
    const updated = await this.repository.updateAssignment(
      assignmentId,
      {
        status: "declined",
        responseNote: input.note?.trim() ?? ""
      },
      (context) => {
        assertMemberAssignmentWriteAllowed(context, userId);
        assertAssignmentWriteAllowed(context);
      }
    );
    if (!updated) {
      throw servingAssignmentNotFound(assignmentId);
    }
    return updated;
  }

  listAvailability(query: ServingAvailabilityListQuery) {
    return this.repository.listAvailability(query);
  }

  createAvailability(userId: string, input: ServingAvailabilityUpsertRequest) {
    return this.repository.createAvailability(
      userId,
      input,
      assertAvailabilityWriteAllowed
    );
  }

  listAvailabilityForUser(userId: string) {
    return this.repository.listAvailability({ userId, limit: 100 });
  }

  listCheckIns(query: ServingCheckInListQuery) {
    return this.repository.listCheckIns(query);
  }

  listCheckInsForUser(userId: string) {
    return this.repository.listCheckIns({ userId, limit: 100 });
  }

  async checkInAssignment(
    assignmentId: string,
    userId: string,
    input: ServingCheckInUpsertRequest
  ) {
    if (input.status !== "checked_in" || input.checkedInAt !== undefined) {
      throw servingCheckInInvalid(assignmentId);
    }
    const checkIn = await this.repository.upsertCheckIn(
      assignmentId,
      { ...input, status: "checked_in", checkedInAt: undefined },
      (context) => {
        if (context.assignment.userId !== userId) {
          throw servingPermissionDenied(assignmentId);
        }
        assertAssignmentCanCheckIn(context);
        if (context.current?.status === "missed") {
          throw servingCheckInInvalid(assignmentId);
        }
      }
    );
    if (!checkIn) {
      throw servingAssignmentNotFound(assignmentId);
    }
    return checkIn;
  }

  async adminCheckInAssignment(
    assignmentId: string,
    input: ServingCheckInUpsertRequest
  ) {
    const checkIn = await this.repository.upsertCheckIn(
      assignmentId,
      input,
      (context) => {
        assertAssignmentCanCheckIn(context);
        assertCheckInCorrectionHasReason(context, input);
      }
    );
    if (!checkIn) {
      throw servingAssignmentNotFound(assignmentId);
    }
    return checkIn;
  }

  private async requireTeam(teamId: string) {
    const team = await this.repository.getTeamById(teamId);
    if (!team) {
      throw servingTeamNotFound(teamId);
    }
    return team;
  }

  private async requireAssignment(assignmentId: string) {
    const assignment = await this.repository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw servingAssignmentNotFound(assignmentId);
    }
    return assignment;
  }

  private async requireMember(userId: string) {
    const member = await this.memberRepository.getById(userId);
    if (!member) {
      throw servingMemberNotFound(userId);
    }
    return member;
  }
}

function assertAssignmentWriteAllowed(context: ServingAssignmentWriteContext) {
  if (context.nextRoleTeamId !== context.nextTeamId) {
    throw servingRoleNotFound(context.nextRoleId);
  }
  assertValidTimeRange(
    context.next.startsAt,
    context.next.endsAt,
    "assignment"
  );
  if (context.conflictingAssignmentIds.length > 0) {
    throw servingAssignmentConflict(
      context.next.id,
      context.conflictingAssignmentIds
    );
  }
}

function assertRoleWriteAllowed(context: ServingRoleWriteContext) {
  if (!context.nextTeamExists) {
    throw servingTeamNotFound(context.nextTeamId);
  }
  if (
    context.nextTeamId !== context.currentTeamId &&
    context.assignmentIds.length > 0
  ) {
    throw servingRoleInUse(context.roleId, context.assignmentIds);
  }
}

function assertMemberAssignmentWriteAllowed(
  context: ServingAssignmentWriteContext,
  userId: string
) {
  if (!context.current || context.current.userId !== userId) {
    throw servingPermissionDenied(context.next.id);
  }
  if (
    context.current.status === "cancelled" ||
    context.current.status === "covered"
  ) {
    throw servingAssignmentConflict(context.next.id);
  }
}

function assertAvailabilityWriteAllowed(
  context: ServingAvailabilityWriteContext
) {
  assertValidTimeRange(context.startsAt, context.endsAt, "availability");
  if (context.conflictingRecordIds.length > 0) {
    throw servingAvailabilityConflict(context.conflictingRecordIds);
  }
}

function assertValidTimeRange(
  startsAt: string,
  endsAt: string | null,
  resourceType: "assignment" | "availability"
) {
  if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw servingTimeRangeInvalid(resourceType);
  }
}

function assertAssignmentCanCheckIn(context: ServingCheckInWriteContext) {
  if (!["scheduled", "confirmed"].includes(context.assignment.status)) {
    throw servingCheckInInvalid(context.assignment.id);
  }
}

function assertCheckInCorrectionHasReason(
  context: ServingCheckInWriteContext,
  input: ServingCheckInUpsertRequest
) {
  const correctsExistingState =
    context.current !== null &&
    (context.current.status !== input.status ||
      input.checkedInAt !== undefined);
  if (correctsExistingState && input.note.trim().length === 0) {
    throw servingCheckInReasonRequired(context.assignment.id);
  }
}
