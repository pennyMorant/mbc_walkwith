import {
  adminRefreshTokenResponseSchema,
  type ApiEnvelope
} from "@mbc/api-contracts";

import {
  adminAccessTokenStorageKey,
  adminPermissionsStorageKey,
  adminUserStorageKey,
  clearStoredAdminSession,
  notifyAdminSessionCleared
} from "./auth_storage";

type RefreshSession = () => Promise<string | null>;

export function createSingleFlightSessionRefresh(refresh: RefreshSession) {
  let activeRefresh: Promise<string | null> | null = null;

  return () => {
    if (activeRefresh) {
      return activeRefresh;
    }

    activeRefresh = refresh().finally(() => {
      activeRefresh = null;
    });
    return activeRefresh;
  };
}

export async function performAdminSessionRefresh(
  baseUrl: string
): Promise<string | null> {
  const response = await fetch(`${baseUrl}/admin/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-client-platform": "admin"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    clearStoredAdminSession();
    notifyAdminSessionCleared();
    return null;
  }

  const json = (await response.json()) as ApiEnvelope<unknown>;
  const session = adminRefreshTokenResponseSchema.parse(json.data);
  localStorage.setItem(adminAccessTokenStorageKey, session.accessToken);
  localStorage.setItem(adminUserStorageKey, JSON.stringify(session.user));
  localStorage.setItem(
    adminPermissionsStorageKey,
    JSON.stringify(session.permissions)
  );
  return session.accessToken;
}
