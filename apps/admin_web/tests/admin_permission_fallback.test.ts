import { describe, expect, it } from "vitest";

describe("admin permission fallback", () => {
  it("routes authenticated users without a readable workspace to access denied", async () => {
    const router = await Bun.file(
      new URL("../src/router.ts", import.meta.url)
    ).text();

    expect(router).toContain('path: "/access-denied"');
    expect(router).toContain('meta: { requiresAuth: true }');
    expect(router).toContain('firstAllowedAdminPath(authStore.can) ?? "/access-denied"');
    expect(router).not.toContain("firstAllowedAdminPath(authStore.can) ?? false");
  });

  it("keeps the fallback page free of API and permission ownership", async () => {
    const page = await Bun.file(
      new URL(
        "../src/features/auth/pages/AccessDeniedPage.vue",
        import.meta.url
      )
    ).text();

    expect(page).not.toContain("core/api");
    expect(page).not.toContain("authStore.can");
    expect(page).toContain('t("auth.accessDeniedHelp")');
  });
});
