import { describe, expect, test } from "bun:test";

import {
  formatServingDateTime,
  servingAssignmentLabel,
  servingCheckInRequiresReason,
  servingMemberLabel,
  servingMemberLabelById
} from "../src/features/serving/serving_presenters";

describe("serving presenters", () => {
  const member = {
    id: "member-1",
    displayName: "Grace Lee",
    email: "grace@example.com",
    status: "active" as const
  };

  test("formats canonical member and assignment labels", () => {
    expect(servingMemberLabel(member)).toBe("Grace Lee · grace@example.com");
    expect(servingMemberLabelById([member], "member-1")).toBe(
      "Grace Lee · grace@example.com"
    );
    expect(servingMemberLabelById([], "member-2")).toBe("member-2");
    expect(
      servingAssignmentLabel({
        id: "assignment-1",
        teamId: "team-1",
        teamName: "Hospitality",
        roleId: "role-1",
        roleName: "Welcome desk",
        userId: "member-1",
        memberDisplayName: "Grace Lee",
        memberEmail: "grace@example.com",
        title: "Sunday welcome",
        startsAt: "2026-07-19T09:00:00.000Z",
        endsAt: null,
        location: "Lobby",
        status: "scheduled",
        note: "",
        responseNote: "",
        createdAt: "2026-07-13T00:00:00.000Z",
        updatedAt: "2026-07-13T00:00:00.000Z"
      })
    ).toBe("Sunday welcome · Grace Lee");
  });

  test("formats timestamps and keeps invalid input visible", () => {
    expect(
      formatServingDateTime("2026-07-19T09:00:00.000Z", "en-US")
    ).toContain("2026");
    expect(formatServingDateTime(null, "en-US")).toBe("—");
    expect(formatServingDateTime("invalid", "en-US")).toBe("invalid");
  });

  test("requires a reason only when correcting an existing status", () => {
    expect(servingCheckInRequiresReason(undefined, "checked_in")).toBeFalse();
    expect(
      servingCheckInRequiresReason(
        {
          id: "check-in-1",
          assignmentId: "assignment-1",
          userId: "member-1",
          status: "checked_in",
          checkedInAt: "2026-07-19T09:00:00.000Z",
          note: "",
          createdAt: "2026-07-19T09:00:00.000Z",
          updatedAt: "2026-07-19T09:00:00.000Z"
        },
        "missed"
      )
    ).toBeTrue();
  });
});
