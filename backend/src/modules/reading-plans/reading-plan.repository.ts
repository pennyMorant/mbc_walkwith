import type {
  ReadingPlan,
  ReadingPlanAssignment,
  ReadingPlanAssignmentCreateRequest,
  ReadingPlanAssignmentListQuery,
  ReadingPlanAssignmentScope,
  ReadingPlanAssignmentStatus,
  ReadingPlanCreateRequest,
  ReadingPlanDay,
  ReadingPlanDayProgress,
  ReadingPlanDayProgressUpdateRequest,
  ReadingPlanDayUpsertRequest,
  ReadingPlanListQuery,
  ReadingPlanUpdateRequest,
  ReadingPlanUserType
} from "@mbc/api-contracts";

export type ReadingPlanViewer = {
  userType: ReadingPlanUserType;
  userId: string;
};

export type ReadingPlanAssignmentCreateInput =
  ReadingPlanAssignmentCreateRequest & {
    planTitle: string;
    planDurationDays: number;
  };

export type ReadingPlanAssignmentPage = {
  items: ReadingPlanAssignment[];
  nextCursor: string | null;
};

export type ReadingPlanDayProgressWriteResult =
  | { kind: "updated"; progress: ReadingPlanDayProgress }
  | { kind: "closed" }
  | { kind: "missing" };

export interface ReadingPlanRepository {
  listPlans(query: ReadingPlanListQuery): Promise<ReadingPlan[]>;
  getPlanById(id: string): Promise<ReadingPlan | null>;
  createPlan(input: ReadingPlanCreateRequest): Promise<ReadingPlan>;
  updatePlan(
    id: string,
    input: ReadingPlanUpdateRequest
  ): Promise<ReadingPlan | null>;
  listDays(planId: string): Promise<ReadingPlanDay[]>;
  getDayById(dayId: string): Promise<ReadingPlanDay | null>;
  upsertDay(
    planId: string,
    input: ReadingPlanDayUpsertRequest
  ): Promise<ReadingPlanDay>;
  listAssignments(
    query: ReadingPlanAssignmentListQuery
  ): Promise<ReadingPlanAssignment[]>;
  listAssignmentsForViewer(
    viewer: ReadingPlanViewer,
    input: { scope: ReadingPlanAssignmentScope; limit: number; cursor: number }
  ): Promise<ReadingPlanAssignmentPage>;
  hasAssignments(planId: string): Promise<boolean>;
  getAssignmentById(id: string): Promise<ReadingPlanAssignment | null>;
  createAssignment(
    input: ReadingPlanAssignmentCreateInput
  ): Promise<ReadingPlanAssignment>;
  findOpenAssignmentForViewer(
    planId: string,
    viewer: ReadingPlanViewer
  ): Promise<ReadingPlanAssignment | null>;
  updateAssignmentStatus(
    assignmentId: string,
    expectedStatus: ReadingPlanAssignmentStatus,
    status: ReadingPlanAssignmentStatus
  ): Promise<ReadingPlanAssignment | null>;
  upsertDayProgress(
    assignmentId: string,
    dayId: string,
    input: ReadingPlanDayProgressUpdateRequest
  ): Promise<ReadingPlanDayProgressWriteResult>;
}
