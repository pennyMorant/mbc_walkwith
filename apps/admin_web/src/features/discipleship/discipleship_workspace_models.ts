import type {
  DiscipleshipAssignmentCreateRequest,
  DiscipleshipAssignmentStatus,
  DiscipleshipJourneyCreateRequest,
  DiscipleshipJourneyStatus,
  DiscipleshipStageCreateRequest,
  DiscipleshipTaskCreateRequest,
  DiscipleshipTaskProgressUpdateRequest,
  DiscipleshipTaskReferenceType,
  DiscipleshipTaskStatus
} from "@mbc/api-contracts";

export type DiscipleshipJourneyFilterForm = {
  query: string;
  status: DiscipleshipJourneyStatus | "";
};

export type DiscipleshipAssignmentFilterForm = {
  status: DiscipleshipAssignmentStatus | "";
  userId: string;
};

export type DiscipleshipStageForm = {
  title: string;
  description: string;
  position: number;
};

export type DiscipleshipTaskForm = {
  stageId: string;
  title: string;
  description: string;
  referenceType: DiscipleshipTaskReferenceType;
  referenceId: string;
  required: boolean;
  position: number;
};

export function createDiscipleshipJourneyFilterForm(): DiscipleshipJourneyFilterForm {
  return { query: "", status: "" };
}

export function snapshotDiscipleshipJourneyFilters(
  filters: DiscipleshipJourneyFilterForm
): DiscipleshipJourneyFilterForm {
  return { query: filters.query.trim(), status: filters.status };
}

export function sameDiscipleshipJourneyFilters(
  current: DiscipleshipJourneyFilterForm,
  next: DiscipleshipJourneyFilterForm
) {
  return current.query === next.query && current.status === next.status;
}

export function createDiscipleshipAssignmentFilterForm(): DiscipleshipAssignmentFilterForm {
  return { status: "", userId: "" };
}

export function snapshotDiscipleshipAssignmentFilters(
  filters: DiscipleshipAssignmentFilterForm
): DiscipleshipAssignmentFilterForm {
  return { status: filters.status, userId: filters.userId.trim() };
}

export function sameDiscipleshipAssignmentFilters(
  current: DiscipleshipAssignmentFilterForm,
  next: DiscipleshipAssignmentFilterForm
) {
  return current.status === next.status && current.userId === next.userId;
}

export function discipleshipCommandTargetsJourney(
  selectedJourneyId: string | null,
  commandJourneyId: string | null
) {
  return selectedJourneyId === commandJourneyId;
}

export function createDiscipleshipJourneyForm(): DiscipleshipJourneyCreateRequest {
  return { title: "", description: "", status: "draft" };
}

export function createDiscipleshipStageForm(): DiscipleshipStageForm {
  return { title: "", description: "", position: 0 };
}

export function createDiscipleshipTaskForm(): DiscipleshipTaskForm {
  return {
    stageId: "",
    title: "",
    description: "",
    referenceType: "manual_review",
    referenceId: "",
    required: true,
    position: 0
  };
}

export function createDiscipleshipAssignmentForm(
  journeyId = ""
): DiscipleshipAssignmentCreateRequest {
  return {
    journeyId,
    userId: "",
    sourceType: "member",
    sourceId: null,
    assigneeAdminUserId: null,
    assigneeName: ""
  };
}

export function resetDiscipleshipWorkForms(
  stageForm: DiscipleshipStageForm,
  taskForm: DiscipleshipTaskForm
) {
  Object.assign(stageForm, createDiscipleshipStageForm());
  Object.assign(taskForm, createDiscipleshipTaskForm());
}

export function resetDiscipleshipAssignmentForm(
  form: DiscipleshipAssignmentCreateRequest,
  journeyId: string
) {
  Object.assign(form, createDiscipleshipAssignmentForm(journeyId));
}

export function buildDiscipleshipJourneyPayload(
  form: DiscipleshipJourneyCreateRequest
): DiscipleshipJourneyCreateRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status
  };
}

export function buildDiscipleshipStagePayload(
  form: DiscipleshipStageForm
): DiscipleshipStageCreateRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    position: normalizeDiscipleshipPosition(form.position)
  };
}

export function buildDiscipleshipTaskPayload(
  form: DiscipleshipTaskForm
): DiscipleshipTaskCreateRequest {
  return {
    stageId: form.stageId.trim() || null,
    title: form.title.trim(),
    description: form.description.trim(),
    referenceType: form.referenceType,
    referenceId: form.referenceId.trim(),
    required: form.required,
    position: normalizeDiscipleshipPosition(form.position)
  };
}

export function buildDiscipleshipAssignmentPayload(
  form: DiscipleshipAssignmentCreateRequest,
  journeyId: string
): DiscipleshipAssignmentCreateRequest {
  return {
    journeyId,
    userId: form.userId.trim(),
    sourceType: form.sourceType,
    sourceId:
      form.sourceType === "newcomer" ? form.sourceId?.trim() || null : null,
    assigneeAdminUserId: form.assigneeAdminUserId?.trim() || null,
    assigneeName: form.assigneeName.trim()
  };
}

export function buildDiscipleshipProgressPayload(input: {
  status: DiscipleshipTaskStatus;
  note: string;
}): DiscipleshipTaskProgressUpdateRequest {
  return { status: input.status, note: input.note.trim() };
}

export function normalizeDiscipleshipPosition(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function discipleshipJourneyStatusColor(
  status: DiscipleshipJourneyStatus
) {
  return {
    draft: "grey",
    active: "success",
    paused: "warning",
    archived: "secondary"
  }[status];
}
