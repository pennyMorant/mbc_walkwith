import { describe, expect, test } from "bun:test";

import {
  createGivingFundForm,
  fillGivingFundForm,
  givingFundCreatePayload,
  givingFundUpdatePayload,
  isGivingFundCodeValid,
  isGivingFundFormValid,
  parseTargetAmountCents,
  resetGivingFundForm
} from "../src/features/giving/giving_workspace_models";

describe("giving workspace models", () => {
  test("validates stable fund codes through the shared contract", () => {
    expect(isGivingFundCodeValid("community_care")).toBeTrue();
    expect(isGivingFundCodeValid("building-2026")).toBeTrue();
    expect(isGivingFundCodeValid("Community Care")).toBeFalse();
    expect(isGivingFundCodeValid("community care")).toBeFalse();
  });

  test("parses target dollars without silent rounding", () => {
    expect(parseTargetAmountCents("")).toEqual({ valid: true, value: null });
    expect(parseTargetAmountCents("12.34")).toEqual({
      valid: true,
      value: 1234
    });
    expect(parseTargetAmountCents("12.345").valid).toBeFalse();
    expect(parseTargetAmountCents("999999999999").valid).toBeFalse();
  });

  test("keeps fund code out of update intents", () => {
    const form = createGivingFundForm();
    Object.assign(form, {
      code: "community_care",
      name: "  Community Care  ",
      description: "  Local mercy ministry.  ",
      status: "active",
      targetAmountDollars: "2500.00",
      displayOrder: 4.9
    });

    expect(isGivingFundFormValid(form)).toBeTrue();
    expect(givingFundCreatePayload(form)).toEqual({
      code: "community_care",
      name: "Community Care",
      description: "Local mercy ministry.",
      status: "active",
      targetAmountCents: 250000,
      displayOrder: 4
    });
    expect(givingFundUpdatePayload(form)).toEqual({
      name: "Community Care",
      description: "Local mercy ministry.",
      status: "active",
      targetAmountCents: 250000,
      displayOrder: 4
    });
    expect(givingFundUpdatePayload(form)).not.toHaveProperty("code");
  });

  test("fills and resets the form from canonical fund state", () => {
    const form = createGivingFundForm();
    fillGivingFundForm(form, {
      id: "fund-1",
      code: "missions",
      name: "Missions",
      description: "Global missions.",
      status: "paused",
      targetAmountCents: 12345,
      displayOrder: 8,
      totalAmountCents: 5000,
      transactionCount: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z"
    });
    expect(form.targetAmountDollars).toBe("123.45");
    expect(form.status).toBe("paused");

    resetGivingFundForm(form);
    expect(form).toEqual(createGivingFundForm());
  });
});
