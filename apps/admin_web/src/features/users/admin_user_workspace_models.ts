import type {
  AdminCreateUserRequest,
  AdminResetPasswordRequest,
  AdminRole,
  AdminUpdateUserRequest,
  AdminUser,
  AdminUserStatus
} from "@mbc/api-contracts";

export const adminRoleItems: AdminRole[] = [
  "owner",
  "admin",
  "pastor",
  "content_editor",
  "finance",
  "viewer"
];

export type AdminUserCreateForm = {
  email: string;
  name: string;
  role: AdminRole;
  password: string;
  confirmPassword: string;
};

export type AdminUserEditForm = {
  name: string;
  role: AdminRole;
  status: AdminUserStatus;
  password: string;
  confirmPassword: string;
};

export function createAdminUserCreateForm(): AdminUserCreateForm {
  return {
    email: "",
    name: "",
    role: "viewer",
    password: "",
    confirmPassword: ""
  };
}

export function resetAdminUserCreateForm(form: AdminUserCreateForm) {
  Object.assign(form, createAdminUserCreateForm());
}

export function createAdminUserEditForm(): AdminUserEditForm {
  return {
    name: "",
    role: "viewer",
    status: "active",
    password: "",
    confirmPassword: ""
  };
}

export function loadAdminUserEditForm(
  form: AdminUserEditForm,
  user: AdminUser
) {
  Object.assign(form, {
    name: user.name,
    role: user.role,
    status: user.status,
    password: "",
    confirmPassword: ""
  });
}

export function resetAdminUserPasswordForm(form: AdminUserEditForm) {
  form.password = "";
  form.confirmPassword = "";
}

export function adminUserCreatePayloadFromForm(
  form: AdminUserCreateForm
): AdminCreateUserRequest {
  return {
    email: form.email.trim(),
    name: form.name.trim(),
    role: form.role,
    password: form.password
  };
}

export function adminUserUpdatePayloadFromForm(
  form: AdminUserEditForm
): AdminUpdateUserRequest {
  return {
    name: form.name.trim(),
    role: form.role,
    status: form.status
  };
}

export function adminUserResetPasswordPayloadFromForm(
  form: AdminUserEditForm
): AdminResetPasswordRequest {
  return { password: form.password };
}

export function passwordsMatch(password: string, confirmation: string) {
  return confirmation.length === 0 || password === confirmation;
}

export function isValidAdminEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}
