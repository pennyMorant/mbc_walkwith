import type {
  NewcomerCreateRequest,
  NewcomerFollowUp,
  NewcomerListQuery,
  NewcomerProfile,
  NewcomerUpdateRequest
} from "@mbc/api-contracts";
import { and, desc, eq, ilike, or } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { newcomerFollowUps, newcomerProfiles } from "../../shared/db/schema.js";
import type {
  NewcomerFollowUpCreateInputWithAuthor,
  NewcomerRepository
} from "./newcomer.repository.js";

export class PostgresNewcomerRepository implements NewcomerRepository {
  constructor(private readonly db: AppDb) {}

  async list(query: NewcomerListQuery): Promise<NewcomerProfile[]> {
    const filters = [
      query.status ? eq(newcomerProfiles.status, query.status) : undefined,
      query.assigneeAdminUserId
        ? eq(newcomerProfiles.assigneeAdminUserId, query.assigneeAdminUserId)
        : undefined,
      query.query
        ? or(
            ilike(newcomerProfiles.displayName, `%${query.query}%`),
            ilike(newcomerProfiles.email, `%${query.query}%`),
            ilike(newcomerProfiles.phone, `%${query.query}%`),
            ilike(newcomerProfiles.source, `%${query.query}%`),
            ilike(newcomerProfiles.interest, `%${query.query}%`),
            ilike(newcomerProfiles.assigneeName, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(newcomerProfiles)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(newcomerProfiles.updatedAt))
      .limit(query.limit);
    return rows.map(profileFromRow);
  }

  async getById(id: string): Promise<NewcomerProfile | null> {
    const [row] = await this.db
      .select()
      .from(newcomerProfiles)
      .where(eq(newcomerProfiles.id, id))
      .limit(1);
    return row ? profileFromRow(row) : null;
  }

  async create(input: NewcomerCreateRequest): Promise<NewcomerProfile> {
    const [row] = await this.db
      .insert(newcomerProfiles)
      .values({
        externalUserId: input.externalUserId?.trim() || null,
        displayName: input.displayName.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        preferredLanguage: input.preferredLanguage.trim(),
        source: input.source.trim() || "app",
        interest: input.interest.trim(),
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create newcomer profile.");
    }
    return profileFromRow(row);
  }

  async update(
    id: string,
    input: NewcomerUpdateRequest
  ): Promise<NewcomerProfile | null> {
    const [row] = await this.db
      .update(newcomerProfiles)
      .set(newcomerUpdateValues(input))
      .where(eq(newcomerProfiles.id, id))
      .returning();
    return row ? profileFromRow(row) : null;
  }

  async listFollowUps(newcomerId: string): Promise<NewcomerFollowUp[]> {
    const rows = await this.db
      .select()
      .from(newcomerFollowUps)
      .where(eq(newcomerFollowUps.newcomerId, newcomerId))
      .orderBy(desc(newcomerFollowUps.createdAt));
    return rows.map(followUpFromRow);
  }

  async createFollowUp(
    input: NewcomerFollowUpCreateInputWithAuthor
  ): Promise<NewcomerFollowUp> {
    const now = new Date();
    const completedAt =
      input.status === "completed" ? new Date(input.completedAt ?? now) : null;
    const [row] = await this.db
      .insert(newcomerFollowUps)
      .values({
        newcomerId: input.newcomerId,
        authorAdminUserId: input.authorAdminUserId,
        authorName: input.authorName,
        note: input.note.trim(),
        status: input.status,
        plannedAt: input.plannedAt ? new Date(input.plannedAt) : null,
        completedAt
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create newcomer follow-up.");
    }
    return followUpFromRow(row);
  }
}

export function newcomerUpdateValues(input: NewcomerUpdateRequest) {
  const values: Partial<typeof newcomerProfiles.$inferInsert> = {
    updatedAt: new Date()
  };
  if (input.linkedMemberUserId !== undefined) {
    values.linkedMemberUserId = input.linkedMemberUserId;
  }
  if (input.preferredLanguage !== undefined) {
    values.preferredLanguage = input.preferredLanguage.trim();
  }
  if (input.interest !== undefined) {
    values.interest = input.interest.trim();
  }
  if (input.status !== undefined) {
    values.status = input.status;
  }
  if (input.assigneeAdminUserId !== undefined) {
    values.assigneeAdminUserId = input.assigneeAdminUserId;
  }
  if (input.assigneeName !== undefined) {
    values.assigneeName = input.assigneeName.trim();
  }
  if (input.nextFollowUpAt !== undefined) {
    values.nextFollowUpAt = input.nextFollowUpAt
      ? new Date(input.nextFollowUpAt)
      : null;
  }
  if (input.conversionStatus !== undefined) {
    values.conversionStatus = input.conversionStatus;
  }
  return values;
}

type NewcomerProfileRow = typeof newcomerProfiles.$inferSelect;
type NewcomerFollowUpRow = typeof newcomerFollowUps.$inferSelect;

function profileFromRow(row: NewcomerProfileRow): NewcomerProfile {
  return {
    id: row.id,
    externalUserId: row.externalUserId,
    linkedMemberUserId: row.linkedMemberUserId,
    displayName: row.displayName,
    email: row.email,
    phone: row.phone,
    preferredLanguage: row.preferredLanguage,
    source: row.source,
    interest: row.interest,
    status: row.status,
    assigneeAdminUserId: row.assigneeAdminUserId,
    assigneeName: row.assigneeName,
    nextFollowUpAt: row.nextFollowUpAt?.toISOString() ?? null,
    conversionStatus: row.conversionStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function followUpFromRow(row: NewcomerFollowUpRow): NewcomerFollowUp {
  return {
    id: row.id,
    newcomerId: row.newcomerId,
    authorAdminUserId: row.authorAdminUserId,
    authorName: row.authorName,
    note: row.note,
    status: row.status,
    plannedAt: row.plannedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}
