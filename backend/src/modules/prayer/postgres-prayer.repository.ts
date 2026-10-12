import type {
  AdminPrayerRequest,
  AdminPrayerRequestListQuery,
  AdminPrayerRequestUpdateRequest,
  MemberPrayerRequestListQuery,
  MemberSharedPrayerRequestListQuery,
  PrayerRequest,
  PrayerRequestListQuery,
  PrayerRequestUpdateRequest,
  PrayerStatus
} from "@mbc/api-contracts";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { prayerRequests } from "../../shared/db/schema.js";
import type {
  PrayerRepository,
  PrayerRequestCreateRecord
} from "./prayer.repository.js";

export class PostgresPrayerRepository implements PrayerRepository {
  constructor(private readonly db: AppDb) {}

  async listVisible(query: PrayerRequestListQuery): Promise<PrayerRequest[]> {
    const rows = await this.db
      .select()
      .from(prayerRequests)
      .where(
        and(
          eq(prayerRequests.status, "approved"),
          eq(prayerRequests.visibility, "public"),
          query.groupId ? eq(prayerRequests.groupId, query.groupId) : undefined
        )
      )
      .orderBy(desc(prayerRequests.createdAt))
      .limit(query.limit);
    return rows.map(publicPrayerFromRow);
  }

  async listByAuthor(
    authorUserId: string,
    query: MemberPrayerRequestListQuery
  ): Promise<PrayerRequest[]> {
    const rows = await this.db
      .select()
      .from(prayerRequests)
      .where(
        and(
          eq(prayerRequests.authorUserId, authorUserId),
          query.status ? eq(prayerRequests.status, query.status) : undefined,
          query.visibility
            ? eq(prayerRequests.visibility, query.visibility)
            : undefined
        )
      )
      .orderBy(desc(prayerRequests.createdAt))
      .limit(query.limit);
    return rows.map(publicPrayerFromRow);
  }

  async listSharedForMember(
    query: MemberSharedPrayerRequestListQuery
  ): Promise<PrayerRequest[]> {
    const visibilityFilter = sharedVisibilityFilter(query);
    if (!visibilityFilter) {
      return [];
    }

    const rows = await this.db
      .select()
      .from(prayerRequests)
      .where(and(eq(prayerRequests.status, "approved"), visibilityFilter))
      .orderBy(desc(prayerRequests.createdAt))
      .limit(query.limit);
    return rows.map(publicPrayerFromRow);
  }

  async listAdmin(
    query: AdminPrayerRequestListQuery
  ): Promise<AdminPrayerRequest[]> {
    const filters = [
      query.status ? eq(prayerRequests.status, query.status) : undefined,
      query.visibility
        ? eq(prayerRequests.visibility, query.visibility)
        : undefined,
      query.groupId ? eq(prayerRequests.groupId, query.groupId) : undefined,
      query.query
        ? or(
            ilike(prayerRequests.title, `%${query.query}%`),
            ilike(prayerRequests.body, `%${query.query}%`),
            ilike(prayerRequests.submitterName, `%${query.query}%`),
            ilike(prayerRequests.submitterEmail, `%${query.query}%`),
            ilike(prayerRequests.moderationNote, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);

    const rows = await this.db
      .select()
      .from(prayerRequests)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(prayerRequests.createdAt))
      .limit(query.limit);
    return rows.map(adminPrayerFromRow);
  }

  async countAdminByStatus(status: PrayerStatus): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(prayerRequests)
      .where(eq(prayerRequests.status, status));
    return Number(row?.value ?? 0);
  }

  async getById(id: string): Promise<AdminPrayerRequest | null> {
    const [row] = await this.db
      .select()
      .from(prayerRequests)
      .where(eq(prayerRequests.id, id))
      .limit(1);
    return row ? adminPrayerFromRow(row) : null;
  }

  async create(input: PrayerRequestCreateRecord): Promise<AdminPrayerRequest> {
    const [row] = await this.db
      .insert(prayerRequests)
      .values({
        authorUserId: input.authorUserId ?? null,
        title: input.title,
        body: input.body,
        visibility: input.visibility ?? "private",
        groupId: input.visibility === "group" ? input.groupId ?? null : null,
        status: "pending",
        submitterName: input.submitterName ?? "",
        submitterEmail: input.submitterEmail ?? null,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create prayer request.");
    }
    return adminPrayerFromRow(row);
  }

  async update(
    id: string,
    input: PrayerRequestUpdateRequest
  ): Promise<AdminPrayerRequest | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const visibility = input.visibility ?? existing.visibility;
    const [row] = await this.db
      .update(prayerRequests)
      .set({
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
        updatedAt: new Date()
      })
      .where(eq(prayerRequests.id, id))
      .returning();
    return row ? adminPrayerFromRow(row) : null;
  }

  async updateAdmin(
    id: string,
    input: AdminPrayerRequestUpdateRequest & {
      moderatedByAdminUserId?: string | null;
    }
  ): Promise<AdminPrayerRequest | null> {
    const row = await this.db.transaction(async (transaction) => {
      const [currentRow] = await transaction
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.id, id))
        .for("update");
      if (!currentRow) {
        return null;
      }
      const existing = adminPrayerFromRow(currentRow);
      const visibility = input.visibility ?? existing.visibility;
      const moderationChanged = isModerationChange(input);
      const [updated] = await transaction
        .update(prayerRequests)
        .set({
          visibility,
          groupId:
            visibility === "group" ? input.groupId ?? existing.groupId : null,
          status: input.status ?? existing.status,
          moderationNote: input.moderationNote ?? existing.moderationNote,
          moderatedAt: moderationChanged
            ? new Date()
            : existing.moderatedAt
              ? new Date(existing.moderatedAt)
              : null,
          moderatedByAdminUserId: moderationChanged
            ? input.moderatedByAdminUserId ?? null
            : existing.moderatedByAdminUserId,
          updatedAt: new Date()
        })
        .where(eq(prayerRequests.id, id))
        .returning();
      return updated ?? null;
    }, { isolationLevel: "serializable" });
    return row ? adminPrayerFromRow(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(prayerRequests)
      .where(eq(prayerRequests.id, id))
      .returning({ id: prayerRequests.id });
    return deleted.length > 0;
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

type PrayerRequestRow = typeof prayerRequests.$inferSelect;

function publicPrayerFromRow(row: PrayerRequestRow): PrayerRequest {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    visibility: row.visibility,
    groupId: row.groupId,
    status: row.status,
    submitterName: row.submitterName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function adminPrayerFromRow(row: PrayerRequestRow): AdminPrayerRequest {
  return {
    ...publicPrayerFromRow(row),
    authorUserId: row.authorUserId,
    submitterEmail: row.submitterEmail,
    moderationNote: row.moderationNote,
    moderatedAt: row.moderatedAt?.toISOString() ?? null,
    moderatedByAdminUserId: row.moderatedByAdminUserId
  };
}

function sharedVisibilityFilter(query: MemberSharedPrayerRequestListQuery) {
  if (query.visibility === "private") {
    return null;
  }
  if (query.visibility === "group") {
    return query.groupId
      ? and(
          eq(prayerRequests.visibility, "group"),
          eq(prayerRequests.groupId, query.groupId)
        )
      : null;
  }
  if (query.visibility) {
    return eq(prayerRequests.visibility, query.visibility);
  }
  return query.groupId
    ? or(
        eq(prayerRequests.visibility, "public"),
        eq(prayerRequests.visibility, "members"),
        and(
          eq(prayerRequests.visibility, "group"),
          eq(prayerRequests.groupId, query.groupId)
        )
      )
    : or(
        eq(prayerRequests.visibility, "public"),
        eq(prayerRequests.visibility, "members")
      );
}
