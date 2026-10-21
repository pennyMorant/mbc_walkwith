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
});
