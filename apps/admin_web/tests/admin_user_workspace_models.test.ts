import { describe, expect, test } from "bun:test";

import {
  adminUserCreatePayloadFromForm,
  adminUserResetPasswordPayloadFromForm,
  adminUserUpdatePayloadFromForm,
  createAdminUserCreateForm,
  createAdminUserEditForm,
  isValidAdminEmail,
  loadAdminUserEditForm,
  passwordsMatch,
  resetAdminUserCreateForm,
  resetAdminUserPasswordForm
} from "../src/features/users/admin_user_workspace_models";

describe("admin user workspace models", () => {
  test("normalizes account creation without sending confirmation state", () => {
    const form = createAdminUserCreateForm();
    form.email = " owner@example.com ";
    form.name = " Church Owner ";
    form.role = "owner";
    form.password = "password-123";
    form.confirmPassword = "password-123";

    expect(adminUserCreatePayloadFromForm(form)).toEqual({
      email: "owner@example.com",
      name: "Church Owner",
      role: "owner",
      password: "password-123"
    });
  });

  test("loads canonical user state and clears password fields", () => {
    const form = createAdminUserEditForm();
    const identity = form;
    form.password = "stale-password";
    form.confirmPassword = "stale-password";

    loadAdminUserEditForm(form, {
      id: "admin-1",
      email: "pastor@example.com",
      name: "Pastor",
      role: "pastor",
      status: "active"
    });

    expect(form).toBe(identity);
    expect(adminUserUpdatePayloadFromForm(form)).toEqual({
      name: "Pastor",
      role: "pastor",
      status: "active"
    });
    expect(form.password).toBe("");
    expect(form.confirmPassword).toBe("");
  });

  test("keeps reset payload focused and resets the reactive form", () => {
    const form = createAdminUserEditForm();
    form.password = "new-password";
    form.confirmPassword = "new-password";

    expect(adminUserResetPasswordPayloadFromForm(form)).toEqual({
      password: "new-password"
    });
    resetAdminUserPasswordForm(form);
    expect(form.password).toBe("");
    expect(form.confirmPassword).toBe("");
  });

  test("validates email and password confirmation before commands", () => {
    expect(isValidAdminEmail("admin@example.com")).toBe(true);
    expect(isValidAdminEmail("admin@example")).toBe(false);
    expect(passwordsMatch("password", "password")).toBe(true);
    expect(passwordsMatch("password", "different")).toBe(false);
  });

  test("resets creation state without replacing its identity", () => {
    const form = createAdminUserCreateForm();
    const identity = form;
    form.email = "admin@example.com";
    form.role = "admin";

    resetAdminUserCreateForm(form);
    expect(form).toBe(identity);
    expect(form.email).toBe("");
    expect(form.role).toBe("viewer");
  });
});
