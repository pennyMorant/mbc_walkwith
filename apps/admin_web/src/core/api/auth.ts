import {
  adminLoginResponseSchema,
  adminRefreshTokenResponseSchema,
  adminSessionSchema,
  adminChangePasswordRequestSchema,
  type AdminChangePasswordRequest,
  type AdminLoginRequest,
  type AdminLoginResponse,
  type AdminRefreshTokenResponse,
  type AdminSession
} from "@mbc/api-contracts";

import { apiClient } from "./client";

export async function loginAdmin(
  input: AdminLoginRequest
): Promise<AdminLoginResponse> {
  return apiClient.postData("/admin/auth/login", input, adminLoginResponseSchema);
}

export async function getAdminSession(): Promise<AdminSession> {
  return apiClient.getData("/admin/auth/me", adminSessionSchema);
}

export async function refreshAdminSession(
  refreshToken?: string
): Promise<AdminRefreshTokenResponse> {
  return apiClient.postData(
    "/admin/auth/refresh",
    { refreshToken },
    adminRefreshTokenResponseSchema
  );
}

export async function logoutAdmin(refreshToken: string | null): Promise<void> {
  await apiClient.post("/admin/auth/logout", {
    refreshToken: refreshToken ?? undefined
  });
}

export async function changeAdminPassword(
  input: AdminChangePasswordRequest
): Promise<AdminSession> {
  const payload = adminChangePasswordRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/auth/change-password",
    payload,
    adminSessionSchema
  );
}
