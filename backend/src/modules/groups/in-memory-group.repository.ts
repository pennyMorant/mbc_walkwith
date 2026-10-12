import type {
  GroupApplication,
  GroupApplicationListQuery,
  GroupAttendanceListQuery,
  GroupAttendanceRecord,
  GroupMaterialAssignment,
  GroupMaterialAssignmentCreateRequest,
  GroupMaterialAssignmentListQuery,
  GroupMaterialAssignmentUpdateRequest,
  GroupMembership,
  GroupMembershipListQuery,
  GroupMembershipStatus,
  GroupMembershipUpdateRequest,
  MinistryGroup,
  MinistryGroupListQuery,
  MinistryGroupUpdateRequest,
  MinistryGroupUpsertRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  GroupApplicationAttempt,
  GroupApplicationCreateInput,
  GroupApplicationSubmissionDecision,
  GroupApplicationTransitionAttempt,
  GroupApplicationTransitionDecision,
  GroupApplicationTransitionInput,
  GroupAttendanceUpsertInput,
  GroupMembershipTransitionAttempt,
  GroupMembershipTransitionDecision,
  GroupRepository,
  GroupUpdateValidator
} from "./group.repository.js";
import {
  inMemoryGroupMembershipSeed,
  inMemoryGroupSeed,
  type InMemoryGroupMembership
} from "./in_memory_group_seed.js";
import { membershipKey } from "./in_memory_group_keys.js";
import { InMemoryGroupActivityStore } from "./in_memory_group_activity_store.js";
import { InMemoryGroupMembershipStore } from "./in_memory_group_membership_store.js";

export class InMemoryGroupRepository implements GroupRepository {
  private groups = new Map<string, MinistryGroup>(
    inMemoryGroupSeed.map((group) => [group.id, group])
  );
  private applications = new Map<string, GroupApplication>();
  private memberships = new Map<string, InMemoryGroupMembership>(
    inMemoryGroupMembershipSeed.map((membership) => [
      membershipKey(membership.groupId, membership.userId),
      membership
    ])
  );
  private readonly activityStore = new InMemoryGroupActivityStore(
    this.memberships
  );
  private readonly membershipStore = new InMemoryGroupMembershipStore(
    this.groups,
    this.applications,
    this.memberships
  );

  async list(query: MinistryGroupListQuery): Promise<MinistryGroup[]> {
    return this.filteredGroups(query).slice(0, query.limit);
  }

  async listForPublic(query: MinistryGroupListQuery): Promise<MinistryGroup[]> {
    return this.filteredGroups(query)
      .filter((group) => group.visibility === "public")
      .slice(0, query.limit);
  }

  async listForMember(
    query: MinistryGroupListQuery,
    userId: string
  ): Promise<MinistryGroup[]> {
    return this.filteredGroups(query)
      .filter((group) => this.canMemberAccessGroup(group, userId))
      .map((group) => this.withMemberState(group, userId))
      .slice(0, query.limit);
  }

  async listMine(userId: string): Promise<MinistryGroup[]> {
    return [...this.memberships.values()]
      .filter(
        (membership) =>
          membership.userId === userId &&
          activeMembershipStatuses.has(membership.status)
      )
      .map((membership) => this.groups.get(membership.groupId))
      .filter((group): group is MinistryGroup => group !== undefined)
      .map((group) => this.withMemberState(group, userId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string): Promise<MinistryGroup | null> {
    return this.groups.get(id) ?? null;
  }

  async getByIdForPublic(id: string): Promise<MinistryGroup | null> {
    const group = this.groups.get(id);
    return group?.visibility === "public" ? group : null;
  }

  async getByIdForMember(
    id: string,
    userId: string
  ): Promise<MinistryGroup | null> {
    const group = this.groups.get(id);
    if (!group || !this.canMemberAccessGroup(group, userId)) {
      return null;
    }
    return this.withMemberState(group, userId);
  }

  async create(input: MinistryGroupUpsertRequest): Promise<MinistryGroup> {
    const now = new Date().toISOString();
    const group: MinistryGroup = {
      id: randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      meetingTime: input.meetingTime?.trim() ?? "",
      location: input.location?.trim() ?? "",
      leaderName: input.leaderName?.trim() ?? "",
      visibility: input.visibility,
      status: input.status,
      capacity: input.capacity ?? null,
      memberCount: 0,
      myApplicationId: null,
      myApplicationStatus: null,
      myMembershipStatus: null,
      createdAt: now,
      updatedAt: now
    };
    this.groups.set(group.id, group);
    return group;
  }

  async update(
    id: string,
    input: MinistryGroupUpdateRequest,
    validate: GroupUpdateValidator
  ): Promise<MinistryGroup | null> {
    const existing = this.groups.get(id);
    if (!existing) {
      return null;
    }
    validate({
      group: existing,
      activeMemberCount: this.activeMemberCount(id)
    });
    const updated: MinistryGroup = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      description:
        input.description === undefined
          ? existing.description
          : input.description.trim(),
      meetingTime:
        input.meetingTime === undefined
          ? existing.meetingTime
          : input.meetingTime.trim(),
      location:
        input.location === undefined ? existing.location : input.location.trim(),
      leaderName:
        input.leaderName === undefined
          ? existing.leaderName
          : input.leaderName.trim(),
      visibility: input.visibility ?? existing.visibility,
      status: input.status ?? existing.status,
      capacity: input.capacity === undefined ? existing.capacity : input.capacity,
      updatedAt: new Date().toISOString()
    };
    this.groups.set(id, updated);
    return updated;
  }

  async listApplications(
    groupId: string,
    query: GroupApplicationListQuery
  ): Promise<GroupApplication[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.applications.values()]
      .filter((application) => {
        if (application.groupId !== groupId) {
          return false;
        }
        if (query.status && application.status !== query.status) {
          return false;
        }
        if (normalizedQuery) {
          return [
            application.memberDisplayName,
            application.memberEmail,
            application.note
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async getApplicationById(
    groupId: string,
    applicationId: string
  ): Promise<GroupApplication | null> {
    const application = this.applications.get(applicationId);
    return application?.groupId === groupId ? application : null;
  }

  async submitApplication(
    input: GroupApplicationCreateInput,
    decide: GroupApplicationSubmissionDecision
  ): Promise<GroupApplicationAttempt | null> {
    const group = this.groups.get(input.groupId);
    if (!group) {
      return null;
    }
    const existing = [...this.applications.values()]
      .filter(
        (application) =>
          application.groupId === input.groupId &&
          application.userId === input.userId &&
          application.status === "submitted"
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (existing) {
      return { application: existing, created: false };
    }
    decide({
      groupStatus: group.status,
      visibility: group.visibility,
      capacity: group.capacity,
      activeMemberCount: this.activeMemberCount(input.groupId),
      membershipStatus:
        this.memberships.get(membershipKey(input.groupId, input.userId))
          ?.status ?? null
    });
    const now = new Date().toISOString();
    const application: GroupApplication = {
      id: randomUUID(),
      groupId: input.groupId,
      userId: input.userId,
      memberDisplayName: input.memberDisplayName,
      memberEmail: input.memberEmail,
      status: "submitted",
      note: input.note ?? "",
      createdAt: now,
      updatedAt: now
    };
    this.applications.set(application.id, application);
    return { application, created: true };
  }

  async transitionApplication(
    input: GroupApplicationTransitionInput,
    decide: GroupApplicationTransitionDecision
  ): Promise<GroupApplicationTransitionAttempt | null> {
    const group = this.groups.get(input.groupId);
    const application = await this.getApplicationById(
      input.groupId,
      input.applicationId
    );
    if (
      !group ||
      !application ||
      (input.expectedUserId && application.userId !== input.expectedUserId)
    ) {
      return null;
    }
    decide({
      groupStatus: group.status,
      capacity: group.capacity,
      activeMemberCount: this.activeMemberCount(input.groupId),
      currentStatus: application.status,
      nextStatus: input.status
    });
    if (application.status === input.status) {
      return { application, changed: false };
    }
    const updated: GroupApplication = {
      ...application,
      status: input.status,
      updatedAt: new Date().toISOString()
    };
    this.applications.set(input.applicationId, updated);
    if (input.status === "approved") {
      const now = new Date().toISOString();
      const existingMembership = this.memberships.get(
        membershipKey(input.groupId, application.userId)
      );
      const membership: InMemoryGroupMembership = {
        groupId: input.groupId,
        userId: application.userId,
        status: "active",
        createdAt: existingMembership?.createdAt ?? now,
        updatedAt: now
      };
      this.memberships.set(
        membershipKey(input.groupId, application.userId),
        membership
      );
      this.groups.set(input.groupId, {
        ...group,
        memberCount: this.activeMemberCount(input.groupId),
        updatedAt: new Date().toISOString()
      });
    }
    return { application: updated, changed: true };
  }

  async getMembershipStatus(
    groupId: string,
    userId: string
  ): Promise<GroupMembershipStatus | null> {
    return this.memberships.get(membershipKey(groupId, userId))?.status ?? null;
  }

  async countActiveMembers(groupId: string): Promise<number> {
    return this.activeMemberCount(groupId);
  }

  async listMemberships(
    groupId: string,
    query: GroupMembershipListQuery
  ): Promise<GroupMembership[]> {
    return this.membershipStore.list(groupId, query);
  }

  async transitionMembership(
    groupId: string,
    userId: string,
    input: GroupMembershipUpdateRequest,
    decide: GroupMembershipTransitionDecision
  ): Promise<GroupMembershipTransitionAttempt | null> {
    return this.membershipStore.transition(groupId, userId, input, decide);
  }

  private activeMemberCount(groupId: string): number {
    return [...this.memberships.values()].filter(
      (membership) =>
        membership.groupId === groupId &&
        activeMembershipStatuses.has(membership.status)
    ).length;
  }

  async listMaterialAssignments(
    groupId: string,
    query: GroupMaterialAssignmentListQuery
  ): Promise<GroupMaterialAssignment[]> {
    return this.activityStore.listMaterialAssignments(groupId, query);
  }

  async getMaterialAssignment(
    groupId: string,
    assignmentId: string
  ): Promise<GroupMaterialAssignment | null> {
    return this.activityStore.getMaterialAssignment(groupId, assignmentId);
  }

  async createMaterialAssignment(
    groupId: string,
    input: GroupMaterialAssignmentCreateRequest
  ): Promise<GroupMaterialAssignment> {
    return this.activityStore.createMaterialAssignment(groupId, input);
  }

  async updateMaterialAssignment(
    groupId: string,
    assignmentId: string,
    input: GroupMaterialAssignmentUpdateRequest
  ): Promise<GroupMaterialAssignment | null> {
    return this.activityStore.updateMaterialAssignment(
      groupId,
      assignmentId,
      input
    );
  }

  async listAttendanceRecords(
    groupId: string,
    query: GroupAttendanceListQuery
  ): Promise<GroupAttendanceRecord[]> {
    return this.activityStore.listAttendanceRecords(groupId, query);
  }

  async upsertAttendanceRecord(
    groupId: string,
    input: GroupAttendanceUpsertInput
  ): Promise<GroupAttendanceRecord | null> {
    return this.activityStore.upsertAttendanceRecord(groupId, input);
  }

  private filteredGroups(query: MinistryGroupListQuery) {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.groups.values()]
      .filter((group) => {
        if (query.status && group.status !== query.status) {
          return false;
        }
        if (query.visibility && group.visibility !== query.visibility) {
          return false;
        }
        if (normalizedQuery) {
          return [group.name, group.description, group.location, group.leaderName]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private withMemberState(group: MinistryGroup, userId: string): MinistryGroup {
    const membership = this.memberships.get(membershipKey(group.id, userId));
    const application = [...this.applications.values()]
      .filter((item) => item.groupId === group.id && item.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return {
      ...group,
      memberCount: [...this.memberships.values()].filter(
        (item) =>
          item.groupId === group.id &&
          ["active", "leader"].includes(item.status)
      ).length,
      myApplicationId: application?.id ?? null,
      myApplicationStatus: application?.status ?? null,
      myMembershipStatus: membership?.status ?? null
    };
  }

  private canMemberAccessGroup(group: MinistryGroup, userId: string) {
    if (["public", "members"].includes(group.visibility)) {
      return true;
    }
    if (group.visibility !== "group") {
      return false;
    }
    const membership = this.memberships.get(membershipKey(group.id, userId));
    return membership
      ? ["active", "leader"].includes(membership.status)
      : false;
  }
}

const activeMembershipStatuses = new Set<GroupMembershipStatus>([
  "active",
  "leader"
]);
