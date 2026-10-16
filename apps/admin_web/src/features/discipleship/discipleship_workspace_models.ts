import type {
  DiscipleshipAssignmentCreateRequest,
  DiscipleshipJourneyCreateRequest,
  DiscipleshipJourneyStatus,
  DiscipleshipStageCreateRequest,
  DiscipleshipTaskCreateRequest,
  DiscipleshipTaskProgressUpdateRequest,
  DiscipleshipTaskReferenceType,
  DiscipleshipTaskStatus
} from "@mbc/api-contracts";

export type DiscipleshipStageForm = {
  title: string;
  description: string;
  sort: number;
};

export type DiscipleshipTaskForm = {
  stageId: string;
  title: string;
  description: string;
  referenceType: DiscipleshipTaskReferenceType;
  referenceId: string;
  required: boolean;
  sort: number;
};

export function createDiscipleshipJourneyForm(): DiscipleshipJourneyCreateRequest {
  return { title: "", description: "", status: "draft" };
}

export function createDiscipleshipStageForm(): DiscipleshipStageForm {
  return { title: "", description: "", sort: 0 };
}

export function createDiscipleshipTaskForm(): DiscipleshipTaskForm {
  return {
    stageId: "",
    title: "",
    description: "",
    referenceType: "manual_review",
    referenceId: "",
    required: true,
    sort: 0
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
    sort: normalizeDiscipleshipSort(form.sort)
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
    sort: normalizeDiscipleshipSort(form.sort)
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

export function normalizeDiscipleshipSort(value: number) {
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
