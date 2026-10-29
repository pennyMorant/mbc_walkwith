import { describe, expect, test } from "bun:test";

import {
  createGroupCatalogFilterForm,
  groupCatalogFilterSnapshot,
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
});
