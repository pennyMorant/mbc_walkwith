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
import { randomUUID } from "node:crypto";

import type { DiscipleshipRepository } from "./discipleship.repository.js";
import { resolveAssignmentStateAfterProgress } from "./discipleship_status_rules.js";

export class InMemoryDiscipleshipRepository
  implements DiscipleshipRepository
{
  private journeys = new Map<string, DiscipleshipJourney>();
  private stages = new Map<string, DiscipleshipStage>();
  private tasks = new Map<string, DiscipleshipTask>();
  private assignments = new Map<string, DiscipleshipAssignment>();
  private progress = new Map<string, DiscipleshipTaskProgress>();

  async listJourneys(
    query: DiscipleshipJourneyListQuery
  ): Promise<DiscipleshipJourney[]> {
    const needle = query.query?.trim().toLowerCase();
    return [...this.journeys.values()]
      .filter((journey) => {
        if (query.status && journey.status !== query.status) {
          return false;
        }
        return needle
          ? `${journey.title} ${journey.description}`
              .toLowerCase()
              .includes(needle)
          : true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async getJourneyById(id: string): Promise<DiscipleshipJourney | null> {
    return this.journeys.get(id) ?? null;
  }

  async createJourney(
    input: DiscipleshipJourneyCreateRequest
  ): Promise<DiscipleshipJourney> {
    const now = new Date().toISOString();
    const journey: DiscipleshipJourney = {
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description.trim(),
      status: input.status,
      createdAt: now,
      updatedAt: now
    };
    this.journeys.set(journey.id, journey);
    return journey;
  }

  async updateJourney(
    id: string,
    input: DiscipleshipJourneyUpdateRequest
  ): Promise<DiscipleshipJourney | null> {
    const existing = this.journeys.get(id);
    if (!existing) {
      return null;
    }
    const updated: DiscipleshipJourney = {
      ...existing,
      title: input.title === undefined ? existing.title : input.title.trim(),
      description:
        input.description === undefined
          ? existing.description
          : input.description.trim(),
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString()
    };
    this.journeys.set(id, updated);
    return updated;
  }

  async createStage(
    journeyId: string,
    input: DiscipleshipStageCreateRequest
  ): Promise<DiscipleshipStage> {
    const now = new Date().toISOString();
    const stage: DiscipleshipStage = {
      id: randomUUID(),
      journeyId,
      title: input.title.trim(),
      description: input.description.trim(),
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now
    };
    this.stages.set(stage.id, stage);
    return stage;
  }

  async getStageById(id: string): Promise<DiscipleshipStage | null> {
    return this.stages.get(id) ?? null;
  }

  async listStagesForJourney(journeyId: string): Promise<DiscipleshipStage[]> {
    return [...this.stages.values()]
      .filter((stage) => stage.journeyId === journeyId)
      .sort(compareDiscipleshipItemOrder);
  }

  async createTask(
    journeyId: string,
    input: DiscipleshipTaskCreateRequest
  ): Promise<DiscipleshipTask> {
    const now = new Date().toISOString();
    const task: DiscipleshipTask = {
      id: randomUUID(),
      journeyId,
      stageId: input.stageId ?? null,
      title: input.title.trim(),
      description: input.description.trim(),
      referenceType: input.referenceType,
      referenceId: input.referenceId.trim(),
      required: input.required,
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async getTaskById(id: string): Promise<DiscipleshipTask | null> {
    return this.tasks.get(id) ?? null;
  }

  async listTasksForJourney(journeyId: string): Promise<DiscipleshipTask[]> {
    return [...this.tasks.values()]
      .filter((task) => task.journeyId === journeyId)
      .sort(compareDiscipleshipItemOrder);
  }

  async listAssignments(
    query: DiscipleshipAssignmentListQuery
  ): Promise<DiscipleshipAssignment[]> {
    return [...this.assignments.values()]
      .map((assignment) => this.withProgress(assignment))
      .filter((assignment) => {
        if (query.status && assignment.status !== query.status) {
          return false;
        }
        if (query.userId && assignment.userId !== query.userId) {
          return false;
        }
        if (query.journeyId && assignment.journeyId !== query.journeyId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async listAssignmentsForUser(
    userId: string
  ): Promise<DiscipleshipAssignment[]> {
    return this.listAssignments({ userId, limit: 100 });
  }

  async getAssignmentById(
    id: string
  ): Promise<DiscipleshipAssignment | null> {
    const assignment = this.assignments.get(id);
    return assignment ? this.withProgress(assignment) : null;
  }

  async createAssignment(
    input: DiscipleshipAssignmentCreateRequest
  ): Promise<DiscipleshipAssignment> {
    const now = new Date().toISOString();
    const assignment: DiscipleshipAssignment = {
      id: randomUUID(),
      journeyId: input.journeyId,
      userId: input.userId.trim(),
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      assigneeAdminUserId: input.assigneeAdminUserId ?? null,
      assigneeName: input.assigneeName.trim(),
      status: "not_started",
      startedAt: null,
      completedAt: null,
      taskTotalCount: this.taskCountForJourney(input.journeyId),
      completedTaskCount: 0,
      progress: [],
      createdAt: now,
      updatedAt: now
    };
    this.assignments.set(assignment.id, assignment);
    return this.withProgress(assignment);
  }

  async upsertTaskProgress(
    assignmentId: string,
    taskId: string,
    input: DiscipleshipTaskProgressUpdateRequest
  ): Promise<DiscipleshipTaskProgress> {
    const key = progressKey(assignmentId, taskId);
    const now = new Date().toISOString();
    const existing = this.progress.get(key);
    const progress: DiscipleshipTaskProgress = {
      id: existing?.id ?? randomUUID(),
      assignmentId,
      taskId,
      status: input.status,
      note: input.note.trim(),
      completedAt: input.status === "completed" ? now : null,
      updatedAt: now
    };
    this.progress.set(key, progress);
    const assignment = this.assignments.get(assignmentId);
    if (assignment) {
      const state = resolveAssignmentStateAfterProgress({
        current: {
          status: assignment.status,
          startedAt: assignment.startedAt,
          completedAt: assignment.completedAt
        },
        taskTotalCount: this.taskCountForJourney(assignment.journeyId),
        completedTaskCount: this.completedTaskCountForAssignment(assignmentId),
        now
      });
      this.assignments.set(assignmentId, {
        ...assignment,
        ...state,
        updatedAt: now
      });
    }
    return progress;
  }

  private withProgress(
    assignment: DiscipleshipAssignment
  ): DiscipleshipAssignment {
    const progress = [...this.progress.values()].filter(
      (item) => item.assignmentId === assignment.id
    );
    return {
      ...assignment,
      taskTotalCount: this.taskCountForJourney(assignment.journeyId),
      completedTaskCount: progress.filter((item) => item.status === "completed")
        .length,
      progress
    };
  }

  private taskCountForJourney(journeyId: string) {
    return [...this.tasks.values()].filter((task) => task.journeyId === journeyId)
      .length;
  }

  private completedTaskCountForAssignment(assignmentId: string) {
    return [...this.progress.values()].filter(
      (item) => item.assignmentId === assignmentId && item.status === "completed"
    ).length;
  }
}

function progressKey(assignmentId: string, taskId: string) {
  return `${assignmentId}:${taskId}`;
}

function compareDiscipleshipItemOrder(
  left: DiscipleshipStage | DiscipleshipTask,
  right: DiscipleshipStage | DiscipleshipTask
) {
  return left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt);
}
