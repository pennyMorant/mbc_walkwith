import type {
  ReadingPlan,
  ReadingPlanAssignment,
  ReadingPlanAssignmentStatus,
  ReadingPlanDay,
  ReadingPlanStatus,
  ReadingPlanUpdateRequest
} from "@mbc/api-contracts";

import {
  readingPlanDayOutOfRange,
  readingPlanAssignmentTransitionInvalid,
  readingPlanProgressClosed,
  readingPlanPublishIncomplete,
  readingPlanTransitionInvalid
} from "./reading-plan-errors.js";

export type ReadingPlanAssignmentStateSnapshot = {
  status: ReadingPlanAssignmentStatus;
  startedAt: string | null;
  completedAt: string | null;
  endedAt: string | null;
};

const allowedAssignmentTransitions: Record<
  ReadingPlanAssignmentStatus,
  ReadonlySet<ReadingPlanAssignmentStatus>
> = {
  not_started: new Set(["active", "abandoned"]),
  active: new Set(["paused", "abandoned"]),
  paused: new Set(["active", "abandoned"]),
  completed: new Set(),
  abandoned: new Set()
};

export function assertReadingPlanAssignmentTransition(
  assignment: ReadingPlanAssignment,
  nextStatus: ReadingPlanAssignmentStatus
) {
  if (!allowedAssignmentTransitions[assignment.status].has(nextStatus)) {
    throw readingPlanAssignmentTransitionInvalid(
      assignment.id,
      assignment.status,
      nextStatus
    );
  }
}

const allowedPlanTransitions: Record<
  ReadingPlanStatus,
  ReadonlySet<ReadingPlanStatus>
> = {
  draft: new Set(["draft", "published", "archived"]),
  published: new Set(["published", "paused", "archived"]),
  paused: new Set(["paused", "draft", "published", "archived"]),
  archived: new Set(["archived", "draft"])
};

export function assertInitialReadingPlanStatus(status: ReadingPlanStatus) {
  if (status !== "draft") {
    throw readingPlanTransitionInvalid(
      "new",
      "new",
      status,
      "new_plan_must_start_as_draft"
    );
  }
}

export function assertReadingPlanUpdateAllowed(
  existing: ReadingPlan,
  input: ReadingPlanUpdateRequest
) {
  const nextStatus = input.status ?? existing.status;
  if (!allowedPlanTransitions[existing.status].has(nextStatus)) {
    throw readingPlanTransitionInvalid(
      existing.id,
      existing.status,
      nextStatus,
      "transition_not_allowed"
    );
  }
  if (
    (existing.status === "published" || existing.status === "archived") &&
    hasReadingPlanContentChanged(existing, input)
  ) {
    throw readingPlanTransitionInvalid(
      existing.id,
      existing.status,
      nextStatus,
      "plan_content_locked"
    );
  }
}

export function assertReadingPlanDayEditable(plan: ReadingPlan) {
  if (plan.status !== "draft" && plan.status !== "paused") {
    throw readingPlanTransitionInvalid(
      plan.id,
      plan.status,
      plan.status,
      "plan_days_locked"
    );
  }
}

export function assertReadingPlanDayInRange(
  plan: ReadingPlan,
  dayNumber: number
) {
  if (dayNumber > plan.durationDays) {
    throw readingPlanDayOutOfRange(plan.id, dayNumber, plan.durationDays);
  }
}

export function assertReadingPlanScheduleComplete(
  planId: string,
  durationDays: number,
  days: ReadingPlanDay[]
) {
  const dayNumbers = new Set(days.map((day) => day.dayNumber));
  const missingDayNumbers = Array.from(
    { length: durationDays },
    (_, index) => index + 1
  ).filter((dayNumber) => !dayNumbers.has(dayNumber));
  const unexpectedDayNumbers = [...dayNumbers]
    .filter((dayNumber) => dayNumber < 1 || dayNumber > durationDays)
    .sort((a, b) => a - b);
  if (missingDayNumbers.length > 0 || unexpectedDayNumbers.length > 0) {
    throw readingPlanPublishIncomplete(
      planId,
      durationDays,
      missingDayNumbers,
      unexpectedDayNumbers
    );
  }
}

export function readingPlanUpdateChangesAssignedStructure(
  existing: ReadingPlan,
  input: ReadingPlanUpdateRequest
) {
  return (
    (input.visibility !== undefined &&
      input.visibility !== existing.visibility) ||
    (input.locale !== undefined && input.locale.trim() !== existing.locale) ||
    (input.durationDays !== undefined &&
      input.durationDays !== existing.durationDays)
  );
}

export function assertReadingPlanProgressWritable(
  plan: ReadingPlan,
  assignment: ReadingPlanAssignment
) {
  if (!isReadingPlanProgressWritable(plan.status, assignment.status)) {
    throw readingPlanProgressClosed(
      plan.id,
      assignment.id,
      plan.status,
      assignment.status
    );
  }
}

export function isReadingPlanProgressWritable(
  planStatus: ReadingPlanStatus,
  assignmentStatus: ReadingPlanAssignmentStatus
) {
  return (
    planStatus === "published" &&
    assignmentStatus !== "paused" &&
    assignmentStatus !== "abandoned" &&
    assignmentStatus !== "completed"
  );
}

export function resolveReadingPlanAssignmentStateAfterProgress(input: {
  current: ReadingPlanAssignmentStateSnapshot;
  durationDays: number;
  completedDayCount: number;
  now: string;
}): ReadingPlanAssignmentStateSnapshot {
  if (
    input.current.status === "paused" ||
    input.current.status === "abandoned" ||
    input.current.status === "completed"
  ) {
    return input.current;
  }

  if (
    input.durationDays > 0 &&
    input.completedDayCount >= input.durationDays
  ) {
    return {
      status: "completed",
      startedAt: input.current.startedAt ?? input.now,
      completedAt: input.current.completedAt ?? input.now,
      endedAt: input.current.endedAt ?? input.now
    };
  }

  return {
    status: "active",
    startedAt: input.current.startedAt ?? input.now,
    completedAt: null,
    endedAt: null
  };
}

function hasReadingPlanContentChanged(
  existing: ReadingPlan,
  input: ReadingPlanUpdateRequest
) {
  return (
    (input.title !== undefined && input.title.trim() !== existing.title) ||
    (input.description !== undefined &&
      input.description.trim() !== existing.description) ||
    (input.visibility !== undefined &&
      input.visibility !== existing.visibility) ||
    (input.locale !== undefined && input.locale.trim() !== existing.locale) ||
    (input.durationDays !== undefined &&
      input.durationDays !== existing.durationDays)
  );
}
