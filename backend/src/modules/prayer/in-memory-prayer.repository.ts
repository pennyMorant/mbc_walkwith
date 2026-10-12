import type {
  AdminPrayerRequest,
  AdminPrayerRequestListQuery,
  AdminPrayerRequestUpdateRequest,
  MemberPrayerRequestListQuery,
  MemberSharedPrayerRequestListQuery,
  PrayerRequest,
  PrayerRequestListQuery,
  PrayerRequestUpdateRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  PrayerRepository,
  PrayerRequestCreateRecord
} from "./prayer.repository.js";

export class InMemoryPrayerRepository implements PrayerRepository {
  private requests = new Map<string, AdminPrayerRequest>(
    seedPrayerRequests.map((request) => [request.id, request])
  );

  async listVisible(query: PrayerRequestListQuery): Promise<PrayerRequest[]> {
    return this.filterAndSort(query)
      .filter((request) => request.status === "approved")
      .filter((request) => request.visibility === "public")
      .map(publicPrayerFromAdmin);
  }

  async listByAuthor(
    authorUserId: string,
    query: MemberPrayerRequestListQuery
  ): Promise<PrayerRequest[]> {
    return [...this.requests.values()]
      .filter((request) => request.authorUserId === authorUserId)
      .filter((request) => {
        if (query.status && request.status !== query.status) {
          return false;
        }
        if (query.visibility && request.visibility !== query.visibility) {
          return false;
        }
        return true;
      })
      .sort(sortNewestFirst)
      .slice(0, query.limit)
      .map(publicPrayerFromAdmin);
  }

  async listSharedForMember(
    query: MemberSharedPrayerRequestListQuery
  ): Promise<PrayerRequest[]> {
    return [...this.requests.values()]
      .filter((request) => request.status === "approved")
      .filter((request) => isSharedWithMember(request, query))
      .sort(sortNewestFirst)
      .slice(0, query.limit)
      .map(publicPrayerFromAdmin);
  }

  async listAdmin(
    query: AdminPrayerRequestListQuery
  ): Promise<AdminPrayerRequest[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.requests.values()]
      .filter((request) => {
        if (query.status && request.status !== query.status) {
          return false;
        }
        if (query.visibility && request.visibility !== query.visibility) {
          return false;
        }
        if (query.groupId && request.groupId !== query.groupId) {
          return false;
        }
        if (normalizedQuery) {
          return [
            request.title,
            request.body,
            request.submitterName,
            request.submitterEmail ?? "",
            request.moderationNote
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort(sortNewestFirst)
      .slice(0, query.limit);
  }

  async countAdminByStatus(
    status: AdminPrayerRequest["status"]
  ): Promise<number> {
    return [...this.requests.values()].filter(
      (request) => request.status === status
    ).length;
  }

  async getById(id: string): Promise<AdminPrayerRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async create(input: PrayerRequestCreateRecord): Promise<AdminPrayerRequest> {
    const now = new Date().toISOString();
    const request: AdminPrayerRequest = {
      id: randomUUID(),
      authorUserId: input.authorUserId ?? null,
      title: input.title,
      body: input.body,
      visibility: input.visibility ?? "private",
      groupId: input.visibility === "group" ? input.groupId ?? null : null,
      status: "pending",
      submitterName: input.submitterName ?? "",
      submitterEmail: input.submitterEmail ?? null,
      moderationNote: "",
      moderatedAt: null,
      moderatedByAdminUserId: null,
      createdAt: now,
      updatedAt: now
    };
    this.requests.set(request.id, request);
    return request;
  }

  async update(
    id: string,
    input: PrayerRequestUpdateRequest
  ): Promise<AdminPrayerRequest | null> {
    const existing = this.requests.get(id);
    if (!existing) {
      return null;
    }

    const visibility = input.visibility ?? existing.visibility;
    const updated: AdminPrayerRequest = {
      ...existing,
      title: input.title ?? existing.title,
      body: input.body ?? existing.body,
      visibility,
      groupId: visibility === "group" ? input.groupId ?? existing.groupId : null,
      submitterName: input.submitterName ?? existing.submitterName,
      submitterEmail:
        input.submitterEmail === undefined
          ? existing.submitterEmail
          : input.submitterEmail,
      status: "pending",
      updatedAt: new Date().toISOString()
    };
    this.requests.set(id, updated);
    return updated;
  }

  async updateAdmin(
    id: string,
    input: AdminPrayerRequestUpdateRequest & {
      moderatedByAdminUserId?: string | null;
    }
  ): Promise<AdminPrayerRequest | null> {
    const existing = this.requests.get(id);
    if (!existing) {
      return null;
    }

    const visibility = input.visibility ?? existing.visibility;
    const now = new Date().toISOString();
    const updated: AdminPrayerRequest = {
      ...existing,
      visibility,
      groupId: visibility === "group" ? input.groupId ?? existing.groupId : null,
      status: input.status ?? existing.status,
      moderationNote: input.moderationNote ?? existing.moderationNote,
      moderatedAt:
        isModerationChange(input) ? now : existing.moderatedAt,
      moderatedByAdminUserId:
        isModerationChange(input)
          ? input.moderatedByAdminUserId ?? null
          : existing.moderatedByAdminUserId,
      updatedAt: now
    };
    this.requests.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.requests.delete(id);
  }

  private filterAndSort(query: PrayerRequestListQuery) {
    return [...this.requests.values()]
      .filter((request) => {
        if (query.visibility && request.visibility !== query.visibility) {
          return false;
        }
        if (query.groupId && request.groupId !== query.groupId) {
          return false;
        }
        return true;
      })
      .sort(sortNewestFirst)
      .slice(0, query.limit);
  }
}

function isModerationChange(input: AdminPrayerRequestUpdateRequest) {
  return (
    input.status !== undefined ||
    input.visibility !== undefined ||
    input.groupId !== undefined ||
    input.moderationNote !== undefined
  );
}

function publicPrayerFromAdmin(request: AdminPrayerRequest): PrayerRequest {
  return {
    id: request.id,
    title: request.title,
    body: request.body,
    visibility: request.visibility,
    groupId: request.groupId,
    status: request.status,
    submitterName: request.submitterName,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  };
}

function sortNewestFirst(a: AdminPrayerRequest, b: AdminPrayerRequest) {
  return b.createdAt.localeCompare(a.createdAt);
}

function isSharedWithMember(
  request: AdminPrayerRequest,
  query: MemberSharedPrayerRequestListQuery
) {
  if (query.visibility === "private") {
    return false;
  }
  if (query.visibility === "group") {
    return Boolean(
      query.groupId &&
        request.visibility === "group" &&
        request.groupId === query.groupId
    );
  }
  if (query.visibility) {
    return request.visibility === query.visibility;
  }
  if (request.visibility === "public" || request.visibility === "members") {
    return true;
  }
  return Boolean(
    query.groupId &&
      request.visibility === "group" &&
      request.groupId === query.groupId
  );
}

const seedPrayerRequests: AdminPrayerRequest[] = [
  {
    id: "prayer-public-approved",
    authorUserId: null,
    title: "Sunday thanksgiving",
    body: "Give thanks for answered prayer this week.",
    visibility: "public",
    groupId: null,
    status: "approved",
    submitterName: "Prayer Team",
    submitterEmail: null,
    moderationNote: "Approved for public sharing.",
    moderatedAt: "2026-05-10T18:00:00.000Z",
    moderatedByAdminUserId: null,
    createdAt: "2026-05-10T18:00:00.000Z",
    updatedAt: "2026-05-10T18:00:00.000Z"
  },
  {
    id: "prayer-small-group-approved",
    authorUserId: null,
    title: "Small group care",
    body: "Please pray for a member recovering this week.",
    visibility: "group",
    groupId: "friday-fellowship",
    status: "approved",
    submitterName: "Care Team",
    submitterEmail: null,
    moderationNote: "Approved for group sharing.",
    moderatedAt: "2026-05-09T18:00:00.000Z",
    moderatedByAdminUserId: null,
    createdAt: "2026-05-09T18:00:00.000Z",
    updatedAt: "2026-05-09T18:00:00.000Z"
  },
  {
    id: "prayer-private-pending",
    authorUserId: null,
    title: "Private pastoral care",
    body: "A private request visible only to pastoral/admin staff.",
    visibility: "private",
    groupId: null,
    status: "pending",
    submitterName: "Member",
    submitterEmail: null,
    moderationNote: "",
    moderatedAt: null,
    moderatedByAdminUserId: null,
    createdAt: "2026-05-08T18:00:00.000Z",
    updatedAt: "2026-05-08T18:00:00.000Z"
  }
];
