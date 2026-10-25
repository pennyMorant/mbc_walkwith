import { describe, expect, test } from "bun:test";

describe("admin authentication UI", () => {
  test("keeps login validation and redirects inside the auth surface", async () => {
    const loginPage = await Bun.file(
      new URL("../src/features/auth/pages/LoginPage.vue", import.meta.url)
    ).text();

    expect(loginPage).toContain("emailValid");
    expect(loginPage).toContain("safeInternalRedirect");
    expect(loginPage).toContain('autocomplete="username"');
    expect(loginPage).toContain('autocomplete="current-password"');
    expect(loginPage).toContain("t('auth.showPassword')");
    expect(loginPage).toContain(":disabled=\"loginMutation.isPending.value\"");
  });

  test("owns password change state outside the application shell", async () => {
    const [shell, dialog] = await Promise.all([
      Bun.file(new URL("../src/layouts/AdminShell.vue", import.meta.url)).text(),
      Bun.file(
        new URL(
          "../src/features/auth/components/AdminPasswordDialog.vue",
          import.meta.url
        )
      ).text()
    ]);

    expect(shell).toContain("<AdminPasswordDialog");
    expect(shell).not.toContain("changeAdminPassword");
    expect(dialog).toContain("changeAdminPassword");
    expect(dialog).toContain("passwordMismatch");
    expect(dialog).toContain('autocomplete="new-password"');
    expect(dialog).toContain("changePasswordMutation.reset()");
    expect(dialog).toContain(':persistent="changePasswordMutation.isPending.value"');
  });

  test("defines the authentication refinement copy in every locale", async () => {
    const i18n = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();
    const keys = [
      "auth.confirmPassword",
      "auth.invalidEmail",
      "auth.passwordMinimum",
      "auth.passwordMismatch",
      "auth.showPassword",
      "auth.welcomeBody",
      "auth.welcomeTitle"
    ];

    for (const key of keys) {
      expect(i18n.match(new RegExp(`"${key}"`, "g"))?.length).toBe(4);
    }
  });
});
