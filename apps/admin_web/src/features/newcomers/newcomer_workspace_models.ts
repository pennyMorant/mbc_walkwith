import type { NewcomerFollowUpStatus } from "@mbc/api-contracts";

export function newcomerFollowUpHasRequiredSchedule(
  status: NewcomerFollowUpStatus,
  plannedAtIso: string | null
) {
  return status === "completed" || plannedAtIso !== null;
}

export function newcomerResultTargetsSelection(
  selectedNewcomerId: string | null,
  resultNewcomerId: string
) {
  return selectedNewcomerId === resultNewcomerId;
}
