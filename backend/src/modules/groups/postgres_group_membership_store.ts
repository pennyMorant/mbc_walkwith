import type {
  GroupMembership,
  GroupMembershipListQuery,
  GroupMembershipUpdateRequest
} from "@mbc/api-contracts";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  groupMemberships,
  ministryGroups,
  users
} from "../../shared/db/schema.js";
import type {
  GroupMembershipTransitionAttempt,
  GroupMembershipTransitionDecision
} from "./group.repository.js";
import { activeGroupMembershipFilter } from "./postgres_group_membership_queries.js";

export class PostgresGroupMembershipStore {
  constructor(private readonly db: AppDb) {}

  async list(
    groupId: string,
    query: GroupMembershipListQuery
  ): Promise<GroupMembership[]> {
    const filters = [
      eq(groupMemberships.groupId, groupId),
      query.status ? eq(groupMemberships.status, query.status) : undefined,
      query.query
        ? or(
            ilike(groupMemberships.userId, `%${query.query}%`),
            ilike(users.displayName, `%${query.query}%`),
            ilike(users.email, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select({ membership: groupMemberships, user: users })
      .from(groupMemberships)
      .leftJoin(users, membershipUserJoin())
      .where(and(...filters))
      .orderBy(desc(groupMemberships.updatedAt))
      .limit(query.limit);
    return rows.map(({ membership, user }) => projection(membership, user));
  }

  async transition(
    groupId: string,
    userId: string,
    input: GroupMembershipUpdateRequest,
    decide: GroupMembershipTransitionDecision
  ): Promise<GroupMembershipTransitionAttempt | null> {
    const result = await this.db.transaction(async (transaction) => {
      const [group] = await transaction
        .select({ status: ministryGroups.status, capacity: ministryGroups.capacity })
        .from(ministryGroups)
        .where(eq(ministryGroups.id, groupId))
        .for("update")
        .limit(1);
      if (!group) {
        return null;
      }
      const [membership] = await transaction
        .select()
        .from(groupMemberships)
        .where(
          and(
            eq(groupMemberships.groupId, groupId),
            eq(groupMemberships.userId, userId)
          )
        )
        .for("update")
        .limit(1);
      if (!membership) {
        return null;
      }
      const [countRow] = await transaction
        .select({ total: sql<number>`count(*)` })
        .from(groupMemberships)
        .where(activeGroupMembershipFilter(groupId));
      decide({
        groupStatus: group.status,
        capacity: group.capacity,
        activeMemberCount: Number(countRow?.total ?? 0),
        currentStatus: membership.status,
        nextStatus: input.status
      });
      if (membership.status === input.status) {
        return {
          row: membership,
          previousStatus: membership.status,
          changed: false
        };
      }
      const [updated] = await transaction
        .update(groupMemberships)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(groupMemberships.groupId, groupId),
            eq(groupMemberships.userId, userId)
          )
        )
        .returning();
      return updated
        ? {
            row: updated,
            previousStatus: membership.status,
            changed: true
          }
        : null;
    });
    if (!result) {
      return null;
    }
    const [user] = await this.db
      .select()
      .from(users)
      .where(sql`${users.id}::text = ${result.row.userId}`)
      .limit(1);
    return {
      membership: projection(result.row, user ?? null),
      previousStatus: result.previousStatus,
      changed: result.changed
    };
  }
}

function membershipUserJoin() {
  return sql`${users.id}::text = ${groupMemberships.userId}`;
}

function projection(
  membership: typeof groupMemberships.$inferSelect,
  user: typeof users.$inferSelect | null
): GroupMembership {
  return {
    groupId: membership.groupId,
    userId: membership.userId,
    memberDisplayName: user?.displayName ?? membership.userId,
    memberEmail: user?.email ?? null,
    status: membership.status,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString()
  };
}
