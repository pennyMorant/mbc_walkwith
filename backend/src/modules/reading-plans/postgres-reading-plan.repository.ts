import type {
  ReadingPlan,
  ReadingPlanAssignment,
  ReadingPlanAssignmentListQuery,
  ReadingPlanAssignmentScope,
  ReadingPlanAssignmentStatus,
  ReadingPlanCreateRequest,
  ReadingPlanDay,
  ReadingPlanDayProgress,
  ReadingPlanDayProgressUpdateRequest,
  ReadingPlanDayUpsertRequest,
  ReadingPlanListQuery,
  ReadingPlanUpdateRequest
} from "@mbc/api-contracts";
import { scriptureReferenceSchema } from "@mbc/api-contracts";
import { and, desc, eq, ilike, inArray, max, notInArray, or } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  readingPlanAssignments,
  readingPlanDayProgress,
  readingPlanDays,
  readingPlans
} from "../../shared/db/schema.js";
import type {
  ReadingPlanAssignmentCreateInput,
  ReadingPlanAssignmentPage,
  ReadingPlanDayProgressWriteResult,
  ReadingPlanRepository,
  ReadingPlanViewer
} from "./reading-plan.repository.js";
import {
  isReadingPlanProgressWritable,
  resolveReadingPlanAssignmentStateAfterProgress
} from "./reading_plan_status_rules.js";

export class PostgresReadingPlanRepository
  implements ReadingPlanRepository
{
  constructor(private readonly db: AppDb) {}

  async listPlans(query: ReadingPlanListQuery): Promise<ReadingPlan[]> {
    const filters = [
      query.status ? eq(readingPlans.status, query.status) : undefined,
      query.visibility
        ? eq(readingPlans.visibility, query.visibility)
        : undefined,
      query.locale ? eq(readingPlans.locale, query.locale) : undefined,
      query.query
        ? or(
            ilike(readingPlans.title, `%${query.query}%`),
            ilike(readingPlans.description, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(readingPlans)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(readingPlans.updatedAt))
      .limit(query.limit);
    return rows.map(planFromRow);
  }

  async getPlanById(id: string): Promise<ReadingPlan | null> {
    const [row] = await this.db
      .select()
      .from(readingPlans)
      .where(eq(readingPlans.id, id))
      .limit(1);
    return row ? planFromRow(row) : null;
  }

  async createPlan(input: ReadingPlanCreateRequest): Promise<ReadingPlan> {
    const [row] = await this.db
      .insert(readingPlans)
      .values({
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status,
        visibility: input.visibility,
        locale: input.locale.trim(),
        durationDays: input.durationDays,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create reading plan.");
    }
    return planFromRow(row);
  }

  async updatePlan(
    id: string,
    input: ReadingPlanUpdateRequest
  ): Promise<ReadingPlan | null> {
    const existing = await this.getPlanById(id);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(readingPlans)
      .set({
        title: input.title === undefined ? existing.title : input.title.trim(),
        description:
          input.description === undefined
            ? existing.description
            : input.description.trim(),
        status: input.status ?? existing.status,
        visibility: input.visibility ?? existing.visibility,
        locale:
          input.locale === undefined ? existing.locale : input.locale.trim(),
        durationDays: input.durationDays ?? existing.durationDays,
        updatedAt: new Date()
      })
      .where(eq(readingPlans.id, id))
      .returning();
    return row ? planFromRow(row) : null;
  }

  async listDays(planId: string): Promise<ReadingPlanDay[]> {
    const rows = await this.db
      .select()
      .from(readingPlanDays)
      .where(eq(readingPlanDays.planId, planId))
      .orderBy(readingPlanDays.dayNumber);
    return rows.map(dayFromRow);
  }

  async getDayById(dayId: string): Promise<ReadingPlanDay | null> {
    const [row] = await this.db
      .select()
      .from(readingPlanDays)
      .where(eq(readingPlanDays.id, dayId))
      .limit(1);
    return row ? dayFromRow(row) : null;
  }

  async upsertDay(
    planId: string,
    input: ReadingPlanDayUpsertRequest
  ): Promise<ReadingPlanDay> {
    const now = new Date();
    const [row] = await this.db
      .insert(readingPlanDays)
      .values({
        planId,
        dayNumber: input.dayNumber,
        title: input.title.trim(),
        description: input.description.trim(),
        references: input.references,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [readingPlanDays.planId, readingPlanDays.dayNumber],
        set: {
          title: input.title.trim(),
          description: input.description.trim(),
          references: input.references,
          updatedAt: now
        }
      })
      .returning();
    if (!row) {
      throw new Error("Failed to upsert reading plan day.");
    }
    return dayFromRow(row);
  }

  async listAssignments(
    query: ReadingPlanAssignmentListQuery
  ): Promise<ReadingPlanAssignment[]> {
    const filters = [
      query.planId
        ? eq(readingPlanAssignments.planId, query.planId)
        : undefined,
      query.userType
        ? eq(readingPlanAssignments.userType, query.userType)
        : undefined,
      query.userId ? eq(readingPlanAssignments.userId, query.userId) : undefined,
      query.status
        ? eq(readingPlanAssignments.status, query.status)
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(readingPlanAssignments)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(readingPlanAssignments.updatedAt))
      .limit(query.limit);
    return Promise.all(rows.map((row) => this.assignmentFromRow(row)));
  }

  listAssignmentsForViewer(
    viewer: ReadingPlanViewer,
    input: {
      scope: ReadingPlanAssignmentScope;
      limit: number;
      cursor: number;
    }
  ): Promise<ReadingPlanAssignmentPage> {
    return this.listAssignmentPageForViewer(viewer, input);
  }

  async getAssignmentById(
    id: string
  ): Promise<ReadingPlanAssignment | null> {
    const [row] = await this.db
      .select()
      .from(readingPlanAssignments)
      .where(eq(readingPlanAssignments.id, id))
      .limit(1);
    return row ? this.assignmentFromRow(row) : null;
  }

  async hasAssignments(planId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: readingPlanAssignments.id })
      .from(readingPlanAssignments)
      .where(eq(readingPlanAssignments.planId, planId))
      .limit(1);
    return row !== undefined;
  }

  async createAssignment(
    input: ReadingPlanAssignmentCreateInput
  ): Promise<ReadingPlanAssignment> {
    const viewer = {
      userType: input.userType,
      userId: input.userId.trim()
    };
    const existing = await this.findOpenAssignmentForViewer(
      input.planId,
      viewer
    );
    if (existing) {
      return existing;
    }
    const [attempt] = await this.db
      .select({ value: max(readingPlanAssignments.attemptNumber) })
      .from(readingPlanAssignments)
      .where(
        and(
          eq(readingPlanAssignments.planId, input.planId),
          eq(readingPlanAssignments.userType, input.userType),
          eq(readingPlanAssignments.userId, input.userId.trim())
        )
      );
    const [row] = await this.db
      .insert(readingPlanAssignments)
      .values({
        planId: input.planId,
        userType: input.userType,
        userId: input.userId.trim(),
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        planTitle: input.planTitle,
        planDurationDays: input.planDurationDays,
        attemptNumber: (attempt?.value ?? 0) + 1,
        updatedAt: new Date()
      })
      .onConflictDoNothing()
      .returning();
    if (!row) {
      const concurrentAssignment = await this.findOpenAssignmentForViewer(
        input.planId,
        viewer
      );
      if (concurrentAssignment) {
        return concurrentAssignment;
      }
      throw new Error("Failed to create reading plan assignment.");
    }
    return this.assignmentFromRow(row);
  }

  async findOpenAssignmentForViewer(
    planId: string,
    viewer: ReadingPlanViewer
  ): Promise<ReadingPlanAssignment | null> {
    const [row] = await this.db
      .select()
      .from(readingPlanAssignments)
      .where(
        and(
          eq(readingPlanAssignments.planId, planId),
          eq(readingPlanAssignments.userType, viewer.userType),
          eq(readingPlanAssignments.userId, viewer.userId),
          inArray(readingPlanAssignments.status, [
            "not_started",
            "active",
            "paused"
          ])
        )
      )
      .limit(1);
    return row ? this.assignmentFromRow(row) : null;
  }

  async updateAssignmentStatus(
    assignmentId: string,
    expectedStatus: ReadingPlanAssignmentStatus,
    status: ReadingPlanAssignmentStatus
  ): Promise<ReadingPlanAssignment | null> {
    const now = new Date();
    const row = await this.db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(readingPlanAssignments)
        .where(eq(readingPlanAssignments.id, assignmentId))
        .for("update")
        .limit(1);
      if (!existing || existing.status !== expectedStatus) {
        return null;
      }
      const [updated] = await transaction
        .update(readingPlanAssignments)
        .set({
          status,
          startedAt:
            status === "active"
              ? (existing.startedAt ?? now)
              : existing.startedAt,
          completedAt: null,
          endedAt: status === "abandoned" ? now : null,
          updatedAt: now
        })
        .where(eq(readingPlanAssignments.id, assignmentId))
        .returning();
      return updated ?? null;
    });
    return row ? this.assignmentFromRow(row) : null;
  }

  async upsertDayProgress(
    assignmentId: string,
    dayId: string,
    input: ReadingPlanDayProgressUpdateRequest
  ): Promise<ReadingPlanDayProgressWriteResult> {
    const now = new Date();
    const completedAt = input.status === "completed" ? now : null;
    return this.db.transaction(async (transaction) => {
      const [assignment] = await transaction
        .select()
        .from(readingPlanAssignments)
        .where(eq(readingPlanAssignments.id, assignmentId))
        .for("update")
        .limit(1);
      if (!assignment) {
        return { kind: "missing" };
      }
      const [plan] = await transaction
        .select()
        .from(readingPlans)
        .where(eq(readingPlans.id, assignment.planId))
        .for("update")
        .limit(1);
      if (
        !plan ||
        !isReadingPlanProgressWritable(plan.status, assignment.status)
      ) {
        return { kind: "closed" };
      }
      const [row] = await transaction
        .insert(readingPlanDayProgress)
        .values({
          assignmentId,
          dayId,
          status: input.status,
          note: input.note.trim(),
          completedAt,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: [
            readingPlanDayProgress.assignmentId,
            readingPlanDayProgress.dayId
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
        throw new Error("Failed to update reading plan day progress.");
      }
      const progressRows = await transaction
        .select({ status: readingPlanDayProgress.status })
        .from(readingPlanDayProgress)
        .where(eq(readingPlanDayProgress.assignmentId, assignmentId));
      const state = resolveReadingPlanAssignmentStateAfterProgress({
        current: {
          status: assignment.status,
          startedAt: assignment.startedAt?.toISOString() ?? null,
          completedAt: assignment.completedAt?.toISOString() ?? null,
          endedAt: assignment.endedAt?.toISOString() ?? null
        },
        durationDays: assignment.planDurationDays,
        completedDayCount: progressRows.filter(
          (item) => item.status === "completed"
        ).length,
        now: now.toISOString()
      });
      await transaction
        .update(readingPlanAssignments)
        .set({
          status: state.status,
          startedAt: state.startedAt ? new Date(state.startedAt) : null,
          completedAt: state.completedAt ? new Date(state.completedAt) : null,
          endedAt: state.endedAt ? new Date(state.endedAt) : null,
          updatedAt: now
        })
        .where(eq(readingPlanAssignments.id, assignmentId));
      return { kind: "updated", progress: progressFromRow(row) };
    });
  }

  private async assignmentFromRow(
    row: typeof readingPlanAssignments.$inferSelect
  ): Promise<ReadingPlanAssignment> {
    return {
      id: row.id,
      planId: row.planId,
      planTitle: row.planTitle,
      planDurationDays: row.planDurationDays,
      attemptNumber: row.attemptNumber,
      userType: row.userType,
      userId: row.userId,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      status: row.status,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      endedAt: row.endedAt?.toISOString() ?? null,
      progress: await this.progressForAssignment(row.id),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }

  private async listAssignmentPageForViewer(
    viewer: ReadingPlanViewer,
    input: {
      scope: ReadingPlanAssignmentScope;
      limit: number;
      cursor: number;
    }
  ): Promise<ReadingPlanAssignmentPage> {
    const openStatuses: ReadingPlanAssignmentStatus[] = [
      "not_started",
      "active",
      "paused"
    ];
    const scopeFilter =
      input.scope === "active"
        ? inArray(readingPlanAssignments.status, openStatuses)
        : input.scope === "history"
          ? notInArray(readingPlanAssignments.status, openStatuses)
          : undefined;
    const rows = await this.db
      .select()
      .from(readingPlanAssignments)
      .where(
        and(
          eq(readingPlanAssignments.userType, viewer.userType),
          eq(readingPlanAssignments.userId, viewer.userId),
          scopeFilter
        )
      )
      .orderBy(
        desc(readingPlanAssignments.endedAt),
        desc(readingPlanAssignments.updatedAt)
      )
      .limit(input.limit + 1)
      .offset(input.cursor);
    const hasMore = rows.length > input.limit;
    const pageRows = hasMore ? rows.slice(0, input.limit) : rows;
    return {
      items: await Promise.all(
        pageRows.map((row) => this.assignmentFromRow(row))
      ),
      nextCursor: hasMore ? String(input.cursor + input.limit) : null
    };
  }

  private async progressForAssignment(assignmentId: string) {
    const rows = await this.db
      .select()
      .from(readingPlanDayProgress)
      .where(eq(readingPlanDayProgress.assignmentId, assignmentId));
    return rows.map(progressFromRow);
  }
}

function planFromRow(row: typeof readingPlans.$inferSelect): ReadingPlan {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    visibility: row.visibility,
    locale: row.locale,
    durationDays: row.durationDays,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function dayFromRow(row: typeof readingPlanDays.$inferSelect): ReadingPlanDay {
  return {
    id: row.id,
    planId: row.planId,
    dayNumber: row.dayNumber,
    title: row.title,
    description: row.description,
    references: zodReferences(row.references),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function progressFromRow(
  row: typeof readingPlanDayProgress.$inferSelect
): ReadingPlanDayProgress {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    dayId: row.dayId,
    status: row.status,
    note: row.note,
    completedAt: row.completedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString()
  };
}

function zodReferences(value: unknown) {
  return scriptureReferenceSchema.array().parse(value ?? []);
}
