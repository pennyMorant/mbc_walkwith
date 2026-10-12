import { describe, expect, test } from "bun:test";

import {
  createPrayerModerationForm,
  fillPrayerModerationForm,
  prayerApprovalPayload,
  prayerModerationPayload
} from "../src/features/prayer/prayer_workspace_models";

describe("prayer workspace models", () => {
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
