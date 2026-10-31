import { describe, expect, test } from "bun:test";

import {
  createMemberEditorForm,
  isValidOptionalYear,
  loadMemberEditorForm,
  memberFilterSnapshot,
  memberPayloadFromForm,
  resetMemberEditorForm,
  sameMemberFilters
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
    form.address = "  123 Church Street ";
    form.faithStartYear = " 2004 ";
    form.baptizedYear = "2005";
    form.joinedChurchAt = "2020-01-05";
    form.emergencyContactName = " Grace Contact ";
    form.emergencyContactPhone = " 555-0100 ";
    form.fellowshipGroupId = " group-1 ";
    const payload = memberPayloadFromForm(form);

    expect(payload.email).toBe("member@example.com");
    expect(payload.displayName).toBe("Grace Member");
    expect(payload.phone).toBeNull();
    expect(payload.address).toBe("123 Church Street");
    expect(payload.faithStartYear).toBe(2004);
    expect(payload.baptizedYear).toBe(2005);
    expect(payload.joinedChurchAt).toBe("2020-01-05");
    expect(payload.emergencyContactName).toBe("Grace Contact");
    expect(payload.emergencyContactPhone).toBe("555-0100");
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

  test("loads every admin-editable profile field from member detail", () => {
    const form = createMemberEditorForm();
    loadMemberEditorForm(form, {
      id: "member-1",
      email: "member@example.com",
      displayName: "Member",
      phone: "555-0101",
      address: "123 Church Street",
      faithStartYear: 2004,
      baptizedYear: 2005,
      joinedChurchAt: "2020-01-05",
      emergencyContactName: "Grace Contact",
      emergencyContactPhone: "555-0100",
      status: "active",
      roles: ["member"],
      appLocale: "en",
      fellowshipGroupId: null,
      notificationSettings: {
        weeklyBulletin: true,
        sermonPublished: true,
        lifePostPublished: true,
        prayerUpdates: false
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(form.address).toBe("123 Church Street");
    expect(form.faithStartYear).toBe("2004");
    expect(form.baptizedYear).toBe("2005");
    expect(form.joinedChurchAt).toBe("2020-01-05");
    expect(form.emergencyContactName).toBe("Grace Contact");
    expect(form.emergencyContactPhone).toBe("555-0100");
  });

  test("validates optional four-digit profile years", () => {
    expect(isValidOptionalYear("")).toBe(true);
    expect(isValidOptionalYear("2004")).toBe(true);
    expect(isValidOptionalYear("1899")).toBe(false);
    expect(isValidOptionalYear("200")).toBe(false);
    expect(isValidOptionalYear("year")).toBe(false);
  });

  test("compares applied member filter snapshots without serialization", () => {
    const filters = memberFilterSnapshot({
      query: "grace",
      status: "active",
      fellowshipGroupId: "group-1"
    });
    expect(sameMemberFilters(filters, { ...filters })).toBe(true);
    expect(sameMemberFilters(filters, { ...filters, query: "hope" })).toBe(false);
  });
});
