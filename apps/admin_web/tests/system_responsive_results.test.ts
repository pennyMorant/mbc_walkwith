import { describe, expect, test } from "bun:test";

const userResults = await Bun.file(
  new URL("../src/features/users/components/AdminUserResults.vue", import.meta.url)
).text();
const notificationResults = await Bun.file(
  new URL(
    "../src/features/notifications/components/NotificationDeliveryResults.vue",
    import.meta.url
  )
).text();
const auditResults = await Bun.file(
  new URL("../src/features/audit/components/AuditLogResults.vue", import.meta.url)
).text();
const dataState = await Bun.file(
  new URL("../src/core/ui/AdminDataState.vue", import.meta.url)
).text();
const systemPages = await Promise.all(
  [
    "users/pages/UsersPage.vue",
    "notifications/pages/NotificationsPage.vue",
    "audit/pages/AuditLogsPage.vue"
  ].map((path) =>
    Bun.file(new URL(`../src/features/${path}`, import.meta.url)).text()
  )
);
const messages = await Bun.file(
  new URL("../src/core/i18n/i18n.ts", import.meta.url)
).text();

describe("system workspace responsive results", () => {
  test.each([
    ["users", userResults, 'v-for="user in users"'],
    ["notifications", notificationResults, 'v-for="delivery in deliveries"'],
    ["audit", auditResults, 'v-for="log in logs"']
  ])("keeps %s desktop and mobile projections presentation-only", (_, source, loop) => {
    expect(source).toContain("d-none d-md-block");
    expect(source).toContain("d-md-none");
    expect(source.split(loop)).toHaveLength(3);
    expect(source).toContain("$emit('open'");
    expect(source).not.toContain("@/core/api");
    expect(source).not.toContain("auth_store");
  });

  test("localizes system empty states in every supported locale", () => {
    expect(messages.match(/users\.empty/g)).toHaveLength(4);
    expect(messages.match(/audit\.empty/g)).toHaveLength(4);
  });

  test("shares query presentation while pages retain retry ownership", () => {
    for (const source of [userResults, notificationResults, auditResults]) {
      expect(source).toContain("AdminDataState");
      expect(source).toContain("$emit('retry')");
    }
    expect(dataState).not.toContain("@/core/api");
    expect(dataState).not.toContain("useQuery");
    expect(dataState).not.toContain("useAdminAuthStore");
    for (const page of systemPages) {
      expect(page).toMatch(
        /@retry="(?:\w+Query\.refetch\(\)|refreshList)"/
      );
    }
  });

  test("keeps admin user commands and stale-response guards page-owned", async () => {
    const [page, createCard, editor] = await Promise.all([
      Bun.file(
        new URL("../src/features/users/pages/UsersPage.vue", import.meta.url)
      ).text(),
      Bun.file(
        new URL(
          "../src/features/users/components/AdminUserCreateCard.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/users/components/AdminUserEditorDrawer.vue",
          import.meta.url
        )
      ).text()
    ]);

    expect(page).toContain("editorContextVersion");
    expect(page).toContain("isCurrentEditorContext");
    expect(page).toContain("syncCurrentAdminSession");
    expect(page).toContain("authStore.clearSession()");
    expect(page).toContain("<AdminUserCreateCard");
    expect(page).toContain("<AdminUserEditorDrawer");
    expect(editor).toContain(":disabled=\"editorDisabled\"");
    expect(editor).toContain('v-model="drawerProxy"');
    expect(editor).toContain("passwordResetConfirmTitle");
    expect(page).toContain("resetPasswordMutation.isPending.value");
    expect(page).toContain("updateMutation.isPending.value");
    for (const source of [createCard, editor]) {
      expect(source).not.toContain("@/core/api");
      expect(source).not.toContain("auth_store");
    }
  });

  test("defines the refined admin user copy in every locale", () => {
    for (const key of [
      "users.pageTitle",
      "users.confirmPassword",
      "users.currentAccount",
      "users.passwordResetConfirmTitle",
      "users.passwordResetSuccess"
    ]) {
      expect(messages.match(new RegExp(`"${key}"`, "g"))?.length).toBe(4);
    }
    expect(messages).toContain('"viewer": "Solo lectura"');
    expect(messages).toContain('"viewer": "唯讀"');
  });

  test("keeps notification pagination and command ownership out of presentation", async () => {
    const [page, filters, drawer, query] = await Promise.all([
      Bun.file(
        new URL(
          "../src/features/notifications/pages/NotificationsPage.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/notifications/components/NotificationDeliveryFiltersCard.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/notifications/components/NotificationDeliveryDetailDrawer.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/notifications/composables/use_notification_delivery_query.ts",
          import.meta.url
        )
      ).text()
    ]);

    expect(page).toContain("taskContextVersion");
    expect(page).toContain("isCurrentTaskContext");
    expect(page).toContain("taskCommandPending");
    expect(page).toContain("backgroundQueryError");
    expect(page).toContain("<NotificationDeliveryFiltersCard");
    expect(page).toContain("<NotificationDeliveryDetailDrawer");
    expect(query).toContain("useInfiniteQuery");
    expect(query).toContain("appliedFilters");
    expect(drawer).toContain('v-model="drawerProxy"');
    expect(drawer).toContain("cancelConfirmTitle");
    for (const source of [filters, drawer]) {
      expect(source).not.toContain("@/core/api");
      expect(source).not.toContain("auth_store");
    }
  });

  test("defines the notification recovery copy in every locale", () => {
    for (const key of [
      "notifications.applyFilters",
      "notifications.refreshFailed",
      "notifications.cancelConfirmTitle",
      "notifications.providerEvidenceHelp"
    ]) {
      expect(messages.match(new RegExp(`"${key}"`, "g"))?.length).toBe(4);
    }
  });
});
