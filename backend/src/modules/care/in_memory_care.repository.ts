import type {
  CareFollowUp,
  CareRequestAdmin,
  CareRequestListQuery,
  CareRequestSummary,
  MemberCareRequestListQuery
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  CareFollowUpCreateInput,
  CareRepository,
  CareRequestCreateInput,
  CareRequestUpdateInput,
  CareRequestStatusTransition
} from "./care.repository.js";

export class InMemoryCareRepository implements CareRepository {
  private requests = new Map<string, CareRequestAdmin>();
  private followUps = new Map<string, CareFollowUp>();

  async list(query: CareRequestListQuery): Promise<CareRequestAdmin[]> {
    return this.filtered(query)
      .slice(0, query.limit)
      .map(toAdminListItem);
  }

  async listForUser(
    userId: string,
    query: MemberCareRequestListQuery
  ): Promise<CareRequestSummary[]> {
    return this.filtered({
      userId,
      status: query.status,
      limit: query.limit
    })
      .slice(0, query.limit)
      .map(toSummary);
  }

  async getById(id: string): Promise<CareRequestAdmin | null> {
    const request = this.requests.get(id);
    return request ? this.withFollowUps(request) : null;
  }

  async create(input: CareRequestCreateInput): Promise<CareRequestSummary> {
    const now = new Date().toISOString();
    const request: CareRequestAdmin = {
      id: randomUUID(),
      userId: input.userId,
      memberDisplayName: input.memberDisplayName,
      memberEmail: input.memberEmail,
      title: input.title.trim(),
      body: input.body.trim(),
      status: "submitted",
      privacyLevel: input.privacyLevel,
      assigneeAdminUserId: null,
      assigneeName: "",
      nextFollowUpAt: null,
      internalNote: "",
      version: 1,
      followUps: [],
      createdAt: now,
      updatedAt: now
    };
    this.requests.set(request.id, request);
    return toSummary(request);
  }

  async update(
    id: string,
    input: CareRequestUpdateInput,
    expectedVersion: number
  ): Promise<CareRequestAdmin | null> {
    const existing = this.requests.get(id);
    if (!existing || existing.version !== expectedVersion) {
      return null;
    }
    const updated: CareRequestAdmin = {
      ...existing,
      status: input.status ?? existing.status,
      privacyLevel: input.privacyLevel ?? existing.privacyLevel,
      assigneeAdminUserId:
        input.assigneeAdminUserId === undefined
          ? existing.assigneeAdminUserId
          : input.assigneeAdminUserId,
      assigneeName:
        input.assigneeName === undefined
          ? existing.assigneeName
          : input.assigneeName.trim(),
      nextFollowUpAt:
        input.nextFollowUpAt === undefined
          ? existing.nextFollowUpAt
          : input.nextFollowUpAt,
      internalNote:
        input.internalNote === undefined
          ? existing.internalNote
          : input.internalNote.trim(),
      version: existing.version + 1,
      updatedAt: new Date().toISOString()
    };
    this.requests.set(id, updated);
    return this.withFollowUps(updated);
  }

  async listFollowUps(careRequestId: string): Promise<CareFollowUp[]> {
    return [...this.followUps.values()]
      .filter((followUp) => followUp.careRequestId === careRequestId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createFollowUp(
    input: CareFollowUpCreateInput,
    expectedRequestVersion: number,
    transition?: CareRequestStatusTransition
  ): Promise<CareFollowUp | null> {
    const request = this.requests.get(input.careRequestId);
    if (!request || request.version !== expectedRequestVersion) {
      return null;
    }
    const now = new Date().toISOString();
    const followUp: CareFollowUp = {
      id: randomUUID(),
      careRequestId: input.careRequestId,
      authorAdminUserId: input.authorAdminUserId,
      authorName: input.authorName,
      note: input.note.trim(),
      status: input.status,
      plannedAt: input.plannedAt ?? null,
      completedAt:
        input.status === "completed" ? (input.completedAt ?? now) : null,
      createdAt: now
    };
    this.followUps.set(followUp.id, followUp);
    if (request && transition && request.status === transition.expectedStatus) {
      this.requests.set(input.careRequestId, {
        ...request,
        status: transition.nextStatus,
        version: request.version + 1,
        updatedAt: now
      });
    }
    return followUp;
  }

  private filtered(query: CareRequestListQuery) {
    const needle = query.query?.trim().toLowerCase();
    return [...this.requests.values()]
      .filter((request) => {
        if (query.status && request.status !== query.status) {
          return false;
        }
        if (query.userId && request.userId !== query.userId) {
          return false;
        }
        return needle
          ? [
              request.title,
              request.memberDisplayName,
              request.memberEmail,
              request.assigneeName
            ]
              .join(" ")
              .toLowerCase()
              .includes(needle)
          : true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private withFollowUps(request: CareRequestAdmin): CareRequestAdmin {
    return {
      ...request,
      followUps: [...this.followUps.values()]
        .filter((followUp) => followUp.careRequestId === request.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    };
  }
}

function toAdminListItem(request: CareRequestAdmin): CareRequestAdmin {
  return { ...request, followUps: [] };
}

function toSummary(request: CareRequestAdmin): CareRequestSummary {
  return {
    id: request.id,
    userId: request.userId,
    memberDisplayName: request.memberDisplayName,
    memberEmail: request.memberEmail,
    title: request.title,
    body: request.body,
    status: request.status,
    privacyLevel: request.privacyLevel,
    assigneeName: request.assigneeName,
    nextFollowUpAt: request.nextFollowUpAt,
    version: request.version,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  };
}
