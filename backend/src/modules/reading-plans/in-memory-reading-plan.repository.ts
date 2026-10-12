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
import { randomUUID } from "node:crypto";

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

export class InMemoryReadingPlanRepository
  implements ReadingPlanRepository
{
  private plans = new Map<string, ReadingPlan>();
  private days = new Map<string, ReadingPlanDay>();
  private assignments = new Map<string, ReadingPlanAssignment>();
  private progress = new Map<string, ReadingPlanDayProgress>();

  async listPlans(query: ReadingPlanListQuery): Promise<ReadingPlan[]> {
    const needle = query.query?.trim().toLowerCase();
    return [...this.plans.values()]
      .filter((plan) => {
        if (query.status && plan.status !== query.status) {
          return false;
        }
        if (query.visibility && plan.visibility !== query.visibility) {
          return false;
        }
        if (query.locale && plan.locale !== query.locale) {
          return false;
        }
        return needle
          ? `${plan.title} ${plan.description}`.toLowerCase().includes(needle)
          : true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async getPlanById(id: string): Promise<ReadingPlan | null> {
    return this.plans.get(id) ?? null;
  }

  async createPlan(input: ReadingPlanCreateRequest): Promise<ReadingPlan> {
    const now = new Date().toISOString();
    const plan: ReadingPlan = {
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description.trim(),
      status: input.status,
      visibility: input.visibility,
      locale: input.locale.trim(),
      durationDays: input.durationDays,
      createdAt: now,
      updatedAt: now
    };
    this.plans.set(plan.id, plan);
    return plan;
  }

  async updatePlan(
    id: string,
    input: ReadingPlanUpdateRequest
  ): Promise<ReadingPlan | null> {
    const existing = this.plans.get(id);
    if (!existing) {
      return null;
    }
    const updated: ReadingPlan = {
      ...existing,
      title: input.title === undefined ? existing.title : input.title.trim(),
      description:
        input.description === undefined
          ? existing.description
          : input.description.trim(),
      status: input.status ?? existing.status,
      visibility: input.visibility ?? existing.visibility,
      locale: input.locale === undefined ? existing.locale : input.locale.trim(),
      durationDays: input.durationDays ?? existing.durationDays,
      updatedAt: new Date().toISOString()
    };
    this.plans.set(id, updated);
    return updated;
  }

  async listDays(planId: string): Promise<ReadingPlanDay[]> {
    return [...this.days.values()]
      .filter((day) => day.planId === planId)
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }

  async getDayById(dayId: string): Promise<ReadingPlanDay | null> {
    return this.days.get(dayId) ?? null;
  }

  async upsertDay(
    planId: string,
    input: ReadingPlanDayUpsertRequest
  ): Promise<ReadingPlanDay> {
    const existing = [...this.days.values()].find(
      (day) => day.planId === planId && day.dayNumber === input.dayNumber
    );
    const now = new Date().toISOString();
    const day: ReadingPlanDay = {
      id: existing?.id ?? randomUUID(),
      planId,
      dayNumber: input.dayNumber,
      title: input.title.trim(),
      description: input.description.trim(),
      references: input.references,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    this.days.set(day.id, day);
    return day;
  }

  async listAssignments(
    query: ReadingPlanAssignmentListQuery
  ): Promise<ReadingPlanAssignment[]> {
    return [...this.assignments.values()]
      .map((assignment) => this.withProgress(assignment))
      .filter((assignment) => {
        if (query.planId && assignment.planId !== query.planId) {
          return false;
        }
        if (query.userType && assignment.userType !== query.userType) {
          return false;
        }
        if (query.userId && assignment.userId !== query.userId) {
          return false;
        }
        if (query.status && assignment.status !== query.status) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async listAssignmentsForViewer(
    viewer: ReadingPlanViewer,
    input: {
      scope: ReadingPlanAssignmentScope;
      limit: number;
      cursor: number;
    }
  ): Promise<ReadingPlanAssignmentPage> {
    const assignments = [...this.assignments.values()]
      .filter(
        (assignment) =>
          assignment.userType === viewer.userType &&
          assignment.userId === viewer.userId &&
          matchesScope(assignment.status, input.scope)
      )
      .map((assignment) => this.withProgress(assignment))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const items = assignments.slice(input.cursor, input.cursor + input.limit);
    const nextOffset = input.cursor + items.length;
    return {
      items,
      nextCursor:
        nextOffset < assignments.length ? String(nextOffset) : null
    };
  }

  async getAssignmentById(
    id: string
  ): Promise<ReadingPlanAssignment | null> {
    const assignment = this.assignments.get(id);
    return assignment ? this.withProgress(assignment) : null;
  }

  async hasAssignments(planId: string): Promise<boolean> {
    return [...this.assignments.values()].some(
      (assignment) => assignment.planId === planId
    );
  }

  async createAssignment(
    input: ReadingPlanAssignmentCreateInput
  ): Promise<ReadingPlanAssignment> {
    const existing = await this.findOpenAssignmentForViewer(input.planId, {
      userType: input.userType,
      userId: input.userId.trim()
    });
    if (existing) {
      return existing;
    }
    const concurrentExisting = [...this.assignments.values()].find(
      (assignment) =>
        sameAssignmentOwner(assignment, input) &&
        isOpenAssignment(assignment.status)
    );
    if (concurrentExisting) {
      return this.withProgress(concurrentExisting);
    }
    const previousAttempts = [...this.assignments.values()].filter(
      (assignment) => sameAssignmentOwner(assignment, input)
    );
    const now = new Date().toISOString();
    const assignment: ReadingPlanAssignment = {
      id: randomUUID(),
      planId: input.planId,
      planTitle: input.planTitle,
      planDurationDays: input.planDurationDays,
      attemptNumber:
        Math.max(0, ...previousAttempts.map((item) => item.attemptNumber)) + 1,
      userType: input.userType,
      userId: input.userId.trim(),
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      status: "not_started",
      startedAt: null,
      completedAt: null,
      endedAt: null,
      progress: [],
      createdAt: now,
      updatedAt: now
    };
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  async findOpenAssignmentForViewer(
    planId: string,
    viewer: ReadingPlanViewer
  ): Promise<ReadingPlanAssignment | null> {
    const assignment = [...this.assignments.values()].find(
      (item) =>
        item.planId === planId &&
        item.userType === viewer.userType &&
        item.userId === viewer.userId &&
        isOpenAssignment(item.status)
    );
    return assignment ? this.withProgress(assignment) : null;
  }

  async updateAssignmentStatus(
    assignmentId: string,
    expectedStatus: ReadingPlanAssignmentStatus,
    status: ReadingPlanAssignmentStatus
  ): Promise<ReadingPlanAssignment | null> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment || assignment.status !== expectedStatus) {
      return null;
    }
    const now = new Date().toISOString();
    const updated: ReadingPlanAssignment = {
      ...assignment,
      status,
      startedAt:
        status === "active" ? assignment.startedAt ?? now : assignment.startedAt,
      completedAt: null,
      endedAt: status === "abandoned" ? now : null,
      updatedAt: now
    };
    this.assignments.set(assignmentId, updated);
    return this.withProgress(updated);
  }

  async upsertDayProgress(
    assignmentId: string,
    dayId: string,
    input: ReadingPlanDayProgressUpdateRequest
  ): Promise<ReadingPlanDayProgressWriteResult> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      return { kind: "missing" };
    }
    const plan = this.plans.get(assignment.planId);
    if (
      !plan ||
      !isReadingPlanProgressWritable(plan.status, assignment.status)
    ) {
      return { kind: "closed" };
    }
    const key = progressKey(assignmentId, dayId);
    const now = new Date().toISOString();
    const existing = this.progress.get(key);
    const progress: ReadingPlanDayProgress = {
      id: existing?.id ?? randomUUID(),
      assignmentId,
      dayId,
      status: input.status,
      note: input.note.trim(),
      completedAt: input.status === "completed" ? now : null,
      updatedAt: now
    };
    this.progress.set(key, progress);
    const state = resolveReadingPlanAssignmentStateAfterProgress({
      current: {
        status: assignment.status,
        startedAt: assignment.startedAt,
        completedAt: assignment.completedAt,
        endedAt: assignment.endedAt
      },
      durationDays: plan.durationDays,
      completedDayCount: this.completedDayCountForAssignment(assignmentId),
      now
    });
    this.assignments.set(assignmentId, {
      ...assignment,
      ...state,
      updatedAt: now
    });
    return { kind: "updated", progress };
  }

  private withProgress(
    assignment: ReadingPlanAssignment
  ): ReadingPlanAssignment {
    return {
      ...assignment,
      progress: [...this.progress.values()].filter(
        (item) => item.assignmentId === assignment.id
      )
    };
  }

  private completedDayCountForAssignment(assignmentId: string) {
    return [...this.progress.values()].filter(
      (item) => item.assignmentId === assignmentId && item.status === "completed"
    ).length;
  }
}

function isOpenAssignment(status: ReadingPlanAssignmentStatus) {
  return status === "not_started" || status === "active" || status === "paused";
}

function matchesScope(
  status: ReadingPlanAssignmentStatus,
  scope: ReadingPlanAssignmentScope
) {
  if (scope === "all") {
    return true;
  }
  return scope === "active" ? isOpenAssignment(status) : !isOpenAssignment(status);
}

function sameAssignmentOwner(
  assignment: ReadingPlanAssignment,
  input: ReadingPlanAssignmentCreateInput
) {
  return (
    assignment.planId === input.planId &&
    assignment.userType === input.userType &&
    assignment.userId === input.userId.trim()
  );
}

function progressKey(assignmentId: string, dayId: string) {
  return `${assignmentId}:${dayId}`;
}
