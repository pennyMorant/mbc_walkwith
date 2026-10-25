import type {
  MemberCreateRequest,
  MemberProfile,
  MemberRole,
  MemberStatus,
  MemberUpdateRequest
} from "@mbc/api-contracts";

import type { MemberListFilters } from "@/core/api/members";

export type MemberFilterDraft = {
  query: string;
  status: MemberStatus | "";
  fellowshipGroupId: string;
};

export type MemberEditorForm = {
  email: string;
  displayName: string;
  phone: string;
  status: MemberStatus;
  roles: MemberRole[];
  appLocale: "en" | "es" | "zh-Hans" | "zh-Hant";
  fellowshipGroupId: string;
  weeklyBulletin: boolean;
  sermonPublished: boolean;
  lifePostPublished: boolean;
  prayerUpdates: boolean;
};

export function createMemberEditorForm(): MemberEditorForm {
  return {
    email: "",
    displayName: "",
    phone: "",
    status: "active",
    roles: ["member"],
    appLocale: "en",
    fellowshipGroupId: "",
    weeklyBulletin: true,
    sermonPublished: true,
    lifePostPublished: true,
    prayerUpdates: false
  };
}

export function resetMemberEditorForm(form: MemberEditorForm) {
  Object.assign(form, createMemberEditorForm());
}

export function loadMemberEditorForm(
  form: MemberEditorForm,
  member: MemberProfile
) {
  Object.assign(form, {
    email: member.email,
    displayName: member.displayName,
    phone: member.phone ?? "",
    status: member.status,
    roles: member.roles.length > 0 ? [...member.roles] : ["member"],
    appLocale: member.appLocale,
    fellowshipGroupId: member.fellowshipGroupId ?? "",
    weeklyBulletin: member.notificationSettings.weeklyBulletin,
    sermonPublished: member.notificationSettings.sermonPublished,
    lifePostPublished: member.notificationSettings.lifePostPublished,
    prayerUpdates: member.notificationSettings.prayerUpdates
  });
}

export function memberPayloadFromForm(
  form: MemberEditorForm
): MemberCreateRequest & MemberUpdateRequest {
  return {
    email: form.email.trim(),
    displayName: form.displayName.trim(),
    phone: form.phone.trim() || null,
    status: form.status,
    roles: [...form.roles],
    appLocale: form.appLocale,
    fellowshipGroupId: form.fellowshipGroupId.trim() || null,
    notificationSettings: {
      weeklyBulletin: form.weeklyBulletin,
      sermonPublished: form.sermonPublished,
      lifePostPublished: form.lifePostPublished,
      prayerUpdates: form.prayerUpdates
    }
  };
}

export function memberFilterSnapshot(
  draft: MemberFilterDraft
): MemberListFilters {
  return {
    query: draft.query.trim(),
    status: draft.status,
    fellowshipGroupId: draft.fellowshipGroupId.trim(),
    limit: 50
  };
}
