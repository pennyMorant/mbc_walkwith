import type {
  ServingAssignment,
  ServingAvailabilityRecord
} from "@mbc/api-contracts";

import type { ServingAssignmentScheduleState } from "./serving.repository.js";

type TimeValue = string | Date;

export type AssignmentScheduleLike = {
  id: string;
  userId: string;
  startsAt: TimeValue;
  endsAt: TimeValue | null;
  status: ServingAssignment["status"];
};

type AvailabilityScheduleLike = Pick<
  ServingAvailabilityRecord,
  "id" | "userId"
> & {
  startsAt: TimeValue;
  endsAt: TimeValue;
};

const scheduleOccupyingStatuses = new Set<ServingAssignment["status"]>([
  "scheduled",
  "confirmed",
  "swap_requested"
]);

export function assignmentScheduleState(
  assignment: AssignmentScheduleLike
): ServingAssignmentScheduleState {
  return {
    id: assignment.id,
    userId: assignment.userId,
    startsAt: toIso(assignment.startsAt),
    endsAt: assignment.endsAt ? toIso(assignment.endsAt) : null,
    status: assignment.status
  };
}

export function assignmentConflictIds(
  assignments: AssignmentScheduleLike[],
  next: ServingAssignmentScheduleState,
  excludeId?: string
) {
  if (!scheduleOccupyingStatuses.has(next.status)) {
    return [];
  }
  return assignments
    .filter((assignment) => {
      if (
        assignment.id === excludeId ||
        assignment.userId !== next.userId ||
        !scheduleOccupyingStatuses.has(assignment.status)
      ) {
        return false;
      }
      return timeRangesOverlap(
        next.startsAt,
        assignmentRangeEnd(next),
        assignment.startsAt,
        assignmentRangeEnd(assignment)
      );
    })
    .map((assignment) => assignment.id);
}

export function availabilityConflictIds(
  records: AvailabilityScheduleLike[],
  next: Omit<AvailabilityScheduleLike, "id">
) {
  return records
    .filter(
      (record) =>
        record.userId === next.userId &&
        timeRangesOverlap(
          next.startsAt,
          next.endsAt,
          record.startsAt,
          record.endsAt
        )
    )
    .map((record) => record.id);
}

function assignmentRangeEnd(assignment: {
  startsAt: TimeValue;
  endsAt: TimeValue | null;
}) {
  if (assignment.endsAt) {
    return assignment.endsAt;
  }
  return new Date(new Date(assignment.startsAt).getTime() + 1);
}

function timeRangesOverlap(
  firstStart: TimeValue,
  firstEnd: TimeValue,
  secondStart: TimeValue,
  secondEnd: TimeValue
) {
  return (
    new Date(firstStart).getTime() < new Date(secondEnd).getTime() &&
    new Date(firstEnd).getTime() > new Date(secondStart).getTime()
  );
}

function toIso(value: TimeValue) {
  return typeof value === "string" ? value : value.toISOString();
}
