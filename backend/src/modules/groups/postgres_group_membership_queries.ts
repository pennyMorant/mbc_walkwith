import { and, eq, or } from "drizzle-orm";

import { groupMemberships } from "../../shared/db/schema.js";

export function activeGroupMembershipFilter(groupId: string) {
  return and(
    eq(groupMemberships.groupId, groupId),
    or(
      eq(groupMemberships.status, "active"),
      eq(groupMemberships.status, "leader")
    )
  );
}

export function groupMembershipFilter(groupId: string, userId: string) {
  return and(
    eq(groupMemberships.groupId, groupId),
    eq(groupMemberships.userId, userId)
  );
}
