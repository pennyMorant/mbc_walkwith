import type {
  DiscipleshipAssignment,
  DiscipleshipAssignmentCreateRequest,
  DiscipleshipAssignmentListQuery,
  DiscipleshipJourney,
  DiscipleshipJourneyCreateRequest,
  DiscipleshipJourneyListQuery,
  DiscipleshipJourneyUpdateRequest,
  DiscipleshipStage,
  DiscipleshipStageCreateRequest,
  DiscipleshipTask,
  DiscipleshipTaskCreateRequest,
  DiscipleshipTaskProgress,
  DiscipleshipTaskProgressUpdateRequest
} from "@mbc/api-contracts";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  discipleshipAssignments,
  discipleshipJourneys,
  discipleshipStages,
  discipleshipTaskProgress,
  discipleshipTasks
} from "../../shared/db/schema.js";
import type { DiscipleshipRepository } from "./discipleship.repository.js";
import { resolveAssignmentStateAfterProgress } from "./discipleship_status_rules.js";

export class PostgresDiscipleshipRepository
  implements DiscipleshipRepository
{
  constructor(private readonly db: AppDb) {}

  async listJourneys(
    query: DiscipleshipJourneyListQuery
  ): Promise<DiscipleshipJourney[]> {
    const filters = [
      query.status ? eq(discipleshipJourneys.status, query.status) : undefined,
      query.query
        ? or(
            ilike(discipleshipJourneys.title, `%${query.query}%`),
            ilike(discipleshipJourneys.description, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(discipleshipJourneys)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(discipleshipJourneys.updatedAt))
      .limit(query.limit);
    return rows.map(journeyFromRow);
  }

  async getJourneyById(id: string): Promise<DiscipleshipJourney | null> {
    const [row] = await this.db
      .select()
      .from(discipleshipJourneys)
      .where(eq(discipleshipJourneys.id, id))
      .limit(1);
    return row ? journeyFromRow(row) : null;
  }

  async createJourney(
    input: DiscipleshipJourneyCreateRequest
  ): Promise<DiscipleshipJourney> {
    const [row] = await this.db
      .insert(discipleshipJourneys)
      .values({
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create discipleship journey.");
    }
    return journeyFromRow(row);
  }

  async updateJourney(
    id: string,
    input: DiscipleshipJourneyUpdateRequest
  ): Promise<DiscipleshipJourney | null> {
    const existing = await this.getJourneyById(id);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(discipleshipJourneys)
      .set({
        title: input.title === undefined ? existing.title : input.title.trim(),
        description:
          input.description === undefined
            ? existing.description
            : input.description.trim(),
        status: input.status ?? existing.status,
        updatedAt: new Date()
      })
      .where(eq(discipleshipJourneys.id, id))
      .returning();
    return row ? journeyFromRow(row) : null;
  }

  async createStage(
    journeyId: string,
    input: DiscipleshipStageCreateRequest
  ): Promise<DiscipleshipStage> {
    const [row] = await this.db
      .insert(discipleshipStages)
      .values({
        journeyId,
        title: input.title.trim(),
        description: input.description.trim(),
        sortOrder: input.sortOrder,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create discipleship stage.");
    }
    return stageFromRow(row);
  }

  async getStageById(id: string): Promise<DiscipleshipStage | null> {
    const [row] = await this.db
      .select()
      .from(discipleshipStages)
      .where(eq(discipleshipStages.id, id))
      .limit(1);
    return row ? stageFromRow(row) : null;
  }

  async listStagesForJourney(journeyId: string): Promise<DiscipleshipStage[]> {
    const rows = await this.db
      .select()
      .from(discipleshipStages)
      .where(eq(discipleshipStages.journeyId, journeyId))
      .orderBy(asc(discipleshipStages.sortOrder), asc(discipleshipStages.createdAt));
    return rows.map(stageFromRow);
  }

  async createTask(
    journeyId: string,
    input: DiscipleshipTaskCreateRequest
  ): Promise<DiscipleshipTask> {
    const [row] = await this.db
      .insert(discipleshipTasks)
      .values({
        journeyId,
        stageId: input.stageId ?? null,
        title: input.title.trim(),
        description: input.description.trim(),
        referenceType: input.referenceType,
        referenceId: input.referenceId.trim(),
        required: input.required,
        sortOrder: input.sortOrder,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create discipleship task.");
    }
    return taskFromRow(row);
  }

  async getTaskById(id: string): Promise<DiscipleshipTask | null> {
    const [row] = await this.db
      .select()
      .from(discipleshipTasks)
      .where(eq(discipleshipTasks.id, id))
      .limit(1);
    return row ? taskFromRow(row) : null;
  }

  async listTasksForJourney(journeyId: string): Promise<DiscipleshipTask[]> {
    const rows = await this.db
      .select()
      .from(discipleshipTasks)
      .where(eq(discipleshipTasks.journeyId, journeyId))
      .orderBy(asc(discipleshipTasks.sortOrder), asc(discipleshipTasks.createdAt));
    return rows.map(taskFromRow);
  }

  async listAssignments(
    query: DiscipleshipAssignmentListQuery
  ): Promise<DiscipleshipAssignment[]> {
    const filters = [
      query.status
        ? eq(discipleshipAssignments.status, query.status)
        : undefined,
      query.userId ? eq(discipleshipAssignments.userId, query.userId) : undefined,
      query.journeyId
        ? eq(discipleshipAssignments.journeyId, query.journeyId)
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(discipleshipAssignments)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(discipleshipAssignments.updatedAt))
      .limit(query.limit);
    return Promise.all(rows.map((row) => this.assignmentFromRow(row)));
  }

  listAssignmentsForUser(userId: string): Promise<DiscipleshipAssignment[]> {
    return this.listAssignments({ userId, limit: 100 });
  }

  async getAssignmentById(
    id: string
  ): Promise<DiscipleshipAssignment | null> {
    const [row] = await this.db
      .select()
      .from(discipleshipAssignments)
      .where(eq(discipleshipAssignments.id, id))
      .limit(1);
    return row ? this.assignmentFromRow(row) : null;
  }

  async createAssignment(
    input: DiscipleshipAssignmentCreateRequest
  ): Promise<DiscipleshipAssignment> {
    const [row] = await this.db
      .insert(discipleshipAssignments)
      .values({
        journeyId: input.journeyId,
        userId: input.userId.trim(),
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        assigneeAdminUserId: input.assigneeAdminUserId ?? null,
        assigneeName: input.assigneeName.trim(),
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create discipleship assignment.");
    }
    return this.assignmentFromRow(row);
  }

  async upsertTaskProgress(
    assignmentId: string,
    taskId: string,
    input: DiscipleshipTaskProgressUpdateRequest
  ): Promise<DiscipleshipTaskProgress> {
    const now = new Date();
    const completedAt = input.status === "completed" ? now : null;
    const [row] = await this.db
      .insert(discipleshipTaskProgress)
      .values({
        assignmentId,
        taskId,
        status: input.status,
        note: input.note.trim(),
        completedAt,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [
          discipleshipTaskProgress.assignmentId,
          discipleshipTaskProgress.taskId
        ],
        set: {
          status: input.status,
          note: input.note.trim(),
          completedAt,
          updatedAt: now
        }
      })
      .returning();
    if (!row) {
      throw new Error("Failed to update discipleship task progress.");
    }
    const assignment = await this.getAssignmentById(assignmentId);
    if (assignment) {
      const state = resolveAssignmentStateAfterProgress({
        current: {
          status: assignment.status,
          startedAt: assignment.startedAt,
          completedAt: assignment.completedAt
        },
        taskTotalCount: assignment.taskTotalCount,
        completedTaskCount: assignment.completedTaskCount,
        now: now.toISOString()
      });
      await this.db
        .update(discipleshipAssignments)
        .set({
          status: state.status,
          startedAt: state.startedAt ? new Date(state.startedAt) : null,
          completedAt: state.completedAt ? new Date(state.completedAt) : null,
          updatedAt: now
        })
        .where(eq(discipleshipAssignments.id, assignmentId));
    } else {
      await this.db
        .update(discipleshipAssignments)
        .set({ updatedAt: now })
        .where(eq(discipleshipAssignments.id, assignmentId));
    }
    return progressFromRow(row);
  }

  private async assignmentFromRow(
    row: typeof discipleshipAssignments.$inferSelect
  ): Promise<DiscipleshipAssignment> {
    const progress = await this.progressForAssignment(row.id);
    return {
      id: row.id,
      journeyId: row.journeyId,
      userId: row.userId,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      assigneeAdminUserId: row.assigneeAdminUserId,
      assigneeName: row.assigneeName,
      status: row.status,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      taskTotalCount: await this.taskCountForJourney(row.journeyId),
      completedTaskCount: progress.filter(
        (item) => item.status === "completed"
      ).length,
      progress,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }

  private async taskCountForJourney(journeyId: string) {
    const [row] = await this.db
      .select({ value: count() })
      .from(discipleshipTasks)
      .where(eq(discipleshipTasks.journeyId, journeyId));
    return Number(row?.value ?? 0);
  }

  private async progressForAssignment(assignmentId: string) {
    const rows = await this.db
      .select()
      .from(discipleshipTaskProgress)
      .where(eq(discipleshipTaskProgress.assignmentId, assignmentId));
    return rows.map(progressFromRow);
  }
}

function journeyFromRow(
  row: typeof discipleshipJourneys.$inferSelect
): DiscipleshipJourney {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function stageFromRow(
  row: typeof discipleshipStages.$inferSelect
): DiscipleshipStage {
  return {
    id: row.id,
    journeyId: row.journeyId,
    title: row.title,
    description: row.description,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function taskFromRow(
  row: typeof discipleshipTasks.$inferSelect
): DiscipleshipTask {
  return {
    id: row.id,
    journeyId: row.journeyId,
    stageId: row.stageId,
    title: row.title,
    description: row.description,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    required: row.required,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function progressFromRow(
  row: typeof discipleshipTaskProgress.$inferSelect
): DiscipleshipTaskProgress {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    taskId: row.taskId,
    status: row.status,
    note: row.note,
    completedAt: row.completedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString()
  };
}
