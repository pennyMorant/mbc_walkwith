import type {
  GroupAttendanceListQuery,
  GroupAttendanceRecord,
  GroupMaterialAssignment,
  GroupMaterialAssignmentCreateRequest,
  GroupMaterialAssignmentListQuery,
  GroupMaterialAssignmentUpdateRequest
} from "@mbc/api-contracts";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  groupAttendanceRecords,
  groupMaterialAssignments,
  groupMemberships
} from "../../shared/db/schema.js";
import {
  attendanceRecordFromRow,
  materialAssignmentFromRow
} from "./postgres_group_mappers.js";
import { groupMembershipFilter } from "./postgres_group_membership_queries.js";
import type { GroupAttendanceUpsertInput } from "./group.repository.js";

export class PostgresGroupActivityStore {
  constructor(private readonly db: AppDb) {}

  async listMaterialAssignments(
    groupId: string,
    query: GroupMaterialAssignmentListQuery
  ): Promise<GroupMaterialAssignment[]> {
    const filters = [
      eq(groupMaterialAssignments.groupId, groupId),
      query.status
        ? eq(groupMaterialAssignments.status, query.status)
        : undefined,
      query.materialType
        ? eq(groupMaterialAssignments.materialType, query.materialType)
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(groupMaterialAssignments)
      .where(and(...filters))
      .orderBy(desc(groupMaterialAssignments.updatedAt))
      .limit(query.limit);
    return rows.map(materialAssignmentFromRow);
  }

  async createMaterialAssignment(
    groupId: string,
    input: GroupMaterialAssignmentCreateRequest
  ): Promise<GroupMaterialAssignment> {
    const [row] = await this.db
      .insert(groupMaterialAssignments)
      .values({
        groupId,
        materialType: input.materialType,
        materialId: input.materialId.trim(),
        title: input.title.trim(),
        status: input.status,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create group material assignment.");
    }
    return materialAssignmentFromRow(row);
  }

  async getMaterialAssignment(
    groupId: string,
    assignmentId: string
  ): Promise<GroupMaterialAssignment | null> {
    const [row] = await this.db
      .select()
      .from(groupMaterialAssignments)
      .where(
        and(
          eq(groupMaterialAssignments.groupId, groupId),
          eq(groupMaterialAssignments.id, assignmentId)
        )
      )
      .limit(1);
    return row ? materialAssignmentFromRow(row) : null;
  }

  async updateMaterialAssignment(
    groupId: string,
    assignmentId: string,
    input: GroupMaterialAssignmentUpdateRequest
  ): Promise<GroupMaterialAssignment | null> {
    const [existing] = await this.db
      .select()
      .from(groupMaterialAssignments)
      .where(
        and(
          eq(groupMaterialAssignments.groupId, groupId),
          eq(groupMaterialAssignments.id, assignmentId)
        )
      )
      .limit(1);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(groupMaterialAssignments)
      .set({
        materialType: input.materialType ?? existing.materialType,
        materialId:
          input.materialId === undefined
            ? existing.materialId
            : input.materialId.trim(),
        title: input.title === undefined ? existing.title : input.title.trim(),
        status: input.status ?? existing.status,
        dueAt:
          input.dueAt === undefined
            ? existing.dueAt
            : input.dueAt
              ? new Date(input.dueAt)
              : null,
        updatedAt: new Date()
      })
      .where(eq(groupMaterialAssignments.id, assignmentId))
      .returning();
    return row ? materialAssignmentFromRow(row) : null;
  }

  async listAttendanceRecords(
    groupId: string,
    query: GroupAttendanceListQuery
  ): Promise<GroupAttendanceRecord[]> {
    const filters = [
      eq(groupAttendanceRecords.groupId, groupId),
      query.from
        ? gte(groupAttendanceRecords.meetingDate, new Date(query.from))
        : undefined,
      query.to
        ? lte(groupAttendanceRecords.meetingDate, new Date(query.to))
        : undefined,
      query.status ? eq(groupAttendanceRecords.status, query.status) : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(groupAttendanceRecords)
      .where(and(...filters))
      .orderBy(desc(groupAttendanceRecords.meetingDate))
      .limit(query.limit);
    return rows.map(attendanceRecordFromRow);
  }

  async upsertAttendanceRecord(
    groupId: string,
    input: GroupAttendanceUpsertInput
  ): Promise<GroupAttendanceRecord | null> {
    return this.db.transaction(async (transaction) => {
      const memberUserId = input.memberUserId.trim();
      const [membership] = await transaction
        .select({ status: groupMemberships.status })
        .from(groupMemberships)
        .where(groupMembershipFilter(groupId, memberUserId))
        .for("update")
        .limit(1);
      if (
        !membership ||
        (membership.status !== "active" && membership.status !== "leader")
      ) {
        return null;
      }
      const meetingDate = new Date(input.meetingDate);
      const [row] = await transaction
        .insert(groupAttendanceRecords)
        .values({
          groupId,
          meetingDate,
          memberUserId,
          memberDisplayName: input.memberDisplayName.trim(),
          status: input.status,
          note: input.note.trim(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [
            groupAttendanceRecords.groupId,
            groupAttendanceRecords.meetingDate,
            groupAttendanceRecords.memberUserId
          ],
          set: {
            memberDisplayName: input.memberDisplayName.trim(),
            status: input.status,
            note: input.note.trim(),
            updatedAt: new Date()
          }
        })
        .returning();
      if (!row) {
        throw new Error("Failed to upsert group attendance record.");
      }
      return attendanceRecordFromRow(row);
    });
  }
}
