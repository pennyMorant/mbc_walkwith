import type {
  AdminPrayerRequest,
  AdminPrayerRequestApproveRequest,
  AdminPrayerRequestUpdateRequest,
  PrayerStatus,
  PrayerVisibility
} from "@mbc/api-contracts";

export type PrayerListFilterForm = {
  query: string;
  status: PrayerStatus | "";
  visibility: PrayerVisibility | "";
  groupId: string;
};

export type PrayerListFilterSnapshot = PrayerListFilterForm;

export function createPrayerListFilterForm(): PrayerListFilterForm {
  return { query: "", status: "", visibility: "", groupId: "" };
}

export function prayerListFilterSnapshot(
  filters: PrayerListFilterForm
): PrayerListFilterSnapshot {
  return {
    query: filters.query.trim(),
    status: filters.status,
    visibility: filters.visibility,
    groupId: filters.groupId.trim()
  };
}

export function samePrayerListFilters(
  current: PrayerListFilterSnapshot,
  next: PrayerListFilterSnapshot
) {
  return (
    current.query === next.query &&
    current.status === next.status &&
    current.visibility === next.visibility &&
    current.groupId === next.groupId
  );
}

export function resetPrayerListFilterForm(filters: PrayerListFilterForm) {
  filters.query = "";
  filters.status = "";
  filters.visibility = "";
  filters.groupId = "";
}

export function prayerCommandTargetsSelection(
  selectedRequestId: string | null,
  drawerOpen: boolean,
  commandRequestId: string
) {
  return drawerOpen && selectedRequestId === commandRequestId;
}

export type PrayerModerationForm = {
  visibility: PrayerVisibility;
  groupId: string;
  moderationNote: string;
  notifyAppOnApprove: boolean;
};

export function createPrayerModerationForm(): PrayerModerationForm {
  return {
    visibility: "private",
    groupId: "",
    moderationNote: "",
    notifyAppOnApprove: false
  };
}

export function fillPrayerModerationForm(
  form: PrayerModerationForm,
  request: AdminPrayerRequest
) {
  form.visibility = request.visibility;
  form.groupId = request.groupId ?? "";
  form.moderationNote = request.moderationNote;
  form.notifyAppOnApprove = false;
}

export function prayerModerationPayload(
  form: PrayerModerationForm
): AdminPrayerRequestUpdateRequest {
  return {
    visibility: form.visibility,
    groupId: form.visibility === "group" ? form.groupId.trim() : null,
    moderationNote: form.moderationNote.trim()
  };
}

export function prayerApprovalPayload(
  form: PrayerModerationForm
): AdminPrayerRequestApproveRequest {
  return {
    ...prayerModerationPayload(form),
    notifyApp: form.notifyAppOnApprove
  };
}
