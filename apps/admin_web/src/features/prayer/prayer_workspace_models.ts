import type {
  AdminPrayerRequest,
  AdminPrayerRequestApproveRequest,
  AdminPrayerRequestUpdateRequest,
  PrayerVisibility
} from "@mbc/api-contracts";

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
