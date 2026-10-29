import { describe, expect, test } from "bun:test";

import {
  createPrayerListFilterForm,
  createPrayerModerationForm,
  fillPrayerModerationForm,
  prayerApprovalPayload,
  prayerCommandTargetsSelection,
  prayerListFilterSnapshot,
  prayerModerationPayload,
  resetPrayerListFilterForm,
  samePrayerListFilters
} from "../src/features/prayer/prayer_workspace_models";

describe("prayer workspace models", () => {
  test("keeps editable filters separate from the applied snapshot", () => {
    const filters = createPrayerListFilterForm();
    Object.assign(filters, {
      query: "  healing  ",
      status: "pending",
      visibility: "group",
      groupId: "  group-1  "
    });

    const snapshot = prayerListFilterSnapshot(filters);

    expect(snapshot).toEqual({
      query: "healing",
      status: "pending",
      visibility: "group",
      groupId: "group-1"
    });
    expect(filters.query).toBe("  healing  ");
    expect(samePrayerListFilters(snapshot, { ...snapshot })).toBe(true);

    resetPrayerListFilterForm(filters);
    expect(filters).toEqual({
      query: "",
      status: "",
      visibility: "",
      groupId: ""
    });
  });

  test("accepts command results only for the open canonical request", () => {
    expect(prayerCommandTargetsSelection("prayer-1", true, "prayer-1")).toBe(
      true
    );
    expect(prayerCommandTargetsSelection("prayer-2", true, "prayer-1")).toBe(
      false
    );
    expect(prayerCommandTargetsSelection("prayer-1", false, "prayer-1")).toBe(
      false
    );
  });

  test("builds an atomic approval intent from the current moderation form", () => {
    const form = createPrayerModerationForm();
    Object.assign(form, {
      visibility: "group",
      groupId: "  friday-fellowship  ",
      moderationNote: "  Approved for group care.  ",
      notifyAppOnApprove: true
    });

    expect(prayerApprovalPayload(form)).toEqual({
      visibility: "group",
      groupId: "friday-fellowship",
      moderationNote: "Approved for group care.",
      notifyApp: true
    });
  });

  test("clears group scope outside group visibility", () => {
    const form = createPrayerModerationForm();
    form.visibility = "members";
    form.groupId = "stale-group";

    expect(prayerModerationPayload(form)).toMatchObject({
      visibility: "members",
      groupId: null
    });
  });

  test("loads canonical request state and resets notification intent", () => {
    const form = createPrayerModerationForm();
    form.notifyAppOnApprove = true;
    fillPrayerModerationForm(form, {
      id: "prayer-1",
      authorUserId: "member-1",
      title: "Care",
      body: "Please pray.",
      visibility: "members",
      groupId: null,
      status: "pending",
      submitterName: "Member",
      submitterEmail: "member@example.com",
      moderationNote: "Review carefully.",
      moderatedAt: null,
      moderatedByAdminUserId: null,
      createdAt: "2026-07-13T10:00:00.000Z",
      updatedAt: "2026-07-13T10:00:00.000Z"
    });

    expect(form).toMatchObject({
      visibility: "members",
      groupId: "",
      moderationNote: "Review carefully.",
      notifyAppOnApprove: false
    });
  });
});
