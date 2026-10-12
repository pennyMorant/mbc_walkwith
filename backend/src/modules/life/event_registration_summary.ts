import type {
  EventRegistration,
  EventRegistrationUpdateRequest,
  LifePost
} from "@mbc/api-contracts";

export function dedupeAndSortLifePosts(posts: LifePost[]) {
  const byId = new Map<string, LifePost>();
  for (const post of posts) {
    byId.set(post.id, post);
  }
  return [...byId.values()].sort((a, b) => {
    if (a.displayWeight !== b.displayWeight) {
      return b.displayWeight - a.displayWeight;
    }
    const startComparison = compareNullableIsoDesc(a.startsAt, b.startsAt);
    if (startComparison !== 0) {
      return startComparison;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function compareNullableIsoDesc(
  a: string | null | undefined,
  b: string | null | undefined
) {
  if (!a && !b) {
    return 0;
  }
  if (!a) {
    return 1;
  }
  if (!b) {
    return -1;
  }
  return b.localeCompare(a);
}

export function eventRegistrationSummary(
  post: LifePost,
  registeredCount: number,
  myRegistration: EventRegistration | null
): LifePost["registrationSummary"] {
  return {
    enabled: post.registrationEnabled,
    capacity: post.registrationCapacity,
    registeredCount,
    remainingCount:
      post.registrationCapacity === null
        ? null
        : Math.max(post.registrationCapacity - registeredCount, 0),
    deadline: post.registrationDeadline,
    allowCancellation: post.registrationAllowCancellation,
    maxPartySize: post.registrationMaxPartySize,
    myRegistrationStatus: myRegistration?.status ?? null,
    myPartySize: myRegistration?.partySize ?? null,
    myNote: myRegistration?.note ?? null,
    myCheckedInAt: myRegistration?.checkedInAt ?? null,
    myCheckInMethod: myRegistration?.checkInMethod ?? null
  };
}

export function eventRegistrationAttendancePatch(
  input: EventRegistrationUpdateRequest,
  existing: EventRegistration,
  actorAdminUserId: string | null
) {
  if (input.status === "checked_in" && existing.status !== "checked_in") {
    return {
      ...input,
      checkedInAt: new Date().toISOString(),
      checkInMethod: "admin_manual" as const,
      checkedInByAdminUserId: actorAdminUserId
    };
  }
  if (input.status && input.status !== "checked_in") {
    return {
      ...input,
      checkedInAt: null,
      checkInMethod: null,
      checkedInByAdminUserId: null
    };
  }
  return input;
}
