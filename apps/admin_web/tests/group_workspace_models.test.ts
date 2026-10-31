import { describe, expect, test } from "bun:test";

import {
  createGroupCatalogFilterForm,
  groupApplicationFilterSnapshot,
  groupAttendanceFilterSnapshot,
  groupCatalogFilterSnapshot,
  groupEditorPayload,
  groupMaterialFilterSnapshot,
  resetGroupCatalogFilterForm,
  resetGroupActivityForms,
  type GroupAttendanceForm,
  type GroupMaterialForm
} from "../src/features/groups/group_workspace_models";

describe("group workspace models", () => {
  test("keeps group catalog drafts separate from applied filters", () => {
    const form = createGroupCatalogFilterForm();
    const identity = form;
    form.query = "  fellowship  ";
    form.status = "active";

    expect(groupCatalogFilterSnapshot(form)).toEqual({
      query: "fellowship",
      status: "active",
      visibility: ""
    });
    expect(form.query).toBe("  fellowship  ");

    resetGroupCatalogFilterForm(form);
    expect(form).toBe(identity);
    expect(form).toEqual(createGroupCatalogFilterForm());
  });

  test("resets group-scoped command forms when the selected group changes", () => {
    const materialForm: GroupMaterialForm = {
      materialType: "course",
      materialId: "course-1",
      title: "Course",
      status: "completed",
      dueAt: "2026-07-20T19:00"
    };
    const attendanceForm: GroupAttendanceForm = {
      meetingDate: "2026-07-13T19:00",
      memberUserId: "member-1",
      status: "absent",
      note: "Old group note"
    };

    resetGroupActivityForms(
      materialForm,
      attendanceForm,
      "2026-07-14T19:00"
    );

    expect(materialForm).toEqual({
      materialType: "manual",
      materialId: "",
      title: "",
      status: "assigned",
      dueAt: ""
    });
    expect(attendanceForm).toEqual({
      meetingDate: "2026-07-14T19:00",
      memberUserId: "",
      status: "present",
      note: ""
    });
  });

  test("normalizes subresource filter snapshots without changing drafts", () => {
    const applications = { status: "submitted" as const, query: "  lee  " };
    const materials = { status: "assigned" as const, materialType: "course" as const };
    const attendance = { status: "present" as const };

    expect(groupApplicationFilterSnapshot(applications)).toEqual({
      status: "submitted",
      query: "lee"
    });
    expect(groupMaterialFilterSnapshot(materials)).toEqual(materials);
    expect(groupAttendanceFilterSnapshot(attendance)).toEqual(attendance);
    expect(applications.query).toBe("  lee  ");
  });

  test("freezes a normalized group save intent", () => {
    const form = {
      name: "  Grace Group  ",
      description: "  Weekly fellowship  ",
      meetingTime: " Friday ",
      location: " Room 2 ",
      leaderName: " Leader ",
      visibility: "members" as const,
      status: "active" as const,
      capacity: 12.8
    };

    expect(groupEditorPayload(form)).toEqual({
      name: "Grace Group",
      description: "Weekly fellowship",
      meetingTime: "Friday",
      location: "Room 2",
      leaderName: "Leader",
      visibility: "members",
      status: "active",
      capacity: 12
    });
    expect(form.name).toBe("  Grace Group  ");
  });
});
