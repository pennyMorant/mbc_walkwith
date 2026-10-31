import { describe, expect, test } from "bun:test";

import {
  eventRegistrationCountLabel,
  eventRegistrationPageCount,
  eventRegistrationStatusColor
} from "../src/features/life-posts/life_event_registration_presenters";
import {
  buildRegistrationCreateIntent,
  buildRegistrationUpdateIntent,
  createLifeEventRegistrationWorkspace,
  isRegistrationCommandCurrent,
  resetRegistrationCreateForm
} from "../src/features/life-posts/life_event_registration_workspace";

describe("event registration admin presenters", () => {
  test("calculates stable page counts", () => {
    expect(eventRegistrationPageCount(0)).toBe(1);
    expect(eventRegistrationPageCount(25)).toBe(1);
    expect(eventRegistrationPageCount(26)).toBe(2);
  });

  test("uses a singular registration label only for one record", () => {
    expect(eventRegistrationCountLabel(0, (key) => key)).toBe(
      "0 Registrations"
    );
    expect(eventRegistrationCountLabel(1, (key) => key)).toBe(
      "1 Registration"
    );
  });

  test("maps every canonical status to a visual role", () => {
    expect(eventRegistrationStatusColor("confirmed")).toBe("primary");
    expect(eventRegistrationStatusColor("checked_in")).toBe("success");
    expect(eventRegistrationStatusColor("cancelled")).toBe("secondary");
    expect(eventRegistrationStatusColor("absent")).toBe("warning");
  });

  test("resets the manual registration form without replacing its identity", () => {
    const workspace = createLifeEventRegistrationWorkspace();
    const form = workspace.registrationCreateDialog;
    form.attendeeName = "Guest";
    form.attendeeEmail = "guest@example.com";
    form.partySize = 4;
    form.note = "Needs a ride";

    resetRegistrationCreateForm(form);

    expect(form).toMatchObject({
      attendeeName: "",
      attendeeEmail: "",
      partySize: 1,
      note: ""
    });
  });

  test("freezes create and edit intents before async commands start", () => {
    const workspace = createLifeEventRegistrationWorkspace();
    workspace.registrationCreateDialog.attendeeName = "  Guest  ";
    workspace.registrationCreateDialog.attendeeEmail = " guest@example.com ";
    workspace.registrationCreateDialog.partySize = 3;
    workspace.registrationCreateDialog.note = "  Needs a ride  ";
    workspace.registrationEditDialog.registrationId = "registration-1";
    workspace.registrationEditDialog.partySize = 2;
    workspace.registrationEditDialog.note = "  Updated note  ";

    const createIntent = buildRegistrationCreateIntent(
      "post-1",
      workspace.registrationCreateDialog,
      (value) => value.trim() || null
    );
    const updateIntent = buildRegistrationUpdateIntent(
      "post-1",
      workspace.registrationEditDialog
    );
    workspace.registrationCreateDialog.attendeeName = "Changed later";
    workspace.registrationEditDialog.note = "Changed later";

    expect(createIntent).toEqual({
      postId: "post-1",
      payload: {
        attendeeName: "Guest",
        attendeeEmail: "guest@example.com",
        partySize: 3,
        note: "Needs a ride"
      }
    });
    expect(updateIntent).toEqual({
      postId: "post-1",
      registrationId: "registration-1",
      payload: { partySize: 2, note: "Updated note" }
    });
  });

  test("rejects command results from a closed or replaced registration workspace", () => {
    const intent = {
      postId: "post-1",
      workspaceSessionId: 3
    };

    expect(isRegistrationCommandCurrent(intent, 3, "post-1")).toBe(true);
    expect(isRegistrationCommandCurrent(intent, 4, "post-1")).toBe(false);
    expect(isRegistrationCommandCurrent(intent, 3, "post-2")).toBe(false);
  });
});
