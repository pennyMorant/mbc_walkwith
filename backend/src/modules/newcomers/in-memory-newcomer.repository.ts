import type {
  NewcomerCreateRequest,
  NewcomerFollowUp,
  NewcomerListQuery,
  NewcomerProfile,
  NewcomerUpdateRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  NewcomerFollowUpCreateInputWithAuthor,
  NewcomerRepository
} from "./newcomer.repository.js";

export class InMemoryNewcomerRepository implements NewcomerRepository {
  private newcomers = new Map<string, NewcomerProfile>();
  private followUps = new Map<string, NewcomerFollowUp>();

  async list(query: NewcomerListQuery): Promise<NewcomerProfile[]> {
    return this.filtered(query).slice(0, query.limit);
  }

  async getById(id: string): Promise<NewcomerProfile | null> {
    return this.newcomers.get(id) ?? null;
  }

  async create(input: NewcomerCreateRequest): Promise<NewcomerProfile> {
    const now = new Date().toISOString();
    const newcomer: NewcomerProfile = {
      id: randomUUID(),
      externalUserId: input.externalUserId?.trim() || null,
      linkedMemberUserId: null,
      displayName: input.displayName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      preferredLanguage: input.preferredLanguage.trim(),
      source: input.source.trim() || "app",
      interest: input.interest.trim(),
      status: "new",
      assigneeAdminUserId: null,
      assigneeName: "",
      nextFollowUpAt: null,
      conversionStatus: "none",
      createdAt: now,
      updatedAt: now
    };
    this.newcomers.set(newcomer.id, newcomer);
    return newcomer;
  }

  async update(
    id: string,
    input: NewcomerUpdateRequest
  ): Promise<NewcomerProfile | null> {
    const existing = this.newcomers.get(id);
    if (!existing) {
      return null;
    }
    const updated: NewcomerProfile = {
      ...existing,
      linkedMemberUserId:
        input.linkedMemberUserId === undefined
          ? existing.linkedMemberUserId
          : input.linkedMemberUserId,
      preferredLanguage:
        input.preferredLanguage === undefined
          ? existing.preferredLanguage
          : input.preferredLanguage.trim(),
      interest:
        input.interest === undefined ? existing.interest : input.interest.trim(),
      status: input.status ?? existing.status,
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
      conversionStatus: input.conversionStatus ?? existing.conversionStatus,
      updatedAt: new Date().toISOString()
    };
    this.newcomers.set(id, updated);
    return updated;
  }

  async listFollowUps(newcomerId: string): Promise<NewcomerFollowUp[]> {
    return [...this.followUps.values()]
      .filter((followUp) => followUp.newcomerId === newcomerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createFollowUp(
    input: NewcomerFollowUpCreateInputWithAuthor
  ): Promise<NewcomerFollowUp> {
    const now = new Date().toISOString();
    const followUp: NewcomerFollowUp = {
      id: randomUUID(),
      newcomerId: input.newcomerId,
      authorAdminUserId: input.authorAdminUserId,
      authorName: input.authorName,
      note: input.note.trim(),
      status: input.status,
      plannedAt: input.plannedAt ?? null,
      completedAt:
        input.status === "completed" ? input.completedAt ?? now : null,
      createdAt: now
    };
    this.followUps.set(followUp.id, followUp);
    return followUp;
  }

  private filtered(query: NewcomerListQuery) {
    const needle = query.query?.trim().toLowerCase();
    return [...this.newcomers.values()]
      .filter((newcomer) => {
        if (query.status && newcomer.status !== query.status) {
          return false;
        }
        if (
          query.assigneeAdminUserId &&
          newcomer.assigneeAdminUserId !== query.assigneeAdminUserId
        ) {
          return false;
        }
        return needle
          ? [
              newcomer.displayName,
              newcomer.email ?? "",
              newcomer.phone ?? "",
              newcomer.source,
              newcomer.interest,
              newcomer.assigneeName
            ]
              .join(" ")
              .toLowerCase()
              .includes(needle)
          : true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
