import type {
  GroupAttendanceStatus,
  GroupMaterialType,
  GroupTaskStatus,
  LifePostVisibility,
  MinistryGroupStatus
} from "@mbc/api-contracts";

export type GroupEditorForm = {
  name: string;
  description: string;
  meetingTime: string;
  location: string;
  leaderName: string;
  visibility: LifePostVisibility;
  status: MinistryGroupStatus;
  capacity: number | null;
};

export type GroupCatalogFilterForm = {
  query: string;
  status: MinistryGroupStatus | "";
  visibility: LifePostVisibility | "";
};

export type GroupCatalogFilterSnapshot = Readonly<GroupCatalogFilterForm>;

export function createGroupCatalogFilterForm(): GroupCatalogFilterForm {
  return { query: "", status: "", visibility: "" };
}

export function groupCatalogFilterSnapshot(
  form: GroupCatalogFilterForm
): GroupCatalogFilterSnapshot {
  return {
    query: form.query.trim(),
    status: form.status,
    visibility: form.visibility
  };
}

export function sameGroupCatalogFilters(
  first: GroupCatalogFilterSnapshot,
  second: GroupCatalogFilterSnapshot
) {
  return (
    first.query === second.query &&
    first.status === second.status &&
    first.visibility === second.visibility
  );
}

export function resetGroupCatalogFilterForm(form: GroupCatalogFilterForm) {
  Object.assign(form, createGroupCatalogFilterForm());
}

export type GroupMaterialForm = {
  materialType: GroupMaterialType;
  materialId: string;
  title: string;
  status: GroupTaskStatus;
  dueAt: string;
};

export type GroupAttendanceForm = {
  meetingDate: string;
  memberUserId: string;
  status: GroupAttendanceStatus;
  note: string;
};

export function resetGroupActivityForms(
  materialForm: GroupMaterialForm,
  attendanceForm: GroupAttendanceForm,
  meetingDate = currentGroupDateTimeInput()
) {
  materialForm.materialType = "manual";
  materialForm.materialId = "";
  materialForm.title = "";
  materialForm.status = "assigned";
  materialForm.dueAt = "";
  attendanceForm.meetingDate = meetingDate;
  attendanceForm.memberUserId = "";
  attendanceForm.status = "present";
  attendanceForm.note = "";
}

export function currentGroupDateTimeInput(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
