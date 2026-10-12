import type {
  AdminPrayerRequestApproveRequest,
  AdminPrayerRequestUpdateRequest,
  MemberPrayerRequestListQuery,
  MemberSharedPrayerRequestListQuery,
  PrayerRequestCreateRequest,
  PrayerRequestListQuery,
  PrayerStatus,
  PrayerRequestUpdateRequest
} from "@mbc/api-contracts";

import type {
  PrayerRepository,
  PrayerRequestCreateRecord
} from "./prayer.repository.js";

export class PrayerService {
  constructor(private readonly repository: PrayerRepository) {}

  listVisible(query: PrayerRequestListQuery) {
    return this.repository.listVisible(query);
  }

  listByAuthor(authorUserId: string, query: MemberPrayerRequestListQuery) {
    return this.repository.listByAuthor(authorUserId, query);
  }

  listSharedForMember(
    memberGroupId: string | null | undefined,
    query: MemberSharedPrayerRequestListQuery
  ) {
    return this.repository.listSharedForMember({
      ...query,
      groupId: memberGroupId ?? undefined
    });
  }

  listAdmin(query: Parameters<PrayerRepository["listAdmin"]>[0]) {
    return this.repository.listAdmin(query);
  }

  countAdminByStatus(status: PrayerStatus) {
    return this.repository.countAdminByStatus(status);
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  create(input: PrayerRequestCreateRequest, authorUserId?: string | null) {
    return this.repository.create(
      normalizeCreateInput({
        ...input,
        authorUserId: authorUserId ?? null
      })
    );
  }

  update(id: string, input: PrayerRequestUpdateRequest) {
    return this.repository.update(id, normalizeUpdateInput(input));
  }

  moderate(
    id: string,
    input: AdminPrayerRequestUpdateRequest,
    moderatedByAdminUserId: string | null
  ) {
    return this.repository.updateAdmin(id, {
      ...normalizeAdminUpdateInput(input),
      moderatedByAdminUserId
    });
  }

  approve(
    id: string,
    input: Omit<AdminPrayerRequestApproveRequest, "notifyApp">,
    moderatedByAdminUserId: string | null
  ) {
    return this.moderate(
      id,
      { ...input, status: "approved" },
      moderatedByAdminUserId
    );
  }

  hide(
    id: string,
    moderationNote: string,
    moderatedByAdminUserId: string | null
  ) {
    return this.moderate(
      id,
      { status: "hidden", moderationNote },
      moderatedByAdminUserId
    );
  }

  archive(id: string, moderatedByAdminUserId: string | null) {
    return this.moderate(id, { status: "archived" }, moderatedByAdminUserId);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}

function normalizeCreateInput(
  input: PrayerRequestCreateRecord
): PrayerRequestCreateRecord {
  return {
    ...input,
    authorUserId: input.authorUserId ?? null,
    visibility: input.visibility ?? "private",
    groupId: input.visibility === "group" ? input.groupId ?? null : null,
    submitterName: input.submitterName ?? "",
    submitterEmail: input.submitterEmail ?? null
  };
}

function normalizeUpdateInput(
  input: PrayerRequestUpdateRequest
): PrayerRequestUpdateRequest {
  return {
    ...input,
    groupId:
      input.visibility && input.visibility !== "group" ? null : input.groupId
  };
}

function normalizeAdminUpdateInput(
  input: AdminPrayerRequestUpdateRequest
): AdminPrayerRequestUpdateRequest {
  return {
    ...input,
    groupId:
      input.visibility && input.visibility !== "group" ? null : input.groupId
  };
}
