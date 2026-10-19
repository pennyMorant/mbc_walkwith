import { describe, expect, test } from "bun:test";

describe("admin media recovery boundary", () => {
  test("uses media permissions and complete locale copy", async () => {
    const [router, shell, messages] = await Promise.all([
      Bun.file(new URL("../src/router.ts", import.meta.url)).text(),
      Bun.file(new URL("../src/layouts/AdminShell.vue", import.meta.url)).text(),
      Bun.file(new URL("../src/core/i18n/i18n.ts", import.meta.url)).text()
    ]);

    expect(router).toContain('path: "/media"');
    expect(router).toContain('meta: adminPageMeta("media:read")');
    expect(shell).toContain('permission: "media:read"');
    for (const key of [
      "nav.media",
      "media.title",
      "media.subtitle",
      "media.cleanupTitle",
      "media.cleanupSubtitle",
      "media.cleanupEmpty",
      "media.asset",
      "relocated_source"
    ]) {
      expect(messages.match(new RegExp(`"${key}"`, "g"))?.length).toBe(4);
    }
  });
});
