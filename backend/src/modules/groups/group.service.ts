import type {
  GroupApplicationListQuery,
  GroupApplicationRequest,
  GroupApplicationReviewRequest,
  GroupApplicationWithdrawalRequest,
  GroupAttendanceListQuery,
  GroupAttendanceUpsertRequest,
  GroupMaterialAssignmentCreateRequest,
  GroupMaterialAssignmentListQuery,
  GroupMaterialAssignmentUpdateRequest,
  GroupMaterialType,
  GroupMembershipListQuery,
  GroupMembershipUpdateRequest,
  MinistryGroupListQuery,
  MinistryGroupUpdateRequest,
  MinistryGroupUpsertRequest,
  MinistryGroupStatus
} from "@mbc/api-contracts";

import type { MemberRepository } from "../members/member.repository.js";
import {
  groupApplicationDuplicate,
  groupApplicationNotFound,
  groupApplicationTransitionInvalid,
  groupAttendanceInvalid,
  groupCapacityBelowMemberCount,
  groupCapacityFull,
  groupMemberProjectionNotFound,
  groupMembershipNotFound,
  groupMaterialAssignmentNotFound,
  groupMaterialReferenceNotFound,
  groupNotFound,
  groupNotOpen,
  groupStatusTransitionInvalid
} from "./group-errors.js";
import type { GroupRepository } from "./group.repository.js";
import type { GroupMaterialDirectory } from "./group_material_directory.js";

export class GroupService {
  constructor(
    private readonly repository: GroupRepository,
    private readonly memberRepository: MemberRepository,
    private readonly materialDirectory: GroupMaterialDirectory
  ) {}

  list(query: MinistryGroupListQuery) {
    return this.repository.list(query);
  }

  listVisible(query: MinistryGroupListQuery, userId: string | null) {
    const visibleQuery = { ...query, status: "active" as const };
    return userId
      ? this.repository.listForMember(visibleQuery, userId)
      : this.repository.listForPublic(visibleQuery);
  }

  listMine(userId: string) {
    return this.repository.listMine(userId);
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  async getVisibleById(id: string, userId: string | null) {
    const group = userId
      ? await this.repository.getByIdForMember(id, userId)
      : await this.repository.getByIdForPublic(id);
    if (!group || group.status !== "active") {
      throw groupNotFound(id);
    }
    return group;
  }

  create(input: MinistryGroupUpsertRequest) {
    return this.repository.create(input);
  }

  async update(id: string, input: MinistryGroupUpdateRequest) {
    const group = await this.repository.update(id, input, (context) => {
      const nextStatus = input.status ?? context.group.status;
      if (
        !transitionAllowed(
          groupStatusTransitions,
          context.group.status,
          nextStatus
        )
      ) {
        throw groupStatusTransitionInvalid(id, context.group.status, nextStatus);
      }
      if (
        input.capacity !== undefined &&
        input.capacity !== null &&
        input.capacity < context.activeMemberCount
      ) {
        throw groupCapacityBelowMemberCount(
          id,
          input.capacity,
          context.activeMemberCount
        );
      }
    });
    if (!group) {
      throw groupNotFound(id);
    }
    return group;
  }

  async listApplications(
    groupId: string,
    query: GroupApplicationListQuery
  ) {
    await this.requireGroup(groupId);
    return this.repository.listApplications(groupId, query);
  }

  async applyToGroup(
    groupId: string,
    user: { id: string; displayName: string; email: string },
    input: GroupApplicationRequest
  ) {
    const attempt = await this.repository.submitApplication(
      {
        groupId,
        userId: user.id,
        memberDisplayName: user.displayName,
        memberEmail: user.email,
        note: input.note?.trim() ?? ""
      },
      (context) => {
        if (
          context.groupStatus !== "active" ||
          !applicationVisibilities.has(context.visibility)
        ) {
          throw groupNotOpen(groupId);
        }
        if (
          context.membershipStatus === "active" ||
          context.membershipStatus === "leader"
        ) {
          throw groupApplicationDuplicate(groupId);
        }
        if (
          context.capacity !== null &&
          context.activeMemberCount >= context.capacity
        ) {
          throw groupCapacityFull(groupId, context.capacity);
        }
      }
    );
    if (!attempt) {
      throw groupNotFound(groupId);
    }
    return attempt;
  }

  async reviewApplication(
    groupId: string,
    applicationId: string,
    input: GroupApplicationReviewRequest
  ) {
    const attempt = await this.transitionApplication({
      groupId,
      applicationId,
      status: input.status
    });
    if (attempt.application.status === "approved") {
      await this.syncMemberGroupProjection(
        groupId,
        attempt.application.userId,
        "active"
      );
    }
    return attempt;
  }

  async withdrawApplication(
    groupId: string,
    applicationId: string,
    userId: string,
    input: GroupApplicationWithdrawalRequest
  ) {
    return this.transitionApplication({
      groupId,
      applicationId,
      status: input.status,
      expectedUserId: userId
    });
  }

  private async transitionApplication(input: {
    groupId: string;
    applicationId: string;
    status: "approved" | "declined" | "withdrawn";
    expectedUserId?: string;
  }) {
    const attempt = await this.repository.transitionApplication(
      input,
      (context) => {
        if (context.currentStatus === context.nextStatus) {
          return;
        }
        if (context.currentStatus !== "submitted") {
          throw groupApplicationTransitionInvalid(
            input.groupId,
            input.applicationId,
            context.currentStatus,
            context.nextStatus
          );
        }
        if (context.nextStatus === "approved") {
          if (context.groupStatus !== "active") {
            throw groupNotOpen(input.groupId);
          }
          if (
            context.capacity !== null &&
            context.activeMemberCount >= context.capacity
          ) {
            throw groupCapacityFull(input.groupId, context.capacity);
          }
        }
      }
    );
    if (!attempt) {
      throw groupApplicationNotFound(input.groupId, input.applicationId);
    }
    return attempt;
  }

  async listMaterialAssignments(
    groupId: string,
    query: GroupMaterialAssignmentListQuery
  ) {
    await this.requireGroup(groupId);
    return this.repository.listMaterialAssignments(groupId, query);
  }

  async listMemberships(groupId: string, query: GroupMembershipListQuery) {
    await this.requireGroup(groupId);
    return this.repository.listMemberships(groupId, query);
  }

  async updateMembership(
    groupId: string,
    userId: string,
    input: GroupMembershipUpdateRequest
  ) {
    await this.requireGroup(groupId);
    const attempt = await this.repository.transitionMembership(
      groupId,
      userId,
      input,
      (context) => {
        const wasActive = activeMembershipStatuses.has(context.currentStatus);
        const willBeActive = activeMembershipStatuses.has(context.nextStatus);
        if (!wasActive && willBeActive) {
          if (context.groupStatus !== "active") {
            throw groupNotOpen(groupId);
          }
          if (
            context.capacity !== null &&
            context.activeMemberCount >= context.capacity
          ) {
            throw groupCapacityFull(groupId, context.capacity);
          }
        }
      }
    );
    if (!attempt) {
      throw groupMembershipNotFound(groupId, userId);
    }
    await this.syncMemberGroupProjection(
      groupId,
      userId,
      attempt.membership.status
    );
    return attempt;
  }

  async createMaterialAssignment(
    groupId: string,
    input: GroupMaterialAssignmentCreateRequest
  ) {
    await this.requireGroup(groupId);
    await this.requireMaterialReference(input.materialType, input.materialId);
    return this.repository.createMaterialAssignment(groupId, input);
  }

  async updateMaterialAssignment(
    groupId: string,
    assignmentId: string,
    input: GroupMaterialAssignmentUpdateRequest
  ) {
    await this.requireGroup(groupId);
    const existing = await this.repository.getMaterialAssignment(
      groupId,
      assignmentId
    );
    if (!existing) {
      throw groupMaterialAssignmentNotFound(groupId, assignmentId);
    }
    if (input.materialType !== undefined || input.materialId !== undefined) {
      await this.requireMaterialReference(
        input.materialType ?? existing.materialType,
        input.materialId ?? existing.materialId
      );
    }
    const assignment = await this.repository.updateMaterialAssignment(
      groupId,
      assignmentId,
      input
    );
    if (!assignment) {
      throw groupMaterialAssignmentNotFound(groupId, assignmentId);
    }
    return assignment;
  }

  async listAttendanceRecords(
    groupId: string,
    query: GroupAttendanceListQuery
  ) {
    await this.requireGroup(groupId);
    return this.repository.listAttendanceRecords(groupId, query);
  }

  async upsertAttendanceRecord(
    groupId: string,
    input: GroupAttendanceUpsertRequest
  ) {
    await this.requireGroup(groupId);
    const [membershipStatus, member] = await Promise.all([
      this.repository.getMembershipStatus(groupId, input.memberUserId),
      this.memberRepository.getById(input.memberUserId)
    ]);
    if (!membershipStatus || !activeMembershipStatuses.has(membershipStatus)) {
      throw groupAttendanceInvalid(groupId, input.memberUserId);
    }
    if (!member) {
      throw groupMemberProjectionNotFound(groupId, input.memberUserId);
    }
    const record = await this.repository.upsertAttendanceRecord(groupId, {
      ...input,
      memberDisplayName: member.displayName
    });
    if (!record) {
      throw groupAttendanceInvalid(groupId, input.memberUserId);
    }
    return record;
  }

  private async requireGroup(groupId: string) {
    const group = await this.repository.getById(groupId);
    if (!group) {
      throw groupNotFound(groupId);
    }
    return group;
  }

  private async requireMaterialReference(
    materialType: GroupMaterialType,
    materialId: string
  ) {
    if (!(await this.materialDirectory.exists(materialType, materialId))) {
      throw groupMaterialReferenceNotFound(materialType, materialId);
    }
  }

  private async syncMemberGroupProjection(
    groupId: string,
    userId: string,
    status: "active" | "inactive" | "leader"
  ) {
    const member = await this.memberRepository.getById(userId);
    if (!member) {
      throw groupMemberProjectionNotFound(groupId, userId);
    }
    const fellowshipGroupId =
      status === "inactive"
        ? member.fellowshipGroupId === groupId
          ? null
          : member.fellowshipGroupId
        : groupId;
    if (fellowshipGroupId === member.fellowshipGroupId) {
      return;
    }
    const updated = await this.memberRepository.update(userId, {
      fellowshipGroupId
    });
    if (!updated) {
      throw groupMemberProjectionNotFound(groupId, userId);
    }
  }
}

const applicationVisibilities = new Set(["public", "members"]);
const activeMembershipStatuses = new Set(["active", "leader"]);

const groupStatusTransitions: ReadonlyMap<
  MinistryGroupStatus,
  ReadonlySet<MinistryGroupStatus>
> = new Map([
  ["draft", new Set(["active", "archived"])],
  ["active", new Set(["paused", "archived"])],
  ["paused", new Set(["active", "archived"])],
  ["archived", new Set()]
]);

function transitionAllowed<T extends string>(
  transitions: ReadonlyMap<T, ReadonlySet<T>>,
  from: T,
  to: T
) {
  return from === to || transitions.get(from)?.has(to) === true;
}
