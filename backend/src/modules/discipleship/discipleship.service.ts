import type {
  DiscipleshipAssignmentCreateRequest,
  DiscipleshipAssignmentListQuery,
  DiscipleshipJourney,
  DiscipleshipJourneyCreateRequest,
  DiscipleshipJourneyListQuery,
  DiscipleshipJourneyUpdateRequest,
  DiscipleshipAssignment,
  MemberDiscipleshipAssignment,
  DiscipleshipStageCreateRequest,
  DiscipleshipTaskCreateRequest,
  DiscipleshipTaskProgressUpdateRequest
} from "@mbc/api-contracts";

import {
  discipleshipAssignmentClosed,
  discipleshipAssignmentNotFound,
  discipleshipJourneyNotFound,
  discipleshipReferenceInvalid,
  discipleshipSourceInvalid,
  discipleshipStageNotFound,
  discipleshipTaskNotFound
} from "./discipleship-errors.js";
import type {
  DiscipleshipReferenceDirectory,
  DiscipleshipSourceDirectory
} from "./discipleship_directories.js";
import type { DiscipleshipRepository } from "./discipleship.repository.js";

export class DiscipleshipService {
  constructor(
    private readonly repository: DiscipleshipRepository,
    private readonly references: DiscipleshipReferenceDirectory,
    private readonly sources: DiscipleshipSourceDirectory
  ) {}

  listJourneys(query: DiscipleshipJourneyListQuery) {
    return this.repository.listJourneys(query);
  }

  createJourney(input: DiscipleshipJourneyCreateRequest) {
    return this.repository.createJourney(input);
  }

  async updateJourney(id: string, input: DiscipleshipJourneyUpdateRequest) {
    const journey = await this.repository.updateJourney(id, input);
    if (!journey) {
      throw discipleshipJourneyNotFound(id);
    }
    return journey;
  }

  async createStage(journeyId: string, input: DiscipleshipStageCreateRequest) {
    await this.requireJourney(journeyId);
    return this.repository.createStage(journeyId, input);
  }

  async listStagesForJourney(journeyId: string) {
    await this.requireJourney(journeyId);
    return this.repository.listStagesForJourney(journeyId);
  }

  async createTask(journeyId: string, input: DiscipleshipTaskCreateRequest) {
    await this.requireJourney(journeyId);
    if (input.stageId) {
      const stage = await this.repository.getStageById(input.stageId);
      if (!stage || stage.journeyId !== journeyId) {
        throw discipleshipStageNotFound(input.stageId);
      }
    }
    await this.assertTaskReference(input);
    return this.repository.createTask(journeyId, input);
  }

  async listTasksForJourney(journeyId: string) {
    await this.requireJourney(journeyId);
    return this.repository.listTasksForJourney(journeyId);
  }

  listAssignments(query: DiscipleshipAssignmentListQuery) {
    return this.repository.listAssignments(query);
  }

  listAssignmentsForUser(userId: string) {
    return this.repository.listAssignmentsForUser(userId);
  }

  async listMemberAssignments(userId: string) {
    const assignments = await this.repository.listAssignmentsForUser(userId);
    return assignments.map(toMemberDiscipleshipAssignment);
  }

  async createAssignment(input: DiscipleshipAssignmentCreateRequest) {
    const journey = await this.requireJourney(input.journeyId);
    assertJourneyCanBeAssigned(journey);
    if (!(await this.sources.exists(input))) {
      throw discipleshipSourceInvalid(
        input.sourceType,
        input.sourceId,
        input.userId
      );
    }
    return this.repository.createAssignment(input);
  }

  async updateTaskProgress(
    assignmentId: string,
    taskId: string,
    input: DiscipleshipTaskProgressUpdateRequest
  ) {
    const assignment = await this.repository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw discipleshipAssignmentNotFound(assignmentId);
    }
    const task = await this.repository.getTaskById(taskId);
    if (!task || task.journeyId !== assignment.journeyId) {
      throw discipleshipTaskNotFound(taskId);
    }
    return this.repository.upsertTaskProgress(assignmentId, taskId, input);
  }

  private async requireJourney(journeyId: string) {
    const journey = await this.repository.getJourneyById(journeyId);
    if (!journey) {
      throw discipleshipJourneyNotFound(journeyId);
    }
    return journey;
  }

  private async assertTaskReference(input: DiscipleshipTaskCreateRequest) {
    if (
      input.referenceType !== "manual_review" &&
      (input.referenceId.trim().length === 0 ||
        !(await this.references.exists(
          input.referenceType,
          input.referenceId.trim()
        )))
    ) {
      throw discipleshipReferenceInvalid(
        input.referenceType,
        input.referenceId
      );
    }
  }
}

function toMemberDiscipleshipAssignment(
  assignment: DiscipleshipAssignment
): MemberDiscipleshipAssignment {
  return {
    id: assignment.id,
    journeyId: assignment.journeyId,
    assigneeName: assignment.assigneeName,
    status: assignment.status,
    startedAt: assignment.startedAt,
    completedAt: assignment.completedAt,
    taskTotalCount: assignment.taskTotalCount,
    completedTaskCount: assignment.completedTaskCount,
    progress: assignment.progress.map(({ note: _note, ...progress }) => progress),
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt
  };
}

function assertJourneyCanBeAssigned(journey: DiscipleshipJourney) {
  if (journey.status !== "active") {
    throw discipleshipAssignmentClosed(journey.id, journey.status);
  }
}
