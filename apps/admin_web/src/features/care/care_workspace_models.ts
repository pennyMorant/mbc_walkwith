import type {
  CareFollowUpCreateRequest,
  CareFollowUpStatus,
  CarePrivacyLevel,
  CareRequestAdmin,
  CareRequestStatus,
  CareRequestUpdateRequest
} from "@mbc/api-contracts";

import type { CareRequestFilters } from "@/core/api/care";

export type CareFilterDraft = {
  query: string;
  status: CareRequestStatus | "";
};

export type CareRequestEditorForm = {
  status: CareRequestStatus;
  privacyLevel: CarePrivacyLevel;
  assigneeAdminUserId: string | null;
  nextFollowUpAt: string;
  internalNote: string;
};

export type CareFollowUpEditorForm = {
  note: string;
  status: CareFollowUpStatus;
  plannedAt: string;
};

export function careFilterSnapshot(
  draft: CareFilterDraft
): CareRequestFilters {
  return {
    query: draft.query.trim(),
    status: draft.status,
    limit: 100
  };
}

export function createCareRequestEditorForm(): CareRequestEditorForm {
  return {
    status: "submitted",
    privacyLevel: "pastoral_only",
    assigneeAdminUserId: null,
    nextFollowUpAt: "",
    internalNote: ""
  };
}

export function loadCareRequestEditorForm(
  form: CareRequestEditorForm,
  request: CareRequestAdmin
) {
  Object.assign(form, {
    status: request.status,
    privacyLevel: request.privacyLevel,
    assigneeAdminUserId: request.assigneeAdminUserId,
    nextFollowUpAt: isoToDateTimeInput(request.nextFollowUpAt),
    internalNote: request.internalNote
  });
}

export function careRequestPayloadFromForm(
  form: CareRequestEditorForm
): CareRequestUpdateRequest {
  return {
    status: form.status,
    privacyLevel: form.privacyLevel,
    assigneeAdminUserId: form.assigneeAdminUserId,
    nextFollowUpAt: dateTimeInputToIso(form.nextFollowUpAt),
    internalNote: form.internalNote.trim()
  };
}

export function createCareFollowUpEditorForm(): CareFollowUpEditorForm {
  return {
    note: "",
    status: "completed",
    plannedAt: ""
  };
}

export function resetCareFollowUpEditorForm(form: CareFollowUpEditorForm) {
  Object.assign(form, createCareFollowUpEditorForm());
}

export function careFollowUpPayloadFromForm(
  form: CareFollowUpEditorForm
): CareFollowUpCreateRequest {
  return {
    note: form.note.trim(),
    status: form.status,
    plannedAt: dateTimeInputToIso(form.plannedAt)
  };
}

export function isoToDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  const datePart = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-");
  return `${datePart}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dateTimeInputToIso(value: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
