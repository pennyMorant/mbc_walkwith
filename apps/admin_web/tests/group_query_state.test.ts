import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = source("pages/GroupsPage.vue");
const controller = source("composables/use_group_ministry_page.ts");
const activity = source("composables/use_group_activity_workspace.ts");
const workspace = source("components/GroupWorkspaceCard.vue");
const panelState = source("components/GroupPanelState.vue");

describe("group workspace query and command state", () => {
  test("applies remote filter drafts through explicit snapshots", () => {
    expect(controller).toContain("appliedApplicationFilters");
    expect(controller).toContain("function applyApplicationFilters()");
    expect(activity).toContain("appliedMaterialFilters");
    expect(activity).toContain("appliedAttendanceFilters");
    expect(page).toContain('@apply-application-filters="applyApplicationFilters"');
    expect(page).toContain('@apply-material-filters="applyMaterialFilters"');
    expect(page).toContain('@apply-attendance-filters="applyAttendanceFilters"');
  });

  test("keeps query recovery and command feedback region-owned", () => {
    expect(panelState).toContain("AdminDataState");
    expect(panelState).toContain('v-if="refreshErrorMessage"');
    expect(panelState).toContain('v-if="commandErrorMessage"');
    for (const region of [
      "applications",
      "memberships",
      "materials",
      "attendance"
    ]) {
      expect(controller).toContain(`${region}ErrorMessage`);
      expect(controller).toContain(`${region}RefreshErrorMessage`);
      expect(controller).toContain(`${region}CommandErrorMessage`);
    }
    expect(workspace).not.toContain("useQuery");
  });

  test("freezes every write target before starting transport", () => {
    expect(controller).toContain("payload: groupEditorPayload(form)");
    expect(controller).toContain("{ groupId, applicationId, status }");
    expect(controller).toContain("{ groupId, userId: membership.userId, status }");
    expect(activity).toContain("const payload = materialCreatePayload(materialForm)");
    expect(activity).toContain("{ groupId, materialId: material.id, status }");
    expect(activity).toContain("const payload = attendancePayload(attendanceForm)");
    expect(page).not.toContain(".mutate({ membership");
    expect(page).not.toContain("materialCreateMutation.mutate()");
  });

  test("keeps transport ownership out of presentation components", () => {
    for (const file of [
      "GroupApplicationsPanel.vue",
      "GroupMembershipsPanel.vue",
      "GroupMaterialsPanel.vue",
      "GroupAttendancePanel.vue"
    ]) {
      const component = source(`components/${file}`);
      expect(component).toContain("GroupPanelState");
      expect(component).not.toContain("useQuery");
      expect(component).not.toContain("useMutation");
      expect(component).not.toContain("apiClient");
    }
  });
});

function source(path: string) {
  return readFileSync(
    new URL(`../src/features/groups/${path}`, import.meta.url),
    "utf8"
  );
}
