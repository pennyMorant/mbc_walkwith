import type {
  ServingAdminAssignmentCreateRequest,
  ServingAdminAvailabilityCreateRequest,
  ServingAssignmentStatus,
  ServingAvailabilityStatus,
  ServingCheckInStatus,
  ServingRoleUpsertRequest,
  ServingTeamUpsertRequest
} from "@mbc/api-contracts";

export type ServingTeamForm = ServingTeamUpsertRequest;
export type ServingRoleForm = ServingRoleUpsertRequest;

export type ServingAssignmentForm = Omit<
  ServingAdminAssignmentCreateRequest,
  "startsAt" | "endsAt"
> & {
  startsAt: string;
  endsAt: string;
};

export type ServingAvailabilityForm = Omit<
  ServingAdminAvailabilityCreateRequest,
  "startsAt" | "endsAt"
> & {
  startsAt: string;
  endsAt: string;
};

export type ServingCheckInForm = {
  assignmentId: string;
  status: ServingCheckInStatus;
  note: string;
};

export type ServingCheckInIntent = ServingCheckInForm;

export function createTeamForm(): ServingTeamForm {
  return { name: "", description: "", status: "active" };
}

export function createRoleForm(): ServingRoleForm {
  return {
    teamId: "",
    name: "",
    description: "",
    status: "active"
  };
}

export function createAssignmentForm(): ServingAssignmentForm {
  return {
    teamId: "",
    roleId: "",
    userId: "",
    title: "",
    startsAt: "",
    endsAt: "",
    location: "",
    status: "scheduled" as ServingAssignmentStatus,
    note: ""
  };
}

export function createAvailabilityForm(): ServingAvailabilityForm {
  return {
    userId: "",
    startsAt: "",
    endsAt: "",
    status: "available" as ServingAvailabilityStatus,
    note: ""
  };
}

export function createCheckInForm(): ServingCheckInForm {
  return { assignmentId: "", status: "checked_in", note: "" };
}

export function teamPayload(form: ServingTeamForm): ServingTeamUpsertRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status
  };
}

export function rolePayload(form: ServingRoleForm): ServingRoleUpsertRequest {
  return {
    teamId: form.teamId,
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status
  };
}

export function checkInPayload(form: ServingCheckInForm): ServingCheckInIntent {
  return {
    assignmentId: form.assignmentId,
    status: form.status,
    note: form.note.trim()
  };
}

export function sameServingPayload(left: object | null, right: object | null) {
  return (
    left !== null &&
    right !== null &&
    JSON.stringify(left) === JSON.stringify(right)
  );
}

export function dateTimeInputToIso(value: string): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function hasValidDateRange(startsAt: string, endsAt: string): boolean {
  const start = dateTimeInputToIso(startsAt);
  const end = endsAt ? dateTimeInputToIso(endsAt) : null;
  if (!start || (endsAt && !end)) {
    return false;
  }
  return !end || new Date(end).getTime() > new Date(start).getTime();
}

export function assignmentPayload(
  form: ServingAssignmentForm
): ServingAdminAssignmentCreateRequest | null {
  const startsAt = dateTimeInputToIso(form.startsAt);
  const endsAt = form.endsAt ? dateTimeInputToIso(form.endsAt) : null;
  if (!startsAt || (form.endsAt && !endsAt)) {
    return null;
  }
  return {
    teamId: form.teamId,
    roleId: form.roleId,
    userId: form.userId,
    title: form.title.trim(),
    startsAt,
    endsAt,
    location: form.location.trim(),
    status: form.status,
    note: form.note.trim()
  };
}

export function availabilityPayload(
  form: ServingAvailabilityForm
): ServingAdminAvailabilityCreateRequest | null {
  const startsAt = dateTimeInputToIso(form.startsAt);
  const endsAt = dateTimeInputToIso(form.endsAt);
  if (!startsAt || !endsAt) {
    return null;
  }
  return {
    userId: form.userId,
    startsAt,
    endsAt,
    status: form.status,
    note: form.note.trim()
  };
}
