import { describe, expect, test } from "bun:test";

import {
  assignmentPayload,
  availabilityPayload,
  checkInPayload,
  createAssignmentForm,
  createAvailabilityForm,
  createCheckInForm,
  createRoleForm,
  createTeamForm,
  dateTimeInputToIso,
  hasValidDateRange,
  rolePayload,
  sameServingPayload,
  teamPayload
} from "../src/features/serving/serving_workspace_models";

describe("serving workspace models", () => {
  test("normalizes assignment intent without member snapshot fields", () => {
    const form = createAssignmentForm();
    Object.assign(form, {
      teamId: "team-1",
      roleId: "role-1",
      userId: "member-1",
      title: "  Welcome desk  ",
      startsAt: "2026-07-19T09:00:00.000Z",
      endsAt: "2026-07-19T10:00:00.000Z",
      location: "  Lobby  ",
      note: "  Arrive early  "
    });

    expect(assignmentPayload(form)).toEqual({
      teamId: "team-1",
      roleId: "role-1",
      userId: "member-1",
      title: "Welcome desk",
      startsAt: "2026-07-19T09:00:00.000Z",
      endsAt: "2026-07-19T10:00:00.000Z",
      location: "Lobby",
      status: "scheduled",
      note: "Arrive early"
    });
  });

  test("rejects invalid and reversed time ranges", () => {
    expect(dateTimeInputToIso("not-a-date")).toBeNull();
    expect(
      hasValidDateRange(
        "2026-07-19T10:00:00.000Z",
        "2026-07-19T09:00:00.000Z"
      )
    ).toBeFalse();
    expect(
      hasValidDateRange(
        "2026-07-19T09:00:00.000Z",
        "2026-07-19T10:00:00.000Z"
      )
    ).toBeTrue();
  });

  test("builds canonical availability intent", () => {
    const form = createAvailabilityForm();
    Object.assign(form, {
      userId: "member-1",
      startsAt: "2026-07-19T09:00:00.000Z",
      endsAt: "2026-07-19T12:00:00.000Z",
      status: "preferred",
      note: "  Morning service  "
    });

    expect(availabilityPayload(form)).toEqual({
      userId: "member-1",
      startsAt: "2026-07-19T09:00:00.000Z",
      endsAt: "2026-07-19T12:00:00.000Z",
      status: "preferred",
      note: "Morning service"
    });
  });

  test("compares canonical submitted intents instead of mutable form identity", () => {
    const teamForm = createTeamForm();
    teamForm.name = "  Welcome  ";
    const submittedTeam = teamPayload(teamForm);
    expect(sameServingPayload(teamPayload(teamForm), submittedTeam)).toBeTrue();
    teamForm.name = "Worship";
    expect(sameServingPayload(teamPayload(teamForm), submittedTeam)).toBeFalse();

    const roleForm = createRoleForm();
    roleForm.teamId = "team-1";
    roleForm.name = "  Greeter  ";
    expect(rolePayload(roleForm).name).toBe("Greeter");

    const checkInForm = createCheckInForm();
    checkInForm.assignmentId = "assignment-1";
    checkInForm.note = "  verified  ";
    expect(checkInPayload(checkInForm)).toEqual({
      assignmentId: "assignment-1",
      status: "checked_in",
      note: "verified"
    });
  });
});
