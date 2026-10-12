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

export interface DiscipleshipRepository {
  listJourneys(
    query: DiscipleshipJourneyListQuery
  ): Promise<DiscipleshipJourney[]>;
  getJourneyById(id: string): Promise<DiscipleshipJourney | null>;
  createJourney(
    input: DiscipleshipJourneyCreateRequest
  ): Promise<DiscipleshipJourney>;
  updateJourney(
    id: string,
    input: DiscipleshipJourneyUpdateRequest
  ): Promise<DiscipleshipJourney | null>;
  createStage(
    journeyId: string,
    input: DiscipleshipStageCreateRequest
  ): Promise<DiscipleshipStage>;
  listStagesForJourney(journeyId: string): Promise<DiscipleshipStage[]>;
  getStageById(id: string): Promise<DiscipleshipStage | null>;
  createTask(
    journeyId: string,
    input: DiscipleshipTaskCreateRequest
  ): Promise<DiscipleshipTask>;
  listTasksForJourney(journeyId: string): Promise<DiscipleshipTask[]>;
  getTaskById(id: string): Promise<DiscipleshipTask | null>;
  listAssignments(
    query: DiscipleshipAssignmentListQuery
  ): Promise<DiscipleshipAssignment[]>;
  listAssignmentsForUser(userId: string): Promise<DiscipleshipAssignment[]>;
  getAssignmentById(id: string): Promise<DiscipleshipAssignment | null>;
  createAssignment(
    input: DiscipleshipAssignmentCreateRequest
  ): Promise<DiscipleshipAssignment>;
  upsertTaskProgress(
    assignmentId: string,
    taskId: string,
    input: DiscipleshipTaskProgressUpdateRequest
  ): Promise<DiscipleshipTaskProgress>;
}
