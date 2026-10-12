import type {
  GroupApplication,
  GroupAttendanceRecord,
  GroupMaterialAssignment
} from "@mbc/api-contracts";

import {
  groupApplications,
  groupAttendanceRecords,
  groupMaterialAssignments
} from "../../shared/db/schema.js";

type GroupApplicationRow = typeof groupApplications.$inferSelect;

export function applicationFromRow(row: GroupApplicationRow): GroupApplication {
  return {
    id: row.id,
    groupId: row.groupId,
    userId: row.userId,
    memberDisplayName: row.memberDisplayName,
    memberEmail: row.memberEmail,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function materialAssignmentFromRow(
  row: typeof groupMaterialAssignments.$inferSelect
): GroupMaterialAssignment {
  return {
    id: row.id,
    groupId: row.groupId,
    materialType: row.materialType,
    materialId: row.materialId,
    title: row.title,
    status: row.status,
    dueAt: row.dueAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function attendanceRecordFromRow(
  row: typeof groupAttendanceRecords.$inferSelect
): GroupAttendanceRecord {
  return {
    id: row.id,
    groupId: row.groupId,
    meetingDate: row.meetingDate.toISOString(),
    memberUserId: row.memberUserId,
    memberDisplayName: row.memberDisplayName,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}
