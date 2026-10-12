import type { DiscipleshipAssignmentStatus } from "@mbc/api-contracts";

export type DiscipleshipAssignmentStateSnapshot = {
  status: DiscipleshipAssignmentStatus;
  startedAt: string | null;
  completedAt: string | null;
};

export function resolveAssignmentStateAfterProgress(input: {
  current: DiscipleshipAssignmentStateSnapshot;
  taskTotalCount: number;
  completedTaskCount: number;
  now: string;
}): DiscipleshipAssignmentStateSnapshot {
  if (
    input.current.status === "blocked" ||
    input.current.status === "paused" ||
    input.current.status === "cancelled"
  ) {
    return input.current;
  }

  if (
    input.taskTotalCount > 0 &&
    input.completedTaskCount >= input.taskTotalCount
  ) {
    return {
      status: "completed",
      startedAt: input.current.startedAt ?? input.now,
      completedAt: input.current.completedAt ?? input.now
    };
  }

  if (
    input.current.status === "not_started" ||
    input.current.status === "completed"
  ) {
    return {
      status: "in_progress",
      startedAt: input.current.startedAt ?? input.now,
      completedAt: null
    };
  }

  return input.current;
}
