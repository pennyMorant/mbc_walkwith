import { describe, expect, test } from "bun:test";

import {
  eventRegistrationCountLabel,
  eventRegistrationPageCount,
  eventRegistrationStatusColor
} from "../src/features/life-posts/life_event_registration_presenters";
import {
  createLifeEventRegistrationWorkspace,
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
});
