import type { AppSetting } from "@mbc/api-contracts";
import { describe, expect, test } from "bun:test";

import {
  settingEditorType,
  settingPreview,
  settingPreviewColor
} from "../src/features/settings/settings_editor_presenters";

const baseSetting: AppSetting = {
  key: "church.name",
  category: "church",
  label: "Church name",
  description: "",
  value: "MBCG",
  updatedAt: "2026-10-27T12:00:00.000Z"
};

const previewOptions = {
  localeItems: [{ title: "System", value: "system" }],
  registrationModeItems: [{ title: "Open", value: "open" }],
  t: (key: string) => key
};

describe("settings editor presenters", () => {
  test("selects editors from canonical setting keys and value types", () => {
    expect(settingEditorType(baseSetting)).toBe("string");
    expect(
      settingEditorType({ ...baseSetting, key: "church.timezone" })
    ).toBe("select");
    expect(settingEditorType({ ...baseSetting, value: true })).toBe("boolean");
    expect(settingEditorType({ ...baseSetting, value: 12 })).toBe("number");
    expect(settingEditorType({ ...baseSetting, value: { nested: true } })).toBe(
      "json"
    );
  });

  test("formats known choices, structured summaries, and boolean colors", () => {
    expect(
      settingPreview(
        { ...baseSetting, key: "app.defaultLocale", value: "system" },
        previewOptions
      )
    ).toBe("System");
    expect(
      settingPreview({ ...baseSetting, value: ["one", "two"] }, previewOptions)
    ).toBe("2 settings.arrayItems");
    expect(settingPreviewColor({ ...baseSetting, value: true })).toBe(
      "success"
    );
    expect(settingPreviewColor({ ...baseSetting, value: false })).toBe("grey");
  });
});
