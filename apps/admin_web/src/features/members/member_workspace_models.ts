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
  address: string;
  faithStartYear: string;
  baptizedYear: string;
  joinedChurchAt: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
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
    address: "",
    faithStartYear: "",
    baptizedYear: "",
    joinedChurchAt: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
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
    address: member.address ?? "",
    faithStartYear: member.faithStartYear?.toString() ?? "",
    baptizedYear: member.baptizedYear?.toString() ?? "",
    joinedChurchAt: member.joinedChurchAt ?? "",
    emergencyContactName: member.emergencyContactName ?? "",
    emergencyContactPhone: member.emergencyContactPhone ?? "",
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
    address: form.address.trim() || null,
    faithStartYear: nullableYear(form.faithStartYear),
    baptizedYear: nullableYear(form.baptizedYear),
    joinedChurchAt: form.joinedChurchAt || null,
    emergencyContactName: form.emergencyContactName.trim() || null,
    emergencyContactPhone: form.emergencyContactPhone.trim() || null,
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

export function createMemberFilterDraft(): MemberFilterDraft {
  return {
    query: "",
    status: "",
    fellowshipGroupId: ""
  };
}

export function sameMemberFilters(
  left: MemberListFilters,
  right: MemberListFilters
) {
  return (
    left.query === right.query &&
    left.status === right.status &&
    left.fellowshipGroupId === right.fellowshipGroupId &&
    left.limit === right.limit
  );
}

export function isValidOptionalYear(value: string) {
  if (!value.trim()) {
    return true;
  }
  return (
    /^\d{4}$/.test(value.trim()) &&
    Number(value) >= 1900 &&
    Number(value) <= 2100
  );
}

function nullableYear(value: string): number | null {
  const clean = value.trim();
  return clean ? Number(clean) : null;
}
