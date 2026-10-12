import {
  servingAssignmentSchema,
  servingAvailabilityRecordSchema,
  servingCheckInRecordSchema,
  servingTeamSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

const timestamp = "2026-07-12T16:00:00.000Z";

describe("serving response contracts", () => {
  it("does not synthesize missing team fields", () => {
    expect(
      servingTeamSchema.safeParse({
        id: "team-1",
        name: "Welcome Team",
        createdAt: timestamp,
        updatedAt: timestamp
      }).success
    ).toBe(false);
  });

  it("rejects impossible assignment and availability time ranges", () => {
    expect(
      servingAssignmentSchema.safeParse({
        ...assignment(),
        endsAt: "2026-07-12T15:00:00.000Z"
      }).success
    ).toBe(false);
    expect(
      servingAvailabilityRecordSchema.safeParse({
        id: "availability-1",
        userId: "member-1",
        startsAt: timestamp,
        endsAt: timestamp,
        status: "available",
        note: "",
        createdAt: timestamp,
        updatedAt: timestamp
      }).success
    ).toBe(false);
  });

  it("requires check-in status and timestamp to agree", () => {
    const base = {
      id: "check-in-1",
      assignmentId: "assignment-1",
      userId: "member-1",
      note: "",
      createdAt: timestamp,
      updatedAt: timestamp
    };
    expect(
      servingCheckInRecordSchema.safeParse({
        ...base,
        status: "checked_in",
        checkedInAt: null
      }).success
    ).toBe(false);
    expect(
      servingCheckInRecordSchema.safeParse({
        ...base,
        status: "missed",
        checkedInAt: timestamp
      }).success
    ).toBe(false);
  });
});

function assignment() {
  return {
    id: "assignment-1",
    teamId: "team-1",
    teamName: "Welcome Team",
    roleId: "role-1",
    roleName: "Greeter",
    userId: "member-1",
    memberDisplayName: "Member One",
    memberEmail: "member@example.com",
    title: "Sunday welcome",
    startsAt: timestamp,
    endsAt: null,
    location: "Lobby",
    status: "scheduled",
    note: "",
    responseNote: "",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
