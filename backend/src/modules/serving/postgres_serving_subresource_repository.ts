import type {
  ServingAvailabilityListQuery,
  ServingAvailabilityRecord,
  ServingAvailabilityUpsertRequest,
  ServingCheckInListQuery,
  ServingCheckInRecord,
  ServingCheckInUpsertRequest
} from "@mbc/api-contracts";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  servingAssignments,
  servingAvailabilityRecords,
  servingCheckIns
} from "../../shared/db/schema.js";
import {
  availabilityFromRow,
  checkInFromRow
} from "./postgres_serving_mappers.js";
import { lockServingWriters } from "./postgres_serving_write_locks.js";
import type {
  ServingAvailabilityWriteDecision,
  ServingCheckInWriteDecision
} from "./serving.repository.js";
import {
  assignmentScheduleState,
  availabilityConflictIds
} from "./serving_schedule_rules.js";

export class PostgresServingSubresourceRepository {
  constructor(private readonly db: AppDb) {}

  async listAvailability(
    query: ServingAvailabilityListQuery
  ): Promise<ServingAvailabilityRecord[]> {
    const filters = [
      query.userId
        ? eq(servingAvailabilityRecords.userId, query.userId)
        : undefined,
      query.status
        ? eq(servingAvailabilityRecords.status, query.status)
        : undefined,
      query.from
        ? gte(servingAvailabilityRecords.startsAt, new Date(query.from))
        : undefined,
      query.to
        ? lte(servingAvailabilityRecords.startsAt, new Date(query.to))
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(servingAvailabilityRecords)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(servingAvailabilityRecords.startsAt))
      .limit(query.limit);
    return rows.map(availabilityFromRow);
  }

  async createAvailability(
    userId: string,
    input: ServingAvailabilityUpsertRequest,
    decide: ServingAvailabilityWriteDecision
  ): Promise<ServingAvailabilityRecord> {
    const row = await this.db.transaction(async (transaction) => {
      await lockServingWriters(transaction, "availability", [userId]);
      const existingRows = await transaction
        .select()
        .from(servingAvailabilityRecords)
        .where(eq(servingAvailabilityRecords.userId, userId))
        .for("update");
      decide({
        userId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        conflictingRecordIds: availabilityConflictIds(existingRows, {
          userId,
          startsAt: input.startsAt,
          endsAt: input.endsAt
        })
      });
      const [created] = await transaction
        .insert(servingAvailabilityRecords)
        .values({
          userId,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          status: input.status,
          note: input.note.trim(),
          updatedAt: new Date()
        })
        .returning();
      return created ?? null;
    }, { isolationLevel: "serializable" });
    if (!row) {
      throw new Error("Failed to create serving availability.");
    }
    return availabilityFromRow(row);
  }

  async listCheckIns(
    query: ServingCheckInListQuery
  ): Promise<ServingCheckInRecord[]> {
    const filters = [
      query.assignmentId
        ? eq(servingCheckIns.assignmentId, query.assignmentId)
        : undefined,
      query.userId ? eq(servingCheckIns.userId, query.userId) : undefined,
      query.status ? eq(servingCheckIns.status, query.status) : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(servingCheckIns)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(servingCheckIns.updatedAt))
      .limit(query.limit);
    return rows.map(checkInFromRow);
  }

  async upsertCheckIn(
    assignmentId: string,
    input: ServingCheckInUpsertRequest,
    decide: ServingCheckInWriteDecision
  ): Promise<ServingCheckInRecord | null> {
    const row = await this.db.transaction(async (transaction) => {
      const [assignment] = await transaction
        .select()
        .from(servingAssignments)
        .where(eq(servingAssignments.id, assignmentId))
        .for("update")
        .limit(1);
      if (!assignment) {
        return null;
      }
      const [existing] = await transaction
        .select()
        .from(servingCheckIns)
        .where(eq(servingCheckIns.assignmentId, assignmentId))
        .for("update")
        .limit(1);
      decide({
        assignment: assignmentScheduleState(assignment),
        current: existing ? checkInFromRow(existing) : null,
        nextStatus: input.status
      });
      const now = new Date();
      const checkedInAt = resolveCheckedInAt(input, existing?.checkedInAt, now);
      const [saved] = await transaction
        .insert(servingCheckIns)
        .values({
          assignmentId,
          userId: assignment.userId,
          status: input.status,
          checkedInAt,
          note: input.note.trim(),
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: servingCheckIns.assignmentId,
          set: {
            userId: assignment.userId,
            status: input.status,
            checkedInAt,
            note: input.note.trim(),
            updatedAt: now
          }
        })
        .returning();
      return saved ?? null;
    });
    return row ? checkInFromRow(row) : null;
  }
}

function resolveCheckedInAt(
  input: ServingCheckInUpsertRequest,
  existing: Date | null | undefined,
  now: Date
) {
  if (input.status !== "checked_in") {
    return null;
  }
  if (input.checkedInAt === undefined || input.checkedInAt === null) {
    return existing ?? now;
  }
  return new Date(input.checkedInAt);
}
