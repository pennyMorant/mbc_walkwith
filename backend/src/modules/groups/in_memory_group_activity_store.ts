import type {
  GroupAttendanceListQuery,
  GroupAttendanceRecord,
  GroupMaterialAssignment,
  GroupMaterialAssignmentCreateRequest,
  GroupMaterialAssignmentListQuery,
  GroupMaterialAssignmentUpdateRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import { attendanceKey, membershipKey } from "./in_memory_group_keys.js";
import type { InMemoryGroupMembership } from "./in_memory_group_seed.js";
import type { GroupAttendanceUpsertInput } from "./group.repository.js";

export class InMemoryGroupActivityStore {
  private readonly materialAssignments = new Map<
    string,
    GroupMaterialAssignment
  >();
  private readonly attendanceRecords = new Map<string, GroupAttendanceRecord>();

  constructor(
    private readonly memberships: Map<string, InMemoryGroupMembership>
  ) {}

  async listMaterialAssignments(
    groupId: string,
    query: GroupMaterialAssignmentListQuery
  ): Promise<GroupMaterialAssignment[]> {
    return [...this.materialAssignments.values()]
      .filter((assignment) => {
        if (assignment.groupId !== groupId) {
          return false;
        }
        if (query.status && assignment.status !== query.status) {
          return false;
        }
        return !query.materialType || assignment.materialType === query.materialType;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async createMaterialAssignment(
    groupId: string,
    input: GroupMaterialAssignmentCreateRequest
  ): Promise<GroupMaterialAssignment> {
    const now = new Date().toISOString();
    const assignment: GroupMaterialAssignment = {
      id: randomUUID(),
      groupId,
      materialType: input.materialType,
      materialId: input.materialId.trim(),
      title: input.title.trim(),
      status: input.status,
      dueAt: input.dueAt ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.materialAssignments.set(assignment.id, assignment);
    return assignment;
  }

  async getMaterialAssignment(
    groupId: string,
    assignmentId: string
  ): Promise<GroupMaterialAssignment | null> {
    const assignment = this.materialAssignments.get(assignmentId);
    return assignment?.groupId === groupId ? assignment : null;
  }

  async updateMaterialAssignment(
    groupId: string,
    assignmentId: string,
    input: GroupMaterialAssignmentUpdateRequest
  ): Promise<GroupMaterialAssignment | null> {
    const existing = this.materialAssignments.get(assignmentId);
    if (!existing || existing.groupId !== groupId) {
      return null;
    }
    const updated: GroupMaterialAssignment = {
      ...existing,
      materialType: input.materialType ?? existing.materialType,
      materialId:
        input.materialId === undefined
          ? existing.materialId
          : input.materialId.trim(),
      title: input.title === undefined ? existing.title : input.title.trim(),
      status: input.status ?? existing.status,
      dueAt: input.dueAt === undefined ? existing.dueAt : (input.dueAt ?? null),
      updatedAt: new Date().toISOString()
    };
    this.materialAssignments.set(assignmentId, updated);
    return updated;
  }

  async listAttendanceRecords(
    groupId: string,
    query: GroupAttendanceListQuery
  ): Promise<GroupAttendanceRecord[]> {
    const from = query.from ? new Date(query.from).getTime() : null;
    const to = query.to ? new Date(query.to).getTime() : null;
    return [...this.attendanceRecords.values()]
      .filter((record) => {
        if (record.groupId !== groupId) {
          return false;
        }
        const meetingTime = new Date(record.meetingDate).getTime();
        if (from !== null && meetingTime < from) {
          return false;
        }
        if (to !== null && meetingTime > to) {
          return false;
        }
        return !query.status || record.status === query.status;
      })
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
      .slice(0, query.limit);
  }

  async upsertAttendanceRecord(
    groupId: string,
    input: GroupAttendanceUpsertInput
  ): Promise<GroupAttendanceRecord | null> {
    const memberUserId = input.memberUserId.trim();
    const membership = this.memberships.get(
      membershipKey(groupId, memberUserId)
    );
    if (
      !membership ||
      (membership.status !== "active" && membership.status !== "leader")
    ) {
      return null;
    }
    const key = attendanceKey(groupId, input.meetingDate, memberUserId);
    const existing = this.attendanceRecords.get(key);
    const now = new Date().toISOString();
    const record: GroupAttendanceRecord = {
      id: existing?.id ?? randomUUID(),
      groupId,
      meetingDate: input.meetingDate,
      memberUserId,
      memberDisplayName: input.memberDisplayName.trim(),
      status: input.status,
      note: input.note.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    this.attendanceRecords.set(key, record);
    return record;
  }
}
