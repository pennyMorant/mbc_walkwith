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
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  groupApplications,
  groupMemberships,
  ministryGroups
} from "../../shared/db/schema.js";
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
import { PostgresGroupActivityStore } from "./postgres_group_activity_store.js";
import { PostgresGroupApplicationStore } from "./postgres_group_application_store.js";
import { PostgresGroupMembershipStore } from "./postgres_group_membership_store.js";
import { activeGroupMembershipFilter } from "./postgres_group_membership_queries.js";

export class PostgresGroupRepository implements GroupRepository {
  private readonly activityStore: PostgresGroupActivityStore;
  private readonly applicationStore: PostgresGroupApplicationStore;
  private readonly membershipStore: PostgresGroupMembershipStore;

  constructor(private readonly db: AppDb) {
    this.activityStore = new PostgresGroupActivityStore(db);
    this.applicationStore = new PostgresGroupApplicationStore(db);
    this.membershipStore = new PostgresGroupMembershipStore(db);
  }

  async list(query: MinistryGroupListQuery): Promise<MinistryGroup[]> {
    const rows = await this.selectGroups(query);
    return Promise.all(rows.map((row) => this.groupFromRow(row)));
  }

  async listForPublic(query: MinistryGroupListQuery): Promise<MinistryGroup[]> {
    const rows = await this.selectGroups(query, undefined, true);
    return Promise.all(rows.map((row) => this.groupFromRow(row)));
  }

  async listForMember(
    query: MinistryGroupListQuery,
    userId: string
  ): Promise<MinistryGroup[]> {
    const rows = await this.selectGroups(query, userId);
    return Promise.all(
      rows.map(async (row) =>
        this.withMemberState(await this.groupFromRow(row), userId)
      )
    );
  }

  async listMine(userId: string): Promise<MinistryGroup[]> {
    const membershipRows = await this.db
      .select({ groupId: groupMemberships.groupId })
      .from(groupMemberships)
      .where(
        and(
          eq(groupMemberships.userId, userId),
          or(
            eq(groupMemberships.status, "active"),
            eq(groupMemberships.status, "leader")
          )
        )
      )
      .orderBy(desc(groupMemberships.updatedAt));
    const groups = await Promise.all(
      membershipRows.map(async ({ groupId }) => {
        const group = await this.getById(groupId);
        return group ? this.withMemberState(group, userId) : null;
      })
    );
    return groups.filter((group): group is MinistryGroup => group !== null);
  }

  async getById(id: string): Promise<MinistryGroup | null> {
    const [row] = await this.db
      .select()
      .from(ministryGroups)
      .where(eq(ministryGroups.id, id))
      .limit(1);
    return row ? this.groupFromRow(row) : null;
  }

  async getByIdForPublic(id: string): Promise<MinistryGroup | null> {
    const [row] = await this.db
      .select()
      .from(ministryGroups)
      .where(
        and(
          eq(ministryGroups.id, id),
          eq(ministryGroups.visibility, "public")
        )
      )
      .limit(1);
    return row ? this.groupFromRow(row) : null;
  }

  async getByIdForMember(
    id: string,
    userId: string
  ): Promise<MinistryGroup | null> {
    const [row] = await this.db
      .select()
      .from(ministryGroups)
      .where(
        and(
          eq(ministryGroups.id, id),
          or(
            eq(ministryGroups.visibility, "public"),
            eq(ministryGroups.visibility, "members"),
            and(
              eq(ministryGroups.visibility, "group"),
              hasActiveGroupMembership(userId)
            )
          )
        )
      )
      .limit(1);
    return row ? this.withMemberState(await this.groupFromRow(row), userId) : null;
  }

  async create(input: MinistryGroupUpsertRequest): Promise<MinistryGroup> {
    const now = new Date();
    const [row] = await this.db
      .insert(ministryGroups)
      .values({
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        meetingTime: input.meetingTime?.trim() ?? "",
        location: input.location?.trim() ?? "",
        leaderName: input.leaderName?.trim() ?? "",
        visibility: input.visibility,
        status: input.status,
        capacity: input.capacity ?? null,
        updatedAt: now
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create group.");
    }
    return this.groupFromRow(row);
  }

  async update(
    id: string,
    input: MinistryGroupUpdateRequest,
    validate: GroupUpdateValidator
  ): Promise<MinistryGroup | null> {
    const row = await this.db.transaction(async (transaction) => {
      const [existingRow] = await transaction
        .select()
        .from(ministryGroups)
        .where(eq(ministryGroups.id, id))
        .for("update")
        .limit(1);
      if (!existingRow) {
        return null;
      }
      const [countRow] = await transaction
        .select({ total: sql<number>`count(*)` })
        .from(groupMemberships)
        .where(activeGroupMembershipFilter(id));
      const existing = groupFromRowWithCount(
        existingRow,
        Number(countRow?.total ?? 0)
      );
      validate({ group: existing, activeMemberCount: existing.memberCount });
      const [updatedRow] = await transaction
        .update(ministryGroups)
        .set({
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
            input.location === undefined
              ? existing.location
              : input.location.trim(),
          leaderName:
            input.leaderName === undefined
              ? existing.leaderName
              : input.leaderName.trim(),
          visibility: input.visibility ?? existing.visibility,
          status: input.status ?? existing.status,
          capacity:
            input.capacity === undefined ? existing.capacity : input.capacity,
          updatedAt: new Date()
        })
        .where(eq(ministryGroups.id, id))
        .returning();
      return updatedRow ?? null;
    });
    return row ? this.groupFromRow(row) : null;
  }

  async listApplications(
    groupId: string,
    query: GroupApplicationListQuery
  ): Promise<GroupApplication[]> {
    return this.applicationStore.list(groupId, query);
  }

  async getApplicationById(
    groupId: string,
    applicationId: string
  ): Promise<GroupApplication | null> {
    return this.applicationStore.getById(groupId, applicationId);
  }

  async submitApplication(
    input: GroupApplicationCreateInput,
    decide: GroupApplicationSubmissionDecision
  ): Promise<GroupApplicationAttempt | null> {
    return this.applicationStore.submit(input, decide);
  }

  async transitionApplication(
    input: GroupApplicationTransitionInput,
    decide: GroupApplicationTransitionDecision
  ): Promise<GroupApplicationTransitionAttempt | null> {
    return this.applicationStore.transition(input, decide);
  }

  async getMembershipStatus(
    groupId: string,
    userId: string
  ): Promise<GroupMembershipStatus | null> {
    return this.applicationStore.getMembershipStatus(groupId, userId);
  }

  async countActiveMembers(groupId: string): Promise<number> {
    return this.applicationStore.countActiveMembers(groupId);
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

  private async selectGroups(
    query: MinistryGroupListQuery,
    memberVisibleUserId?: string,
    publicOnly = false
  ) {
    const filters = [
      query.status ? eq(ministryGroups.status, query.status) : undefined,
      query.visibility ? eq(ministryGroups.visibility, query.visibility) : undefined,
      publicOnly ? eq(ministryGroups.visibility, "public") : undefined,
      memberVisibleUserId
        ? or(
            eq(ministryGroups.visibility, "public"),
            eq(ministryGroups.visibility, "members"),
            and(
              eq(ministryGroups.visibility, "group"),
              hasActiveGroupMembership(memberVisibleUserId)
            )
          )
        : undefined,
      query.query
        ? or(
            ilike(ministryGroups.name, `%${query.query}%`),
            ilike(ministryGroups.description, `%${query.query}%`),
            ilike(ministryGroups.location, `%${query.query}%`),
            ilike(ministryGroups.leaderName, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    return this.db
      .select()
      .from(ministryGroups)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(ministryGroups.updatedAt))
      .limit(query.limit);
  }

  private async groupFromRow(
    row: typeof ministryGroups.$inferSelect
  ): Promise<MinistryGroup> {
    return groupFromRowWithCount(row, await this.countActiveMembers(row.id));
  }

  private async withMemberState(group: MinistryGroup, userId: string) {
    const [membership] = await this.db
      .select()
      .from(groupMemberships)
      .where(
        and(
          eq(groupMemberships.groupId, group.id),
          eq(groupMemberships.userId, userId)
        )
      )
      .limit(1);
    const [application] = await this.db
      .select()
      .from(groupApplications)
      .where(
        and(
          eq(groupApplications.groupId, group.id),
          eq(groupApplications.userId, userId)
        )
      )
      .orderBy(desc(groupApplications.updatedAt))
      .limit(1);
    return {
      ...group,
      myApplicationId: application?.id ?? null,
      myApplicationStatus: application?.status ?? null,
      myMembershipStatus: membership?.status ?? null
    };
  }
}

function hasActiveGroupMembership(userId: string) {
  return sql`exists (
    select 1
    from group_memberships membership
    where membership.group_id = ${ministryGroups.id}
      and membership.user_id = ${userId}
      and membership.status in ('active', 'leader')
  )`;
}

function groupFromRowWithCount(
  row: typeof ministryGroups.$inferSelect,
  memberCount: number
): MinistryGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    meetingTime: row.meetingTime,
    location: row.location,
    leaderName: row.leaderName,
    visibility: row.visibility,
    status: row.status,
    capacity: row.capacity,
    memberCount,
    myApplicationId: null,
    myApplicationStatus: null,
    myMembershipStatus: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}
