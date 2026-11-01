import {
  adminPermissionSchema,
  adminUserSchema,
  type AdminPermission,
  type AdminUser
} from "@mbc/api-contracts";

import {
  adminAccessTokenStorageKey,
  adminPermissionsStorageKey,
  adminUserStorageKey
} from "./auth_storage";

export type AdminAuthState = {
  accessToken: string | null;
  user: AdminUser | null;
  permissions: AdminPermission[];
};

type AdminSessionStorage = Pick<Storage, "getItem" | "removeItem">;

const emptyAdminAuthState = (): AdminAuthState => ({
  accessToken: null,
  user: null,
  permissions: []
});

export function readStoredAdminAuthState(
  storage: AdminSessionStorage
): AdminAuthState {
  const accessToken = storage.getItem(adminAccessTokenStorageKey);
  const rawUser = storage.getItem(adminUserStorageKey);
  const rawPermissions = storage.getItem(adminPermissionsStorageKey);

  if (!accessToken || !rawUser || !rawPermissions) {
    clearStorageSnapshot(storage);
    return emptyAdminAuthState();
  }

  try {
    const user = adminUserSchema.parse(JSON.parse(rawUser));
    const parsedPermissions = JSON.parse(rawPermissions) as unknown;
    if (!Array.isArray(parsedPermissions)) {
      throw new TypeError("Stored admin permissions must be an array.");
    }
    const permissions = parsedPermissions.map((permission) =>
      adminPermissionSchema.parse(permission)
    );

    return { accessToken, user, permissions };
  } catch {
    clearStorageSnapshot(storage);
    return emptyAdminAuthState();
  }
}

function clearStorageSnapshot(storage: AdminSessionStorage) {
  storage.removeItem(adminAccessTokenStorageKey);
  storage.removeItem(adminUserStorageKey);
  storage.removeItem(adminPermissionsStorageKey);
}
