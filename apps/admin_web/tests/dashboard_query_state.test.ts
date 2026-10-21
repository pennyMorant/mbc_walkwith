import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/dashboard/pages/DashboardPage.vue", import.meta.url),
  "utf8"
);

describe("dashboard query state", () => {
  test("offers a shared retry state when the initial dashboard query fails", () => {
    expect(page).toContain("AdminDataState");
    expect(page).toContain(':error-message="initialErrorMessage"');
    expect(page).toContain('@retry="dashboardQuery.refetch()"');
    expect(page).toContain('dashboardQuery.error.value && !dashboardQuery.data.value');
  });

  test("keeps the last dashboard snapshot visible when a refresh fails", () => {
    expect(page).toContain('<template v-if="dashboardQuery.data.value">');
    expect(page).toContain('<v-alert v-if="dashboardQuery.error.value"');
    expect(page).toContain("dashboardQuery.data.value.snapshot.status === 'stale'");
  });
});
