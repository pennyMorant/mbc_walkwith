import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/dashboard/pages/DashboardPage.vue", import.meta.url),
  "utf8"
);
const snapshotNotice = readFileSync(
  new URL(
    "../src/features/dashboard/components/DashboardSnapshotNotice.vue",
    import.meta.url
  ),
  "utf8"
);
const systemHealth = readFileSync(
  new URL(
    "../src/features/dashboard/components/DashboardSystemHealth.vue",
    import.meta.url
  ),
  "utf8"
);
const i18n = readFileSync(
  new URL("../src/core/i18n/i18n.ts", import.meta.url),
  "utf8"
);

describe("dashboard query state", () => {
  test("offers a shared retry state when the initial dashboard query fails", () => {
    expect(page).toContain("AdminDataState");
    expect(page).toContain(':error-message="initialErrorMessage"');
    expect(page).toContain('@retry="dashboardQuery.refetch()"');
    expect(page).toContain(
      "dashboardQuery.error.value && dashboardQuery.data.value === undefined"
    );
  });

  test("keeps the last dashboard snapshot visible when a refresh fails", () => {
    expect(page).toContain('<template v-if="dashboardQuery.data.value">');
    expect(page).toContain("DashboardSnapshotNotice");
    expect(page).toContain(':refresh-error-message="refreshErrorMessage"');
    expect(snapshotNotice).toContain("dashboard.lastSuccessful");
    expect(snapshotNotice).toContain("dashboard.lastAttempted");
    expect(snapshotNotice).toContain('@click="$emit(\'retry\')"');
  });

  test("renders health rows as buttons only when the backend supplies a path", () => {
    expect(systemHealth).toContain(":is=\"item.path ? 'button' : 'div'\"");
    expect(systemHealth).toContain("formatDashboardCount(item.value, locale)");
  });

  test("localizes stale snapshot evidence in every supported locale", () => {
    expect(i18n.match(/"dashboard\.lastSuccessful":/g)).toHaveLength(4);
    expect(i18n.match(/"dashboard\.lastAttempted":/g)).toHaveLength(4);
  });
});
