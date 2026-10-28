import { describe, expect, test } from "bun:test";

import {
  auditLogFilterSnapshot,
  createAuditLogFilterForm,
  resetAuditLogFilterForm,
  sameAuditLogFilters
} from "../src/features/audit/audit_log_workspace_models";

describe("audit log workspace models", () => {
  test("normalizes applied filters without mutating the editable draft", () => {
    const form = createAuditLogFilterForm();
    form.actorUserId = "  admin-id  ";
    form.action = "  member.update  ";
    form.resourceType = "  member  ";
    form.resourceId = "  member-id  ";

    expect(auditLogFilterSnapshot(form)).toEqual({
      actorUserId: "admin-id",
      action: "member.update",
      resourceType: "member",
      resourceId: "member-id"
    });
    expect(form.action).toBe("  member.update  ");
  });

  test("compares and resets filters without replacing reactive identity", () => {
    const form = createAuditLogFilterForm();
    const identity = form;
    form.action = "member.update";

    expect(
      sameAuditLogFilters(auditLogFilterSnapshot(form), {
        actorUserId: "",
        action: "member.update",
        resourceType: "",
        resourceId: ""
      })
    ).toBe(true);

    resetAuditLogFilterForm(form);
    expect(form).toBe(identity);
    expect(form).toEqual(createAuditLogFilterForm());
  });
});
