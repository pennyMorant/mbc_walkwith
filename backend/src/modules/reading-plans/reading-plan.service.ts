import type {
  ReadingPlan,
  ReadingPlanAssignmentCreateRequest,
  ReadingPlanAssignmentListQuery,
  ReadingPlanAssignmentStatusUpdateRequest,
  ReadingPlanCreateRequest,
  ReadingPlanDayProgressUpdateRequest,
  ReadingPlanDayUpsertRequest,
  ReadingPlanListQuery,
  ReadingPlanMyAssignmentListQuery,
  ReadingPlanUpdateRequest
} from "@mbc/api-contracts";

import {
  readingPlanAssignmentClosed,
  readingPlanAssignmentNotFound,
  readingPlanAssignmentTransitionInvalid,
  readingPlanAssignmentUserNotFound,
  readingPlanDayNotFound,
  readingPlanNotFound,
  readingPlanPermissionDenied,
  readingPlanProgressClosed,
  readingPlanStructureLocked,
  readingPlanUserRequired
} from "./reading-plan-errors.js";
import type {
  ReadingPlanRepository,
  ReadingPlanViewer
} from "./reading-plan.repository.js";
import {
  assertInitialReadingPlanStatus,
  assertReadingPlanAssignmentTransition,
  assertReadingPlanDayEditable,
  assertReadingPlanDayInRange,
  assertReadingPlanProgressWritable,
  assertReadingPlanScheduleComplete,
  assertReadingPlanUpdateAllowed,
  readingPlanUpdateChangesAssignedStructure
} from "./reading_plan_status_rules.js";
import type { ReadingPlanUserDirectory } from "./reading_plan_user_directory.js";

export class ReadingPlanService {
  constructor(
    private readonly repository: ReadingPlanRepository,
    private readonly userDirectory: ReadingPlanUserDirectory
  ) {}

  listPlans(query: ReadingPlanListQuery) {
    return this.repository.listPlans(query);
  }

  listPublishedPlans(query: ReadingPlanListQuery, viewer?: ReadingPlanViewer) {
    return this.repository.listPlans({
      ...query,
      status: "published",
      visibility: viewer?.userType === "member" ? query.visibility : "public"
    });
  }

  async getPlanDays(planId: string, viewer?: ReadingPlanViewer) {
    await this.requirePublishedPlanForViewer(planId, viewer);
    return this.repository.listDays(planId);
  }

  createPlan(input: ReadingPlanCreateRequest) {
    assertInitialReadingPlanStatus(input.status);
    return this.repository.createPlan(input);
  }

  async updatePlan(id: string, input: ReadingPlanUpdateRequest) {
    const existing = await this.requirePlan(id);
    assertReadingPlanUpdateAllowed(existing, input);
    if (
      readingPlanUpdateChangesAssignedStructure(existing, input) &&
      (await this.repository.hasAssignments(id))
    ) {
      throw readingPlanStructureLocked(id);
    }
    const nextStatus = input.status ?? existing.status;
    if (nextStatus === "published") {
      const days = await this.repository.listDays(id);
      assertReadingPlanScheduleComplete(
        id,
        input.durationDays ?? existing.durationDays,
        days
      );
    }
    const plan = await this.repository.updatePlan(id, input);
    if (!plan) {
      throw readingPlanNotFound(id);
    }
    return plan;
  }

  async upsertDay(planId: string, input: ReadingPlanDayUpsertRequest) {
    const plan = await this.requirePlan(planId);
    assertReadingPlanDayEditable(plan);
    assertReadingPlanDayInRange(plan, input.dayNumber);
    if (await this.repository.hasAssignments(planId)) {
      throw readingPlanStructureLocked(planId);
    }
    return this.repository.upsertDay(planId, input);
  }

  async listAdminDays(planId: string) {
    await this.requirePlan(planId);
    return this.repository.listDays(planId);
  }

  listAssignments(query: ReadingPlanAssignmentListQuery) {
    return this.repository.listAssignments(query);
  }

  listAssignmentsForViewer(
    viewer: ReadingPlanViewer | null,
    query: ReadingPlanMyAssignmentListQuery
  ) {
    return this.repository.listAssignmentsForViewer(
      requireViewer(viewer),
      query
    );
  }

  async getAssignmentDetail(
    assignmentId: string,
    viewer: ReadingPlanViewer | null
  ) {
    const assignment = await this.requireOwnedAssignment(
      assignmentId,
      requireViewer(viewer)
    );
    const plan = await this.requirePlan(assignment.planId);
    const openAssignment = await this.repository.findOpenAssignmentForViewer(
      assignment.planId,
      { userType: assignment.userType, userId: assignment.userId }
    );
    return {
      assignment,
      days: await this.repository.listDays(assignment.planId),
      canRestart: plan.status === "published" && openAssignment === null
    };
  }

  async createAssignment(input: ReadingPlanAssignmentCreateRequest) {
    const plan = await this.requirePlan(input.planId);
    assertPlanCanBeAssigned(plan);
    if (plan.visibility === "members" && input.userType !== "member") {
      throw readingPlanPermissionDenied(input.planId);
    }
    if (
      input.userType === "member" &&
      !(await this.userDirectory.memberExists(input.userId))
    ) {
      throw readingPlanAssignmentUserNotFound(input.userId);
    }
    return this.repository.createAssignment({
      ...input,
      planTitle: plan.title,
      planDurationDays: plan.durationDays
    });
  }

  async selfAssign(planId: string, viewer: ReadingPlanViewer | null) {
    const cleanViewer = requireViewer(viewer);
    const plan = await this.requirePublishedPlanForViewer(planId, cleanViewer);
    return this.repository.createAssignment({
      planId,
      userType: cleanViewer.userType,
      userId: cleanViewer.userId,
      sourceType: "self",
      sourceId: null,
      planTitle: plan.title,
      planDurationDays: plan.durationDays
    });
  }

  async updateAssignmentStatus(
    assignmentId: string,
    viewer: ReadingPlanViewer | null,
    input: ReadingPlanAssignmentStatusUpdateRequest
  ) {
    const assignment = await this.requireOwnedAssignment(
      assignmentId,
      requireViewer(viewer)
    );
    assertReadingPlanAssignmentTransition(assignment, input.status);
    if (input.status === "active") {
      const plan = await this.requirePlan(assignment.planId);
      assertPlanCanBeAssigned(plan);
    }
    const updated = await this.repository.updateAssignmentStatus(
      assignmentId,
      assignment.status,
      input.status
    );
    if (!updated) {
      const current = await this.requireOwnedAssignment(
        assignmentId,
        requireViewer(viewer)
      );
      assertReadingPlanAssignmentTransition(current, input.status);
      throw readingPlanAssignmentTransitionInvalid(
        assignmentId,
        current.status,
        input.status
      );
    }
    return updated;
  }

  async updateDayProgress(
    assignmentId: string,
    dayId: string,
    viewer: ReadingPlanViewer | null,
    input: ReadingPlanDayProgressUpdateRequest
  ) {
    const cleanViewer = requireViewer(viewer);
    const assignment = await this.requireOwnedAssignment(
      assignmentId,
      cleanViewer
    );
    const plan = await this.requirePlan(assignment.planId);
    assertReadingPlanProgressWritable(plan, assignment);
    const day = await this.repository.getDayById(dayId);
    if (!day || day.planId !== assignment.planId) {
      throw readingPlanDayNotFound(dayId);
    }
    const result = await this.repository.upsertDayProgress(
      assignmentId,
      dayId,
      input
    );
    if (result.kind === "updated") {
      return result.progress;
    }
    if (result.kind === "missing") {
      throw readingPlanAssignmentNotFound(assignmentId);
    }
    const currentAssignment = await this.requireOwnedAssignment(
      assignmentId,
      cleanViewer
    );
    const currentPlan = await this.requirePlan(currentAssignment.planId);
    assertReadingPlanProgressWritable(currentPlan, currentAssignment);
    throw readingPlanProgressClosed(
      currentPlan.id,
      currentAssignment.id,
      currentPlan.status,
      currentAssignment.status
    );
  }

  private async requirePlan(planId: string) {
    const plan = await this.repository.getPlanById(planId);
    if (!plan) {
      throw readingPlanNotFound(planId);
    }
    return plan;
  }

  private async requireOwnedAssignment(
    assignmentId: string,
    viewer: ReadingPlanViewer
  ) {
    const assignment = await this.repository.getAssignmentById(assignmentId);
    if (
      !assignment ||
      assignment.userType !== viewer.userType ||
      assignment.userId !== viewer.userId
    ) {
      throw readingPlanAssignmentNotFound(assignmentId);
    }
    return assignment;
  }

  private async requirePublishedPlanForViewer(
    planId: string,
    viewer?: ReadingPlanViewer
  ) {
    const plan = await this.requirePlan(planId);
    if (plan.status !== "published") {
      throw readingPlanNotFound(planId);
    }
    if (plan.visibility === "members" && viewer?.userType !== "member") {
      throw readingPlanPermissionDenied(planId);
    }
    return plan;
  }
}

function requireViewer(viewer: ReadingPlanViewer | null): ReadingPlanViewer {
  if (!viewer) {
    throw readingPlanUserRequired();
  }
  return viewer;
}

function assertPlanCanBeAssigned(plan: ReadingPlan) {
  if (plan.status !== "published") {
    throw readingPlanAssignmentClosed(plan.id, plan.status);
  }
}
