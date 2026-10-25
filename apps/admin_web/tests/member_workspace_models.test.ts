import { describe, expect, test } from "bun:test";

import {
  createMemberEditorForm,
  memberFilterSnapshot,
  memberPayloadFromForm,
  resetMemberEditorForm
} from "../src/features/members/member_workspace_models";

describe("member workspace models", () => {
  test("snapshots trimmed filters only when the page applies them", () => {
    expect(
      memberFilterSnapshot({
        query: "  grace  ",
        status: "active",
        fellowshipGroupId: "  group-1 "
      })
    ).toEqual({
      query: "grace",
      status: "active",
      fellowshipGroupId: "group-1",
      limit: 50
    });
  });

  test("builds a normalized member intent without sharing role state", () => {
    const form = createMemberEditorForm();
    form.email = " member@example.com ";
    form.displayName = " Grace Member ";
    form.phone = "   ";
    form.fellowshipGroupId = " group-1 ";
    const payload = memberPayloadFromForm(form);

    expect(payload.email).toBe("member@example.com");
    expect(payload.displayName).toBe("Grace Member");
    expect(payload.phone).toBeNull();
    expect(payload.fellowshipGroupId).toBe("group-1");
    expect(payload.roles).not.toBe(form.roles);
  });

  test("resets the existing reactive form identity", () => {
    const form = createMemberEditorForm();
    const identity = form;
    form.email = "changed@example.com";
    form.roles = ["pastor"];

    resetMemberEditorForm(form);

    expect(form).toBe(identity);
    expect(form.email).toBe("");
    expect(form.roles).toEqual(["member"]);
  });
});
