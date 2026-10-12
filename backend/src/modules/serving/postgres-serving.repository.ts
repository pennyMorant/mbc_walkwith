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
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type { AppDb } from "../../shared/db/client.js";
import {
  servingAssignments,
  servingRoles,
  servingTeams
} from "../../shared/db/schema.js";
import type {
  ServingAssignmentWriteDecision,
  ServingAvailabilityWriteDecision,
  ServingCheckInWriteDecision,
  ServingRepository,
  ServingRoleWriteDecision
} from "./serving.repository.js";
import {
  assignmentFromJoinedRow,
  roleFromRow,
  teamFromRow
} from "./postgres_serving_mappers.js";
import { PostgresServingSubresourceRepository } from "./postgres_serving_subresource_repository.js";
import { lockServingWriters } from "./postgres_serving_write_locks.js";
import {
  assignmentConflictIds,
  assignmentScheduleState
} from "./serving_schedule_rules.js";

export class PostgresServingRepository implements ServingRepository {
  private readonly subresources: PostgresServingSubresourceRepository;

  constructor(private readonly db: AppDb) {
    this.subresources = new PostgresServingSubresourceRepository(db);
  }

  async listTeams(query: ServingListQuery): Promise<ServingTeam[]> {
    const rows = await this.db
      .select()
      .from(servingTeams)
      .where(this.teamWhere(query))
      .orderBy(desc(servingTeams.updatedAt))
      .limit(query.limit);
    return rows.map(teamFromRow);
  }

  async getTeamById(teamId: string): Promise<ServingTeam | null> {
    const [row] = await this.db
      .select()
      .from(servingTeams)
      .where(eq(servingTeams.id, teamId))
      .limit(1);
    return row ? teamFromRow(row) : null;
  }

  async createTeam(input: ServingTeamUpsertRequest): Promise<ServingTeam> {
    const [row] = await this.db
      .insert(servingTeams)
      .values({
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        status: input.status,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create serving team.");
    }
    return teamFromRow(row);
  }

  async updateTeam(
    teamId: string,
    input: ServingTeamUpdateRequest
  ): Promise<ServingTeam | null> {
    const existing = await this.getTeamById(teamId);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(servingTeams)
      .set({
        name: input.name?.trim() ?? existing.name,
        description:
          input.description === undefined
            ? existing.description
            : input.description.trim(),
        status: input.status ?? existing.status,
        updatedAt: new Date()
      })
      .where(eq(servingTeams.id, teamId))
      .returning();
    return row ? teamFromRow(row) : null;
  }

  async listRoles(
    query: ServingListQuery & { teamId?: string | undefined }
  ): Promise<ServingRole[]> {
    const filters = [
      query.teamId ? eq(servingRoles.teamId, query.teamId) : undefined,
      query.status ? eq(servingRoles.status, query.status) : undefined,
      query.query
        ? or(
            ilike(servingRoles.name, `%${query.query}%`),
            ilike(servingRoles.description, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(servingRoles)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(servingRoles.updatedAt))
      .limit(query.limit);
    return rows.map(roleFromRow);
  }

  async getRoleById(roleId: string): Promise<ServingRole | null> {
    const [row] = await this.db
      .select()
      .from(servingRoles)
      .where(eq(servingRoles.id, roleId))
      .limit(1);
    return row ? roleFromRow(row) : null;
  }

  async createRole(input: ServingRoleUpsertRequest): Promise<ServingRole> {
    const [row] = await this.db
      .insert(servingRoles)
      .values({
        teamId: input.teamId,
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        status: input.status,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create serving role.");
    }
    return roleFromRow(row);
  }

  async updateRole(
    roleId: string,
    input: ServingRoleUpdateRequest,
    decide: ServingRoleWriteDecision
  ): Promise<ServingRole | null> {
    const row = await this.db.transaction(async (transaction) => {
      await lockServingWriters(transaction, "role", [roleId]);
      const [existing] = await transaction
        .select()
        .from(servingRoles)
        .where(eq(servingRoles.id, roleId))
        .for("update")
        .limit(1);
      if (!existing) {
        return null;
      }
      const nextTeamId = input.teamId ?? existing.teamId;
      const [nextTeam] = await transaction
        .select({ id: servingTeams.id })
        .from(servingTeams)
        .where(eq(servingTeams.id, nextTeamId))
        .for("update")
        .limit(1);
      const assignmentRows = await transaction
        .select({ id: servingAssignments.id })
        .from(servingAssignments)
        .where(eq(servingAssignments.roleId, roleId));
      decide({
        roleId,
        currentTeamId: existing.teamId,
        nextTeamId,
        nextTeamExists: nextTeam !== undefined,
        assignmentIds: assignmentRows.map((assignment) => assignment.id)
      });
      const [updated] = await transaction
        .update(servingRoles)
        .set({
          teamId: nextTeamId,
          name: input.name?.trim() ?? existing.name,
          description:
            input.description === undefined
              ? existing.description
              : input.description.trim(),
          status: input.status ?? existing.status,
          updatedAt: new Date()
        })
        .where(eq(servingRoles.id, roleId))
        .returning();
      return updated ?? null;
    });
    return row ? roleFromRow(row) : null;
  }

  async listAssignments(
    query: ServingAssignmentListQuery
  ): Promise<ServingAssignment[]> {
    const rows = await this.selectAssignments(query);
    return rows.map(assignmentFromJoinedRow);
  }

  async listAssignmentsForUser(userId: string): Promise<ServingAssignment[]> {
    const rows = await this.selectAssignments({ userId, limit: 100 });
    return rows
      .map(assignmentFromJoinedRow)
      .filter((assignment) => assignment.status !== "cancelled");
  }

  async getAssignmentById(
    assignmentId: string
  ): Promise<ServingAssignment | null> {
    const [row] = await this.db
      .select({
        assignment: servingAssignments,
        team: servingTeams,
        role: servingRoles
      })
      .from(servingAssignments)
      .innerJoin(servingTeams, eq(servingAssignments.teamId, servingTeams.id))
      .innerJoin(servingRoles, eq(servingAssignments.roleId, servingRoles.id))
      .where(eq(servingAssignments.id, assignmentId))
      .limit(1);
    return row ? assignmentFromJoinedRow(row) : null;
  }

  async createAssignment(
    input: ServingAssignmentUpsertRequest,
    decide: ServingAssignmentWriteDecision
  ): Promise<ServingAssignment> {
    const assignmentId = randomUUID();
    const rowId = await this.db.transaction(async (transaction) => {
      await lockServingWriters(transaction, "role", [input.roleId]);
      await lockServingWriters(transaction, "assignment", [input.userId]);
      const existingRows = await transaction
        .select()
        .from(servingAssignments)
        .where(eq(servingAssignments.userId, input.userId))
        .for("update");
      const next = assignmentScheduleState({
        id: assignmentId,
        userId: input.userId,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        status: input.status
      });
      const nextRoleTeamId = await selectRoleTeamId(
        transaction,
        input.roleId
      );
      decide({
        current: null,
        next,
        nextTeamId: input.teamId,
        nextRoleId: input.roleId,
        nextRoleTeamId,
        conflictingAssignmentIds: assignmentConflictIds(existingRows, next)
      });
      const [row] = await transaction
        .insert(servingAssignments)
        .values({
          id: assignmentId,
          teamId: input.teamId,
          roleId: input.roleId,
          userId: input.userId,
          memberDisplayName: input.memberDisplayName.trim(),
          memberEmail: input.memberEmail.trim(),
          title: input.title.trim(),
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          location: input.location?.trim() ?? "",
          status: input.status,
          note: input.note?.trim() ?? "",
          updatedAt: new Date()
        })
        .returning({ id: servingAssignments.id });
      return row?.id ?? null;
    }, { isolationLevel: "serializable" });
    if (!rowId) {
      throw new Error("Failed to create serving assignment.");
    }
    const assignment = await this.getAssignmentById(rowId);
    if (!assignment) {
      throw new Error("Failed to reload serving assignment.");
    }
    return assignment;
  }

  async updateAssignment(
    assignmentId: string,
    input: ServingAssignmentUpdateRequest,
    decide: ServingAssignmentWriteDecision
  ): Promise<ServingAssignment | null> {
    const rowId = await this.db.transaction(async (transaction) => {
      await lockServingWriters(transaction, "assignment_record", [
        assignmentId
      ]);
      const [snapshot] = await transaction
        .select()
        .from(servingAssignments)
        .where(eq(servingAssignments.id, assignmentId))
        .limit(1);
      if (!snapshot) {
        return null;
      }
      await lockServingWriters(transaction, "role", [
        snapshot.roleId,
        input.roleId ?? snapshot.roleId
      ]);
      await lockServingWriters(transaction, "assignment", [
        snapshot.userId,
        input.userId ?? snapshot.userId
      ]);
      const [existing] = await transaction
        .select()
        .from(servingAssignments)
        .where(eq(servingAssignments.id, assignmentId))
        .for("update")
        .limit(1);
      if (!existing) {
        return null;
      }
      const next = assignmentScheduleState({
        id: assignmentId,
        userId: input.userId ?? existing.userId,
        startsAt: input.startsAt ?? existing.startsAt,
        endsAt:
          input.endsAt === undefined ? existing.endsAt : input.endsAt,
        status: input.status ?? existing.status
      });
      const existingRows = await transaction
        .select()
        .from(servingAssignments)
        .where(eq(servingAssignments.userId, next.userId))
        .for("update");
      const nextTeamId = input.teamId ?? existing.teamId;
      const nextRoleId = input.roleId ?? existing.roleId;
      const nextRoleTeamId = await selectRoleTeamId(transaction, nextRoleId);
      decide({
        current: assignmentScheduleState(existing),
        next,
        nextTeamId,
        nextRoleId,
        nextRoleTeamId,
        conflictingAssignmentIds: assignmentConflictIds(
          existingRows,
          next,
          assignmentId
        )
      });
      const [row] = await transaction
        .update(servingAssignments)
        .set({
          teamId: nextTeamId,
          roleId: nextRoleId,
          userId: next.userId,
          memberDisplayName:
            input.memberDisplayName?.trim() ?? existing.memberDisplayName,
          memberEmail: input.memberEmail?.trim() ?? existing.memberEmail,
          title: input.title?.trim() ?? existing.title,
          startsAt: new Date(next.startsAt),
          endsAt: next.endsAt ? new Date(next.endsAt) : null,
          location: input.location?.trim() ?? existing.location,
          status: next.status,
          note: input.note?.trim() ?? existing.note,
          responseNote:
            input.responseNote === undefined
              ? existing.responseNote
              : input.responseNote.trim(),
          updatedAt: new Date()
        })
        .where(eq(servingAssignments.id, assignmentId))
        .returning({ id: servingAssignments.id });
      return row?.id ?? null;
    }, { isolationLevel: "serializable" });
    return rowId ? this.getAssignmentById(rowId) : null;
  }

  async listAvailability(
    query: ServingAvailabilityListQuery
  ): Promise<ServingAvailabilityRecord[]> {
    return this.subresources.listAvailability(query);
  }

  async createAvailability(
    userId: string,
    input: ServingAvailabilityUpsertRequest,
    decide: ServingAvailabilityWriteDecision
  ): Promise<ServingAvailabilityRecord> {
    return this.subresources.createAvailability(userId, input, decide);
  }

  async listCheckIns(
    query: ServingCheckInListQuery
  ): Promise<ServingCheckInRecord[]> {
    return this.subresources.listCheckIns(query);
  }

  async upsertCheckIn(
    assignmentId: string,
    input: ServingCheckInUpsertRequest,
    decide: ServingCheckInWriteDecision
  ): Promise<ServingCheckInRecord | null> {
    return this.subresources.upsertCheckIn(assignmentId, input, decide);
  }

  private async selectAssignments(query: ServingAssignmentListQuery) {
    const filters = [
      query.status ? eq(servingAssignments.status, query.status) : undefined,
      query.userId ? eq(servingAssignments.userId, query.userId) : undefined,
      query.query
        ? or(
            ilike(servingAssignments.title, `%${query.query}%`),
            ilike(servingAssignments.memberDisplayName, `%${query.query}%`),
            ilike(servingAssignments.memberEmail, `%${query.query}%`),
            ilike(servingTeams.name, `%${query.query}%`),
            ilike(servingRoles.name, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    return this.db
      .select({
        assignment: servingAssignments,
        team: servingTeams,
        role: servingRoles
      })
      .from(servingAssignments)
      .innerJoin(servingTeams, eq(servingAssignments.teamId, servingTeams.id))
      .innerJoin(servingRoles, eq(servingAssignments.roleId, servingRoles.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(servingAssignments.startsAt))
      .limit(query.limit);
  }

  private teamWhere(query: ServingListQuery) {
    const filters = [
      query.status ? eq(servingTeams.status, query.status) : undefined,
      query.query
        ? or(
            ilike(servingTeams.name, `%${query.query}%`),
            ilike(servingTeams.description, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    return filters.length > 0 ? and(...filters) : undefined;
  }
}

type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

async function selectRoleTeamId(
  transaction: AppTransaction,
  roleId: string
) {
  const [role] = await transaction
    .select({ teamId: servingRoles.teamId })
    .from(servingRoles)
    .where(eq(servingRoles.id, roleId))
    .for("update")
    .limit(1);
  return role?.teamId ?? null;
}
