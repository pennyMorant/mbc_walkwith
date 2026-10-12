import type {
  ServingAssignment,
  ServingAvailabilityRecord,
  ServingCheckInRecord,
  ServingRole,
  ServingTeam
} from "@mbc/api-contracts";

import {
  servingAssignments,
  servingAvailabilityRecords,
  servingCheckIns,
  servingRoles,
  servingTeams
} from "../../shared/db/schema.js";

type TeamRow = typeof servingTeams.$inferSelect;
type RoleRow = typeof servingRoles.$inferSelect;
type AssignmentRow = typeof servingAssignments.$inferSelect;

export function teamFromRow(row: TeamRow): ServingTeam {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function roleFromRow(row: RoleRow): ServingRole {
  return {
    id: row.id,
    teamId: row.teamId,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function assignmentFromJoinedRow(row: {
  assignment: AssignmentRow;
  team: TeamRow;
  role: RoleRow;
}): ServingAssignment {
  return {
    id: row.assignment.id,
    teamId: row.assignment.teamId,
    teamName: row.team.name,
    roleId: row.assignment.roleId,
    roleName: row.role.name,
    userId: row.assignment.userId,
    memberDisplayName: row.assignment.memberDisplayName,
    memberEmail: row.assignment.memberEmail,
    title: row.assignment.title,
    startsAt: row.assignment.startsAt.toISOString(),
    endsAt: row.assignment.endsAt?.toISOString() ?? null,
    location: row.assignment.location,
    status: row.assignment.status,
    note: row.assignment.note,
    responseNote: row.assignment.responseNote,
    createdAt: row.assignment.createdAt.toISOString(),
    updatedAt: row.assignment.updatedAt.toISOString()
  };
}

export function availabilityFromRow(
  row: typeof servingAvailabilityRecords.$inferSelect
): ServingAvailabilityRecord {
  return {
    id: row.id,
    userId: row.userId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function checkInFromRow(
  row: typeof servingCheckIns.$inferSelect
): ServingCheckInRecord {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    userId: row.userId,
    status: row.status,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}
