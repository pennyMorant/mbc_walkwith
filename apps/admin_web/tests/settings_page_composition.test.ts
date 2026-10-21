import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../src/features/settings/pages/SettingsPage.vue", import.meta.url),
  "utf8"
);
const gridSource = readFileSync(
  new URL("../src/features/settings/components/SettingsGroupGrid.vue", import.meta.url),
  "utf8"
);
const drawerSource = readFileSync(
  new URL("../src/features/settings/components/SettingsEditorDrawer.vue", import.meta.url),
  "utf8"
);

describe("settings page composition", () => {
  it("keeps remote state, permissions, parsing, and locale effects page-owned", () => {
    expect(pageSource).toContain("listSettings");
    expect(pageSource).toContain("updateSetting");
    expect(pageSource).toContain("authStore.can");
    expect(pageSource).toContain("JSON.parse");
    expect(pageSource).toContain("resetLocaleToSystem");
  });

  it("uses focused presentation components for the grid and editor", () => {
    expect(pageSource).toContain("AdminDataState");
    expect(pageSource).toContain('@retry="settingsQuery.refetch()"');
    expect(pageSource).toContain("<SettingsGroupGrid");
    expect(pageSource).toContain("<SettingsEditorDrawer");
    for (const source of [gridSource, drawerSource]) {
      expect(source).not.toContain("@/core/api/");
      expect(source).not.toContain("useAdminAuthStore");
      expect(source).not.toContain("useMutation");
    }
  });

  it("keeps query errors separate from editor mutation errors", () => {
    expect(pageSource).toContain(":error-message=\"settingsQuery.error.value");
    expect(pageSource).toContain(":error-message=\"errorMessage\"");
  });

  it("preserves every supported setting editor projection", () => {
    for (const editorType of ["boolean", "select", "number", "string", "landing"]) {
      expect(drawerSource).toContain(`editorType === '${editorType}'`);
    }
    expect(drawerSource).toContain("settings.jsonAdvanced");
    expect(drawerSource).toContain("PublicLandingStructuredEditor");
  });
});
