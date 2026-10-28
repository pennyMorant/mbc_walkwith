import { describe, expect, test } from "bun:test";

import {
  createSettingsFilterForm,
  isCurrentSettingEditorContext,
  resetSettingsFilterForm,
  sameSettingsFilters,
  settingsFilterSnapshot
} from "../src/features/settings/settings_workspace_models";

describe("settings workspace models", () => {
  test("normalizes applied filters without mutating the editable draft", () => {
    const form = createSettingsFilterForm();
    form.category = "member";
    form.query = "  registration  ";

    expect(settingsFilterSnapshot(form)).toEqual({
      category: "member",
      query: "registration"
    });
    expect(form.query).toBe("  registration  ");
  });

  test("compares and resets filters without replacing reactive identity", () => {
    const form = createSettingsFilterForm();
    const identity = form;
    form.category = "church";

    expect(
      sameSettingsFilters(settingsFilterSnapshot(form), {
        category: "church",
        query: ""
      })
    ).toBe(true);

    resetSettingsFilterForm(form);
    expect(form).toBe(identity);
    expect(form).toEqual(createSettingsFilterForm());
  });

  test("accepts asynchronous editor results only for the active setting", () => {
    const context = { settingKey: "church.name", contextVersion: 3 };

    expect(
      isCurrentSettingEditorContext(context, "church.name", 3)
    ).toBe(true);
    expect(
      isCurrentSettingEditorContext(context, "church.timezone", 3)
    ).toBe(false);
    expect(
      isCurrentSettingEditorContext(context, "church.name", 4)
    ).toBe(false);
  });
});
