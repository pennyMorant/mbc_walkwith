import type {
  GroupApplication,
  GroupMembership,
  GroupMembershipListQuery,
  GroupMembershipUpdateRequest,
  MinistryGroup
} from "@mbc/api-contracts";

import type {
  GroupMembershipTransitionAttempt,
  GroupMembershipTransitionDecision
} from "./group.repository.js";
import type { InMemoryGroupMembership } from "./in_memory_group_seed.js";
import { membershipKey } from "./in_memory_group_keys.js";

export class InMemoryGroupMembershipStore {
  constructor(
    private readonly groups: Map<string, MinistryGroup>,
    private readonly applications: Map<string, GroupApplication>,
    private readonly memberships: Map<string, InMemoryGroupMembership>
  ) {}

  list(
    groupId: string,
    query: GroupMembershipListQuery
  ): GroupMembership[] {
    const normalizedQuery = query.query?.toLowerCase();
    return [...this.memberships.values()]
      .filter((membership) => membership.groupId === groupId)
      .map((membership) => this.projection(membership))
      .filter((membership) => {
        if (query.status && membership.status !== query.status) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        return [
          membership.userId,
          membership.memberDisplayName,
          membership.memberEmail ?? ""
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  transition(
    groupId: string,
    userId: string,
    input: GroupMembershipUpdateRequest,
    decide: GroupMembershipTransitionDecision
  ): GroupMembershipTransitionAttempt | null {
    const group = this.groups.get(groupId);
    const key = membershipKey(groupId, userId);
    const membership = this.memberships.get(key);
    if (!group || !membership) {
      return null;
    }
    decide({
      groupStatus: group.status,
      capacity: group.capacity,
      activeMemberCount: this.activeMemberCount(groupId),
      currentStatus: membership.status,
      nextStatus: input.status
    });
    if (membership.status === input.status) {
      return {
        membership: this.projection(membership),
        previousStatus: membership.status,
        changed: false
      };
    }
    const updated: InMemoryGroupMembership = {
      ...membership,
      status: input.status,
      updatedAt: new Date().toISOString()
    };
    this.memberships.set(key, updated);
    this.groups.set(groupId, {
      ...group,
      memberCount: this.activeMemberCount(groupId),
      updatedAt: updated.updatedAt
    });
    return {
      membership: this.projection(updated),
      previousStatus: membership.status,
      changed: true
    };
  }

  private projection(membership: InMemoryGroupMembership): GroupMembership {
    const application = [...this.applications.values()]
      .filter(
        (item) =>
          item.groupId === membership.groupId &&
          item.userId === membership.userId
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return {
      ...membership,
      memberDisplayName: application?.memberDisplayName ?? membership.userId,
      memberEmail: application?.memberEmail ?? null
    };
  }

  private activeMemberCount(groupId: string) {
    return [...this.memberships.values()].filter(
      (membership) =>
        membership.groupId === groupId &&
        activeMembershipStatuses.has(membership.status)
    ).length;
  }
}

const activeMembershipStatuses = new Set(["active", "leader"]);
