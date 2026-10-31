import type {
  GroupApplicationStatus,
  GroupAttendanceStatus,
  GroupMaterialType,
  GroupTaskStatus,
  LifePostVisibility,
  MinistryGroupUpsertRequest,
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

export type GroupApplicationFilterForm = {
  status: GroupApplicationStatus | "";
  query: string;
};

export type GroupMaterialFilterForm = {
  status: GroupTaskStatus | "";
  materialType: GroupMaterialType | "";
};

export type GroupAttendanceFilterForm = {
  status: GroupAttendanceStatus | "";
};

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

export function groupApplicationFilterSnapshot(
  form: GroupApplicationFilterForm
): Readonly<GroupApplicationFilterForm> {
  return { status: form.status, query: form.query.trim() };
}

export function groupMaterialFilterSnapshot(
  form: GroupMaterialFilterForm
): Readonly<GroupMaterialFilterForm> {
  return { status: form.status, materialType: form.materialType };
}

export function groupAttendanceFilterSnapshot(
  form: GroupAttendanceFilterForm
): Readonly<GroupAttendanceFilterForm> {
  return { status: form.status };
}

export function groupEditorPayload(
  form: GroupEditorForm
): MinistryGroupUpsertRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    meetingTime: form.meetingTime.trim(),
    location: form.location.trim(),
    leaderName: form.leaderName.trim(),
    visibility: form.visibility,
    status: form.status,
    capacity: normalizeCapacity(form.capacity)
  };
}

export function sameGroupIntent(first: unknown, second: unknown) {
  return JSON.stringify(first) === JSON.stringify(second);
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

function normalizeCapacity(value: number | null | undefined) {
  if (value == null) return null;
  const capacity = Math.floor(Number(value));
  return Number.isFinite(capacity) && capacity > 0 ? capacity : null;
}
