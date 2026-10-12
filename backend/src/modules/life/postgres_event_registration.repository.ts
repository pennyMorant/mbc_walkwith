import type {
  EventCheckInCode,
  EventRegistration,
  EventRegistrationListQuery,
  EventRegistrationMemberUpdateRequest,
  LifePost
} from "@mbc/api-contracts";
import { and, desc, eq, gt, ilike, inArray, or, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  eventCheckInCodes,
  eventRegistrations,
  publicPosts
} from "../../shared/db/schema.js";
import type {
  EventCheckInCodeCreateInput,
  EventRegistrationAdminUpdateInput,
  EventRegistrationAttendanceInput,
  EventRegistrationCreateInput,
  EventRegistrationRepository,
  EventRegistrationStore
} from "./event_registration.repository.js";
import { normalizeEventCheckInCode } from "./event_check_in_rules.js";
import {
  checkInCodeFromRow,
  dateFromIso,
  postFromRow,
  registrationFromRow
} from "./postgres_life_post_mappers.js";

type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type EventRegistrationDb = Pick<AppDb, "select" | "insert" | "update">;

class PostgresEventRegistrationStore implements EventRegistrationStore {
  constructor(protected readonly db: EventRegistrationDb) {}

  async getById(id: string): Promise<LifePost | null> {
    const [row] = await this.db
      .select()
      .from(publicPosts)
      .where(eq(publicPosts.id, id))
      .limit(1);
    return row ? postFromRow(row) : null;
  }

  async listRegistrations(
    lifePostId: string,
    query: EventRegistrationListQuery
  ) {
    const filters = [
      eq(eventRegistrations.lifePostId, lifePostId),
      query.status ? eq(eventRegistrations.status, query.status) : undefined,
      query.query
        ? or(
            ilike(eventRegistrations.attendeeName, `%${query.query}%`),
            ilike(eventRegistrations.attendeeEmail, `%${query.query}%`),
            ilike(eventRegistrations.note, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const where = and(...filters);
    const [rows, countRows] = await Promise.all([
      this.db
        .select()
        .from(eventRegistrations)
        .where(where)
        .orderBy(desc(eventRegistrations.createdAt))
        .limit(query.limit)
        .offset(query.offset),
      this.db
        .select({ value: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(where)
    ]);
    return {
      items: rows.map(registrationFromRow),
      total: Number(countRows[0]?.value ?? 0)
    };
  }

  async listAllRegistrations(lifePostId: string): Promise<EventRegistration[]> {
    const rows = await this.db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.lifePostId, lifePostId))
      .orderBy(desc(eventRegistrations.createdAt));
    return rows.map(registrationFromRow);
  }

  async getRegistrationById(
    lifePostId: string,
    registrationId: string
  ): Promise<EventRegistration | null> {
    const [row] = await this.db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.lifePostId, lifePostId),
          eq(eventRegistrations.id, registrationId)
        )
      )
      .limit(1);
    return row ? registrationFromRow(row) : null;
  }

  async getActiveRegistrationForUser(
    lifePostId: string,
    userId: string
  ): Promise<EventRegistration | null> {
    const [row] = await this.db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.lifePostId, lifePostId),
          eq(eventRegistrations.userId, userId),
          inArray(eventRegistrations.status, ["confirmed", "checked_in"])
        )
      )
      .limit(1);
    return row ? registrationFromRow(row) : null;
  }

  async countActiveRegistrationPartySize(lifePostId: string): Promise<number> {
    const [row] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${eventRegistrations.partySize}), 0)`
      })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.lifePostId, lifePostId),
          inArray(eventRegistrations.status, ["confirmed", "checked_in"])
        )
      );
    return Number(row?.total ?? 0);
  }

  async createRegistration(
    input: EventRegistrationCreateInput
  ): Promise<EventRegistration> {
    const now = new Date();
    const [row] = await this.db
      .insert(eventRegistrations)
      .values({
        lifePostId: input.lifePostId,
        userId: input.userId,
        attendeeName: input.attendeeName,
        attendeeEmail: input.attendeeEmail,
        partySize: input.partySize,
        status: "confirmed",
        note: input.note ?? "",
        checkedInAt: null,
        checkInMethod: null,
        checkedInByAdminUserId: null,
        updatedAt: now
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create event registration.");
    }
    return registrationFromRow(row);
  }

  async cancelRegistration(
    lifePostId: string,
    userId: string
  ): Promise<EventRegistration | null> {
    const existing = await this.getActiveRegistrationForUser(
      lifePostId,
      userId
    );
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(eventRegistrations)
      .set({
        status: "cancelled",
        checkedInAt: null,
        checkInMethod: null,
        checkedInByAdminUserId: null,
        updatedAt: new Date()
      })
      .where(eq(eventRegistrations.id, existing.id))
      .returning();
    return row ? registrationFromRow(row) : null;
  }

  async updateRegistrationForUser(
    lifePostId: string,
    userId: string,
    input: EventRegistrationMemberUpdateRequest
  ): Promise<EventRegistration | null> {
    const existing = await this.getActiveRegistrationForUser(
      lifePostId,
      userId
    );
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(eventRegistrations)
      .set({
        partySize: input.partySize,
        note: input.note?.trim() ?? "",
        updatedAt: new Date()
      })
      .where(eq(eventRegistrations.id, existing.id))
      .returning();
    return row ? registrationFromRow(row) : null;
  }

  async checkInRegistrationForUser(
    lifePostId: string,
    userId: string,
    input: EventRegistrationAttendanceInput
  ): Promise<EventRegistration | null> {
    const existing = await this.getActiveRegistrationForUser(
      lifePostId,
      userId
    );
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(eventRegistrations)
      .set({
        status: "checked_in",
        checkedInAt: new Date(input.checkedInAt),
        checkInMethod: input.checkInMethod,
        checkedInByAdminUserId: input.checkedInByAdminUserId,
        updatedAt: new Date()
      })
      .where(eq(eventRegistrations.id, existing.id))
      .returning();
    return row ? registrationFromRow(row) : null;
  }

  async getActiveCheckInCode(
    lifePostId: string
  ): Promise<EventCheckInCode | null> {
    const [row] = await this.db
      .select()
      .from(eventCheckInCodes)
      .where(
        and(
          eq(eventCheckInCodes.lifePostId, lifePostId),
          sql`${eventCheckInCodes.disabledAt} is null`,
          or(
            sql`${eventCheckInCodes.expiresAt} is null`,
            gt(eventCheckInCodes.expiresAt, new Date())
          )
        )
      )
      .orderBy(desc(eventCheckInCodes.updatedAt))
      .limit(1);
    return row ? checkInCodeFromRow(row) : null;
  }

  async createCheckInCode(
    input: EventCheckInCodeCreateInput
  ): Promise<EventCheckInCode> {
    const now = new Date();
    const [row] = await this.db
      .insert(eventCheckInCodes)
      .values({
        lifePostId: input.lifePostId,
        qrPayload: input.qrPayload,
        shortCode: normalizeEventCheckInCode(input.shortCode),
        expiresAt: dateFromIso(input.expiresAt),
        disabledAt: null,
        createdByAdminUserId: input.createdByAdminUserId,
        updatedAt: now
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create event check-in code.");
    }
    return checkInCodeFromRow(row);
  }

  async disableActiveCheckInCodes(lifePostId: string): Promise<void> {
    const now = new Date();
    await this.db
      .update(eventCheckInCodes)
      .set({ disabledAt: now, updatedAt: now })
      .where(
        and(
          eq(eventCheckInCodes.lifePostId, lifePostId),
          sql`${eventCheckInCodes.disabledAt} is null`
        )
      );
  }

  async getCheckInCodeByValue(value: string): Promise<EventCheckInCode | null> {
    const normalizedValue = normalizeEventCheckInCode(value);
    const [row] = await this.db
      .select()
      .from(eventCheckInCodes)
      .where(
        or(
          eq(eventCheckInCodes.qrPayload, value.trim()),
          eq(eventCheckInCodes.shortCode, normalizedValue)
        )
      )
      .limit(1);
    return row ? checkInCodeFromRow(row) : null;
  }

  async updateRegistration(
    lifePostId: string,
    registrationId: string,
    input: EventRegistrationAdminUpdateInput
  ): Promise<EventRegistration | null> {
    const [row] = await this.db
      .update(eventRegistrations)
      .set({
        status: input.status,
        partySize: input.partySize,
        note: input.note?.trim(),
        checkedInAt:
          input.checkedInAt === undefined
            ? undefined
            : dateFromIso(input.checkedInAt),
        checkInMethod: input.checkInMethod,
        checkedInByAdminUserId: input.checkedInByAdminUserId,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(eventRegistrations.id, registrationId),
          eq(eventRegistrations.lifePostId, lifePostId)
        )
      )
      .returning();
    return row ? registrationFromRow(row) : null;
  }
}

export class PostgresEventRegistrationRepository
  extends PostgresEventRegistrationStore
  implements EventRegistrationRepository
{
  constructor(private readonly rootDb: AppDb) {
    super(rootDb);
  }

  async withEventRegistrationLock<T>(
    lifePostId: string,
    operation: (store: EventRegistrationStore) => Promise<T>
  ): Promise<T> {
    return this.rootDb.transaction(async (transaction: AppTransaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${lifePostId}))`
      );
      return operation(new PostgresEventRegistrationStore(transaction));
    });
  }
}
