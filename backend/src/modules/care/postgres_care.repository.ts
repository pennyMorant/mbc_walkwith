import type {
  CareFollowUp,
  CareRequestAdmin,
  CareRequestListQuery,
  CareRequestSummary,
  MemberCareRequestListQuery
} from "@mbc/api-contracts";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { careFollowUps, careRequests } from "../../shared/db/schema.js";
import type {
  CareFollowUpCreateInput,
  CareRepository,
  CareRequestCreateInput,
  CareRequestUpdateInput,
  CareRequestStatusTransition
} from "./care.repository.js";

export class PostgresCareRepository implements CareRepository {
  constructor(private readonly db: AppDb) {}

  async list(query: CareRequestListQuery): Promise<CareRequestAdmin[]> {
    const rows = await this.selectRequests(query);
    return rows.map(adminListItemFromRow);
  }

  async listForUser(
    userId: string,
    query: MemberCareRequestListQuery
  ): Promise<CareRequestSummary[]> {
    const rows = await this.selectRequests({
      userId,
      status: query.status,
      limit: query.limit
    });
    return rows.map(summaryFromRow);
  }

  async getById(id: string): Promise<CareRequestAdmin | null> {
    const [row] = await this.db
      .select()
      .from(careRequests)
      .where(eq(careRequests.id, id))
      .limit(1);
    return row ? this.adminFromRow(row) : null;
  }

  async create(input: CareRequestCreateInput): Promise<CareRequestSummary> {
    const [row] = await this.db
      .insert(careRequests)
      .values({
        userId: input.userId,
        memberDisplayName: input.memberDisplayName,
        memberEmail: input.memberEmail,
        title: input.title.trim(),
        body: input.body.trim(),
        privacyLevel: input.privacyLevel,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create care request.");
    }
    return summaryFromRow(row);
  }

  async update(
    id: string,
    input: CareRequestUpdateInput,
    expectedVersion: number
  ): Promise<CareRequestAdmin | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(careRequests)
      .set({
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
              ? new Date(existing.nextFollowUpAt)
              : null
            : input.nextFollowUpAt
              ? new Date(input.nextFollowUpAt)
              : null,
        internalNote:
          input.internalNote === undefined
            ? existing.internalNote
            : input.internalNote.trim(),
        version: sql`${careRequests.version} + 1`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(careRequests.id, id),
          eq(careRequests.version, expectedVersion)
        )
      )
      .returning();
    return row ? this.adminFromRow(row) : null;
  }

  async listFollowUps(careRequestId: string): Promise<CareFollowUp[]> {
    const rows = await this.db
      .select()
      .from(careFollowUps)
      .where(eq(careFollowUps.careRequestId, careRequestId))
      .orderBy(desc(careFollowUps.createdAt));
    return rows.map(followUpFromRow);
  }

  async createFollowUp(
    input: CareFollowUpCreateInput,
    expectedRequestVersion: number,
    transition?: CareRequestStatusTransition
  ): Promise<CareFollowUp | null> {
    const now = new Date();
    const completedAt =
      input.status === "completed" ? new Date(input.completedAt ?? now) : null;
    const row = await this.db.transaction(async (transaction) => {
      const [request] = await transaction
        .select({ id: careRequests.id })
        .from(careRequests)
        .where(
          and(
            eq(careRequests.id, input.careRequestId),
            eq(careRequests.version, expectedRequestVersion)
          )
        )
        .for("update");
      if (!request) {
        return null;
      }
      const [created] = await transaction
        .insert(careFollowUps)
        .values({
          careRequestId: input.careRequestId,
          authorAdminUserId: input.authorAdminUserId,
          authorName: input.authorName,
          note: input.note.trim(),
          status: input.status,
          plannedAt: input.plannedAt ? new Date(input.plannedAt) : null,
          completedAt
        })
        .returning();
      if (created && transition) {
        await transaction
          .update(careRequests)
          .set({
            status: transition.nextStatus,
            version: sql`${careRequests.version} + 1`,
            updatedAt: now
          })
          .where(
            and(
              eq(careRequests.id, input.careRequestId),
              eq(careRequests.status, transition.expectedStatus)
            )
          );
      }
      return created;
    });
    if (!row) {
      return null;
    }
    return followUpFromRow(row);
  }

  private async selectRequests(query: CareRequestListQuery) {
    const filters = [
      query.status ? eq(careRequests.status, query.status) : undefined,
      query.userId ? eq(careRequests.userId, query.userId) : undefined,
      query.query
        ? or(
            ilike(careRequests.title, `%${query.query}%`),
            ilike(careRequests.memberDisplayName, `%${query.query}%`),
            ilike(careRequests.memberEmail, `%${query.query}%`),
            ilike(careRequests.assigneeName, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    return this.db
      .select()
      .from(careRequests)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(careRequests.updatedAt))
      .limit(query.limit);
  }

  private async adminFromRow(
    row: typeof careRequests.$inferSelect
  ): Promise<CareRequestAdmin> {
    return {
      ...summaryFromRow(row),
      assigneeAdminUserId: row.assigneeAdminUserId,
      internalNote: row.internalNote,
      followUps: await this.listFollowUps(row.id)
    };
  }
}

type CareRequestRow = typeof careRequests.$inferSelect;
type CareFollowUpRow = typeof careFollowUps.$inferSelect;

function adminListItemFromRow(row: CareRequestRow): CareRequestAdmin {
  return {
    ...summaryFromRow(row),
    assigneeAdminUserId: row.assigneeAdminUserId,
    internalNote: row.internalNote,
    followUps: []
  };
}

function summaryFromRow(row: CareRequestRow): CareRequestSummary {
  return {
    id: row.id,
    userId: row.userId,
    memberDisplayName: row.memberDisplayName,
    memberEmail: row.memberEmail,
    title: row.title,
    body: row.body,
    status: row.status,
    privacyLevel: row.privacyLevel,
    assigneeName: row.assigneeName,
    nextFollowUpAt: row.nextFollowUpAt?.toISOString() ?? null,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function followUpFromRow(row: CareFollowUpRow): CareFollowUp {
  return {
    id: row.id,
    careRequestId: row.careRequestId,
    authorAdminUserId: row.authorAdminUserId,
    authorName: row.authorName,
    note: row.note,
    status: row.status,
    plannedAt: row.plannedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}
