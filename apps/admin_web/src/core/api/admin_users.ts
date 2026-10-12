import {
  adminCreateUserRequestSchema,
  adminResetPasswordRequestSchema,
  adminUpdateUserRequestSchema,
  adminUserSchema,
  type AdminCreateUserRequest,
  type AdminResetPasswordRequest,
  type AdminUpdateUserRequest,
  type AdminUser
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import { pathSegment } from "./path_segments";

export async function listAdminUsers(): Promise<AdminUser[]> {
  return apiClient.getData("/admin/users", adminUserSchema.array());
}

export async function createAdminUser(
  input: AdminCreateUserRequest
): Promise<AdminUser> {
  const payload = adminCreateUserRequestSchema.parse(input);
  return apiClient.postData("/admin/users", payload, adminUserSchema);
}

export async function updateAdminUser(
  adminUserId: string,
  input: AdminUpdateUserRequest
): Promise<AdminUser> {
  const payload = adminUpdateUserRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/users/${pathSegment(adminUserId)}`,
    payload,
    adminUserSchema
  );
}

export async function resetAdminUserPassword(
  adminUserId: string,
  input: AdminResetPasswordRequest
): Promise<AdminUser> {
  const payload = adminResetPasswordRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/users/${pathSegment(adminUserId)}/reset-password`,
    payload,
    adminUserSchema
  );
}
