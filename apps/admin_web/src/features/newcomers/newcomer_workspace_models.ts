import type {
  NewcomerFollowUpStatus,
  NewcomerStatus
} from "@mbc/api-contracts";

export interface NewcomerListFilterForm {
  query: string;
  status: NewcomerStatus | "";
}

export interface NewcomerListFilterSnapshot {
  query: string;
  status: NewcomerStatus | "";
}

export function createNewcomerListFilterForm(): NewcomerListFilterForm {
  return { query: "", status: "" };
}

export function newcomerListFilterSnapshot(
  filters: NewcomerListFilterForm
): NewcomerListFilterSnapshot {
  return {
    query: filters.query.trim(),
    status: filters.status
  };
}

export function sameNewcomerListFilters(
  current: NewcomerListFilterSnapshot,
  next: NewcomerListFilterSnapshot
) {
  return current.query === next.query && current.status === next.status;
}

export function resetNewcomerListFilterForm(filters: NewcomerListFilterForm) {
  filters.query = "";
  filters.status = "";
}

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
