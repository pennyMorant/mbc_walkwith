import { describe, expect, test } from "bun:test";

import {
  careFilterSnapshot,
  careFollowUpPayloadFromForm,
  careRequestPayloadFromForm,
  createCareFollowUpEditorForm,
  createCareRequestEditorForm,
  dateTimeInputToIso,
  isoToDateTimeInput,
  loadCareRequestEditorForm,
  resetCareFollowUpEditorForm
} from "../src/features/care/care_workspace_models";

describe("care workspace models", () => {
  test("snapshots normalized filters only when the page applies them", () => {
    expect(
      careFilterSnapshot({ query: "  prayer  ", status: "in_progress" })
    ).toEqual({ query: "prayer", status: "in_progress", limit: 100 });
  });

  test("loads a request without replacing the reactive form identity", () => {
    const form = createCareRequestEditorForm();
    const identity = form;

    loadCareRequestEditorForm(form, {
      id: "care-1",
      userId: "member-1",
      memberDisplayName: "Grace Member",
      memberEmail: "grace@example.com",
      title: "Prayer support",
      body: "Please pray.",
      status: "assigned",
      privacyLevel: "assigned_team",
      assigneeAdminUserId: null,
      assigneeName: "",
      internalNote: "  Keep private.  ",
      nextFollowUpAt: "2026-10-25T18:30:00.000Z",
      followUps: [],
      version: 1,
      createdAt: "2026-10-24T18:30:00.000Z",
      updatedAt: "2026-10-25T18:30:00.000Z"
    });

    expect(form).toBe(identity);
    expect(form.status).toBe("assigned");
    expect(dateTimeInputToIso(form.nextFollowUpAt)).toBe(
      "2026-10-25T18:30:00.000Z"
    );
    expect(careRequestPayloadFromForm(form).internalNote).toBe("Keep private.");
  });

  test("normalizes and resets a follow-up intent", () => {
    const form = createCareFollowUpEditorForm();
    const identity = form;
    form.note = "  Called the member.  ";
    form.status = "planned";
    form.plannedAt = "2026-10-26T09:00";

    const payload = careFollowUpPayloadFromForm(form);
    expect(payload.note).toBe("Called the member.");
    expect(payload.plannedAt).toBe(new Date("2026-10-26T09:00").toISOString());

    resetCareFollowUpEditorForm(form);
    expect(form).toBe(identity);
    expect(form).toEqual({ note: "", status: "completed", plannedAt: "" });
  });

  test("round-trips stored instants through a local datetime input", () => {
    const instant = "2026-11-08T17:45:00.000Z";
    expect(dateTimeInputToIso(isoToDateTimeInput(instant))).toBe(instant);
    expect(isoToDateTimeInput("invalid")).toBe("");
  });
});
