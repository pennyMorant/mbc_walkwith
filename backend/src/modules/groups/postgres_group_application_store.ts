import type {
  GroupApplication,
  GroupApplicationListQuery,
  GroupMembershipStatus
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
  GroupApplicationTransitionInput
} from "./group.repository.js";
import { applicationFromRow } from "./postgres_group_mappers.js";
import {
  activeGroupMembershipFilter,
  groupMembershipFilter
} from "./postgres_group_membership_queries.js";

export class PostgresGroupApplicationStore {
  constructor(private readonly db: AppDb) {}

  async list(
    groupId: string,
    query: GroupApplicationListQuery
  ): Promise<GroupApplication[]> {
    const filters = [
      eq(groupApplications.groupId, groupId),
      query.status ? eq(groupApplications.status, query.status) : undefined,
      query.query
        ? or(
            ilike(groupApplications.memberDisplayName, `%${query.query}%`),
            ilike(groupApplications.memberEmail, `%${query.query}%`),
            ilike(groupApplications.note, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(groupApplications)
      .where(and(...filters))
      .orderBy(desc(groupApplications.updatedAt))
      .limit(query.limit);
    return rows.map(applicationFromRow);
  }

  async getById(
    groupId: string,
    applicationId: string
  ): Promise<GroupApplication | null> {
    const [row] = await this.db
      .select()
      .from(groupApplications)
      .where(
        and(
          eq(groupApplications.groupId, groupId),
          eq(groupApplications.id, applicationId)
        )
      )
      .limit(1);
    return row ? applicationFromRow(row) : null;
  }

  async submit(
    input: GroupApplicationCreateInput,
    decide: GroupApplicationSubmissionDecision
  ): Promise<GroupApplicationAttempt | null> {
    return this.db.transaction(async (transaction) => {
      const [group] = await transaction
        .select({
          status: ministryGroups.status,
          visibility: ministryGroups.visibility,
          capacity: ministryGroups.capacity
        })
        .from(ministryGroups)
        .where(eq(ministryGroups.id, input.groupId))
        .for("update")
        .limit(1);
      if (!group) {
        return null;
      }
      const [existing] = await transaction
        .select()
        .from(groupApplications)
        .where(
          and(
            eq(groupApplications.groupId, input.groupId),
            eq(groupApplications.userId, input.userId),
            eq(groupApplications.status, "submitted")
          )
        )
        .orderBy(desc(groupApplications.updatedAt))
        .limit(1);
      if (existing) {
        return { application: applicationFromRow(existing), created: false };
      }
      const [membership] = await transaction
        .select({ status: groupMemberships.status })
        .from(groupMemberships)
        .where(groupMembershipFilter(input.groupId, input.userId))
        .limit(1);
      const activeMemberCount = await countActiveMembers(
        transaction,
        input.groupId
      );
      decide({
        groupStatus: group.status,
        visibility: group.visibility,
        capacity: group.capacity,
        activeMemberCount,
        membershipStatus: membership?.status ?? null
      });
      const [row] = await transaction
        .insert(groupApplications)
        .values({
          groupId: input.groupId,
          userId: input.userId,
          memberDisplayName: input.memberDisplayName,
          memberEmail: input.memberEmail,
          status: "submitted",
          note: input.note?.trim() ?? "",
          updatedAt: new Date()
        })
        .returning();
      if (!row) {
        throw new Error("Failed to create group application.");
      }
      return { application: applicationFromRow(row), created: true };
    });
  }

  async transition(
    input: GroupApplicationTransitionInput,
    decide: GroupApplicationTransitionDecision
  ): Promise<GroupApplicationTransitionAttempt | null> {
    return this.db.transaction(async (transaction) => {
      const [group] = await transaction
        .select({ status: ministryGroups.status, capacity: ministryGroups.capacity })
        .from(ministryGroups)
        .where(eq(ministryGroups.id, input.groupId))
        .for("update")
        .limit(1);
      if (!group) {
        return null;
      }
      const [application] = await transaction
        .select()
        .from(groupApplications)
        .where(
          and(
            eq(groupApplications.groupId, input.groupId),
            eq(groupApplications.id, input.applicationId),
            input.expectedUserId
              ? eq(groupApplications.userId, input.expectedUserId)
              : undefined
          )
        )
        .for("update")
        .limit(1);
      if (!application) {
        return null;
      }
      decide({
        groupStatus: group.status,
        capacity: group.capacity,
        activeMemberCount: await countActiveMembers(transaction, input.groupId),
        currentStatus: application.status,
        nextStatus: input.status
      });
      if (application.status === input.status) {
        return { application: applicationFromRow(application), changed: false };
      }
      const [row] = await transaction
        .update(groupApplications)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(groupApplications.id, input.applicationId))
        .returning();
      if (!row) {
        return null;
      }
      if (input.status === "approved") {
        await transaction
          .insert(groupMemberships)
          .values({
            groupId: input.groupId,
            userId: application.userId,
            status: "active",
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [groupMemberships.groupId, groupMemberships.userId],
            set: { status: "active", updatedAt: new Date() }
          });
      }
      return { application: applicationFromRow(row), changed: true };
    });
  }

  async getMembershipStatus(
    groupId: string,
    userId: string
  ): Promise<GroupMembershipStatus | null> {
    const [row] = await this.db
      .select({ status: groupMemberships.status })
      .from(groupMemberships)
      .where(groupMembershipFilter(groupId, userId))
      .limit(1);
    return row?.status ?? null;
  }

  async countActiveMembers(groupId: string): Promise<number> {
    return countActiveMembers(this.db, groupId);
  }
}

type QueryDb = Pick<AppDb, "select">;

async function countActiveMembers(db: QueryDb, groupId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(groupMemberships)
    .where(activeGroupMembershipFilter(groupId));
  return Number(row?.total ?? 0);
}
