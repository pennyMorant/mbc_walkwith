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
const filtersSource = readFileSync(
  new URL("../src/features/settings/components/SettingsFiltersCard.vue", import.meta.url),
  "utf8"
);
const querySource = readFileSync(
  new URL(
    "../src/features/settings/composables/use_settings_query.ts",
    import.meta.url
  ),
  "utf8"
);
const messagesSource = readFileSync(
  new URL("../src/core/i18n/i18n.ts", import.meta.url),
  "utf8"
);

describe("settings page composition", () => {
  it("keeps remote state, permissions, parsing, and locale effects page-owned", () => {
    expect(querySource).toContain("listSettings");
    expect(pageSource).toContain("updateSetting");
    expect(pageSource).toContain("authStore.can");
    expect(pageSource).toContain("JSON.parse");
    expect(pageSource).toContain("resetLocaleToSystem");
  });

  it("uses focused presentation components for the grid and editor", () => {
    expect(pageSource).toContain("AdminDataState");
    expect(pageSource).toContain('@retry="refreshList"');
    expect(pageSource).toContain("<SettingsGroupGrid");
    expect(pageSource).toContain("<SettingsEditorDrawer");
    expect(pageSource).toContain("<SettingsFiltersCard");
    for (const source of [gridSource, drawerSource, filtersSource]) {
      expect(source).not.toContain("@/core/api/");
      expect(source).not.toContain("useAdminAuthStore");
      expect(source).not.toContain("useMutation");
    }
  });

  it("keeps query errors separate from editor mutation errors", () => {
    expect(pageSource).toContain(":error-message=\"initialQueryError\"");
    expect(pageSource).toContain("backgroundQueryError");
    expect(pageSource).toContain(":error-message=\"errorMessage\"");
  });

  it("keeps filter drafts and stale editor results guarded", () => {
    expect(querySource).toContain("appliedFilters");
    expect(querySource).toContain("sameSettingsFilters");
    expect(filtersSource).toContain("$emit('apply')");
    expect(filtersSource).not.toContain("refetch");
    expect(pageSource).toContain("editorContextVersion");
    expect(pageSource).toContain("isCurrentEditorContext");
    expect(drawerSource).toContain('v-model="drawerProxy"');
  });

  it("preserves every supported setting editor projection", () => {
    for (const editorType of ["boolean", "select", "number", "string", "landing"]) {
      expect(drawerSource).toContain(`editorType === '${editorType}'`);
    }
    expect(drawerSource).toContain("settings.jsonAdvanced");
    expect(drawerSource).toContain("PublicLandingStructuredEditor");
  });

  it("defines settings filter and recovery copy in every locale", () => {
    for (const key of [
      "settings.applyFilters",
      "settings.clearFilters",
      "settings.loaded",
      "settings.refreshFailed"
    ]) {
      expect(messagesSource.match(new RegExp(`"${key}"`, "g"))?.length).toBe(4);
    }
  });
});
