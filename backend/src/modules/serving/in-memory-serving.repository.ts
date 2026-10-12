import type {
  ServingAssignment,
  ServingAssignmentListQuery,
  ServingAssignmentUpdateRequest,
  ServingAssignmentUpsertRequest,
  ServingAvailabilityListQuery,
  ServingAvailabilityRecord,
  ServingAvailabilityUpsertRequest,
  ServingCheckInListQuery,
  ServingCheckInRecord,
  ServingCheckInUpsertRequest,
  ServingListQuery,
  ServingRole,
  ServingRoleUpdateRequest,
  ServingRoleUpsertRequest,
  ServingTeam,
  ServingTeamUpdateRequest,
  ServingTeamUpsertRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  ServingAssignmentWriteDecision,
  ServingAvailabilityWriteDecision,
  ServingCheckInWriteDecision,
  ServingRepository,
  ServingRoleWriteDecision
} from "./serving.repository.js";
import {
  assignmentConflictIds,
  assignmentScheduleState,
  availabilityConflictIds
} from "./serving_schedule_rules.js";

export class InMemoryServingRepository implements ServingRepository {
  private teams = new Map<string, ServingTeam>(
    seedTeams.map((team) => [team.id, team])
  );
  private roles = new Map<string, ServingRole>(
    seedRoles.map((role) => [role.id, role])
  );
  private assignments = new Map<string, ServingAssignment>(
    seedAssignments.map((assignment) => [assignment.id, assignment])
  );
  private availability = new Map<string, ServingAvailabilityRecord>();
  private checkIns = new Map<string, ServingCheckInRecord>();

  async listTeams(query: ServingListQuery): Promise<ServingTeam[]> {
    return this.filterTeams(query).slice(0, query.limit);
  }

  async getTeamById(teamId: string): Promise<ServingTeam | null> {
    return this.teams.get(teamId) ?? null;
  }

  async createTeam(input: ServingTeamUpsertRequest): Promise<ServingTeam> {
    const now = new Date().toISOString();
    const team: ServingTeam = {
      id: randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      status: input.status,
      createdAt: now,
      updatedAt: now
    };
    this.teams.set(team.id, team);
    return team;
  }

  async updateTeam(
    teamId: string,
    input: ServingTeamUpdateRequest
  ): Promise<ServingTeam | null> {
    const existing = this.teams.get(teamId);
    if (!existing) {
      return null;
    }
    const updated: ServingTeam = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      description:
        input.description === undefined
          ? existing.description
          : input.description.trim(),
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString()
    };
    this.teams.set(teamId, updated);
    return updated;
  }

  async listRoles(
    query: ServingListQuery & { teamId?: string | undefined }
  ): Promise<ServingRole[]> {
    return this.filterRoles(query).slice(0, query.limit);
  }

  async getRoleById(roleId: string): Promise<ServingRole | null> {
    return this.roles.get(roleId) ?? null;
  }

  async createRole(input: ServingRoleUpsertRequest): Promise<ServingRole> {
    const now = new Date().toISOString();
    const role: ServingRole = {
      id: randomUUID(),
      teamId: input.teamId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      status: input.status,
      createdAt: now,
      updatedAt: now
    };
    this.roles.set(role.id, role);
    return role;
  }

  async updateRole(
    roleId: string,
    input: ServingRoleUpdateRequest,
    decide: ServingRoleWriteDecision
  ): Promise<ServingRole | null> {
    const existing = this.roles.get(roleId);
    if (!existing) {
      return null;
    }
    const nextTeamId = input.teamId ?? existing.teamId;
    decide({
      roleId,
      currentTeamId: existing.teamId,
      nextTeamId,
      nextTeamExists: this.teams.has(nextTeamId),
      assignmentIds: [...this.assignments.values()]
        .filter((assignment) => assignment.roleId === roleId)
        .map((assignment) => assignment.id)
    });
    const updated: ServingRole = {
      ...existing,
      teamId: nextTeamId,
      name: input.name?.trim() ?? existing.name,
      description:
        input.description === undefined
          ? existing.description
          : input.description.trim(),
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString()
    };
    this.roles.set(roleId, updated);
    return updated;
  }

  async listAssignments(
    query: ServingAssignmentListQuery
  ): Promise<ServingAssignment[]> {
    return this.filterAssignments(query).slice(0, query.limit);
  }

  async listAssignmentsForUser(userId: string): Promise<ServingAssignment[]> {
    return this.filterAssignments({ userId, limit: 100 }).filter(
      (assignment) => assignment.status !== "cancelled"
    );
  }

  async getAssignmentById(
    assignmentId: string
  ): Promise<ServingAssignment | null> {
    return this.assignments.get(assignmentId) ?? null;
  }

  async createAssignment(
    input: ServingAssignmentUpsertRequest,
    decide: ServingAssignmentWriteDecision
  ): Promise<ServingAssignment> {
    const now = new Date().toISOString();
    const assignment = this.assignmentFromInput(randomUUID(), input, now, now);
    decide(this.assignmentWriteContext(null, assignment));
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  async updateAssignment(
    assignmentId: string,
    input: ServingAssignmentUpdateRequest,
    decide: ServingAssignmentWriteDecision
  ): Promise<ServingAssignment | null> {
    const existing = this.assignments.get(assignmentId);
    if (!existing) {
      return null;
    }
    const merged = {
      teamId: input.teamId ?? existing.teamId,
      roleId: input.roleId ?? existing.roleId,
      userId: input.userId ?? existing.userId,
      memberDisplayName:
        input.memberDisplayName ?? existing.memberDisplayName,
      memberEmail: input.memberEmail ?? existing.memberEmail,
      title: input.title ?? existing.title,
      startsAt: input.startsAt ?? existing.startsAt,
      endsAt: input.endsAt === undefined ? existing.endsAt : input.endsAt,
      location: input.location ?? existing.location,
      status: input.status ?? existing.status,
      note: input.note ?? existing.note
    };
    const updated: ServingAssignment = {
      ...this.assignmentFromInput(
        assignmentId,
        merged,
        existing.createdAt,
        new Date().toISOString()
      ),
      responseNote:
        input.responseNote === undefined
          ? existing.responseNote
          : input.responseNote.trim()
    };
    decide(this.assignmentWriteContext(existing, updated));
    this.assignments.set(assignmentId, updated);
    return updated;
  }

  async listAvailability(
    query: ServingAvailabilityListQuery
  ): Promise<ServingAvailabilityRecord[]> {
    const from = query.from ? new Date(query.from).getTime() : null;
    const to = query.to ? new Date(query.to).getTime() : null;
    return [...this.availability.values()]
      .filter((record) => {
        if (query.userId && record.userId !== query.userId) {
          return false;
        }
        if (query.status && record.status !== query.status) {
          return false;
        }
        const startsAt = new Date(record.startsAt).getTime();
        if (from !== null && startsAt < from) {
          return false;
        }
        if (to !== null && startsAt > to) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, query.limit);
  }

  async createAvailability(
    userId: string,
    input: ServingAvailabilityUpsertRequest,
    decide: ServingAvailabilityWriteDecision
  ): Promise<ServingAvailabilityRecord> {
    const now = new Date().toISOString();
    const record: ServingAvailabilityRecord = {
      id: randomUUID(),
      userId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,
      note: input.note.trim(),
      createdAt: now,
      updatedAt: now
    };
    decide({
      userId,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      conflictingRecordIds: availabilityConflictIds(
        [...this.availability.values()],
        record
      )
    });
    this.availability.set(record.id, record);
    return record;
  }

  async listCheckIns(
    query: ServingCheckInListQuery
  ): Promise<ServingCheckInRecord[]> {
    return [...this.checkIns.values()]
      .filter((record) => {
        if (query.assignmentId && record.assignmentId !== query.assignmentId) {
          return false;
        }
        if (query.userId && record.userId !== query.userId) {
          return false;
        }
        if (query.status && record.status !== query.status) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async upsertCheckIn(
    assignmentId: string,
    input: ServingCheckInUpsertRequest,
    decide: ServingCheckInWriteDecision
  ): Promise<ServingCheckInRecord | null> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      return null;
    }
    const existing = this.checkIns.get(assignmentId);
    decide({
      assignment: assignmentScheduleState(assignment),
      current: existing ?? null,
      nextStatus: input.status
    });
    const now = new Date().toISOString();
    const record: ServingCheckInRecord = {
      id: existing?.id ?? randomUUID(),
      assignmentId,
      userId: assignment.userId,
      status: input.status,
      checkedInAt:
        input.status === "checked_in"
          ? input.checkedInAt === undefined || input.checkedInAt === null
            ? (existing?.checkedInAt ?? now)
            : input.checkedInAt
          : null,
      note: input.note.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    this.checkIns.set(assignmentId, record);
    return record;
  }

  private filterTeams(query: ServingListQuery) {
    const needle = query.query?.trim().toLowerCase();
    return [...this.teams.values()]
      .filter((team) => {
        if (query.status && team.status !== query.status) {
          return false;
        }
        return needle
          ? [team.name, team.description].join(" ").toLowerCase().includes(needle)
          : true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private filterRoles(query: ServingListQuery & { teamId?: string | undefined }) {
    const needle = query.query?.trim().toLowerCase();
    return [...this.roles.values()]
      .filter((role) => {
        if (query.teamId && role.teamId !== query.teamId) {
          return false;
        }
        if (query.status && role.status !== query.status) {
          return false;
        }
        return needle
          ? [role.name, role.description].join(" ").toLowerCase().includes(needle)
          : true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private filterAssignments(query: ServingAssignmentListQuery) {
    const needle = query.query?.trim().toLowerCase();
    return [...this.assignments.values()]
      .filter((assignment) => {
        if (query.status && assignment.status !== query.status) {
          return false;
        }
        if (query.userId && assignment.userId !== query.userId) {
          return false;
        }
        return needle
          ? [
              assignment.title,
              assignment.teamName,
              assignment.roleName,
              assignment.memberDisplayName,
              assignment.memberEmail
            ]
              .join(" ")
              .toLowerCase()
              .includes(needle)
          : true;
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  private assignmentWriteContext(
    current: ServingAssignment | null,
    next: ServingAssignment
  ) {
    const nextState = assignmentScheduleState(next);
    return {
      current: current ? assignmentScheduleState(current) : null,
      next: nextState,
      nextTeamId: next.teamId,
      nextRoleId: next.roleId,
      nextRoleTeamId: this.roles.get(next.roleId)?.teamId ?? null,
      conflictingAssignmentIds: assignmentConflictIds(
        [...this.assignments.values()],
        nextState,
        next.id
      )
    };
  }

  private assignmentFromInput(
    id: string,
    input: ServingAssignmentUpsertRequest,
    createdAt: string,
    updatedAt: string
  ): ServingAssignment {
    const team = this.teams.get(input.teamId);
    const role = this.roles.get(input.roleId);
    return {
      id,
      teamId: input.teamId,
      teamName: team?.name ?? "",
      roleId: input.roleId,
      roleName: role?.name ?? "",
      userId: input.userId,
      memberDisplayName: input.memberDisplayName.trim(),
      memberEmail: input.memberEmail.trim(),
      title: input.title.trim(),
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      location: input.location?.trim() ?? "",
      status: input.status,
      note: input.note?.trim() ?? "",
      responseNote: "",
      createdAt,
      updatedAt
    };
  }
}

const seedTeams: ServingTeam[] = [
  {
    id: "hospitality-team",
    name: "Hospitality",
    description: "Welcome and ushering team.",
    status: "active",
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  }
];

const seedRoles: ServingRole[] = [
  {
    id: "usher-role",
    teamId: "hospitality-team",
    name: "Usher",
    description: "Welcome people and help with seating.",
    status: "active",
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  }
];

const seedAssignments: ServingAssignment[] = [
  {
    id: "usher-assignment",
    teamId: "hospitality-team",
    teamName: "Hospitality",
    roleId: "usher-role",
    roleName: "Usher",
    userId: "member-lee",
    memberDisplayName: "Alex Lee",
    memberEmail: "alex.lee@example.com",
    title: "Sunday worship usher",
    startsAt: "2026-06-28T16:30:00.000Z",
    endsAt: "2026-06-28T18:30:00.000Z",
    location: "Main Sanctuary",
    status: "scheduled",
    note: "",
    responseNote: "",
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  }
];
