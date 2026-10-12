import type {
  AdminLoginResponse,
  AdminPermission,
  AdminSession,
  AdminUser
} from "@mbc/api-contracts";
import { defineStore } from "pinia";

import {
  adminAccessTokenStorageKey,
  adminPermissionsStorageKey,
  adminUserStorageKey,
  clearStoredAdminSession
} from "./auth_storage";

type AuthState = {
  accessToken: string | null;
  user: AdminUser | null;
  permissions: AdminPermission[];
};

export const useAdminAuthStore = defineStore("admin-auth", {
  state: (): AuthState => ({
    accessToken: localStorage.getItem(adminAccessTokenStorageKey),
    user: readStoredUser(),
    permissions: readStoredPermissions()
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.user),
    can: (state) => {
      return (permission: AdminPermission) =>
        state.permissions.includes(permission);
    }
  },
  actions: {
    setSession(session: AdminLoginResponse) {
      this.accessToken = session.accessToken;
      this.user = session.user;
      this.permissions = session.permissions;
      localStorage.setItem(adminAccessTokenStorageKey, session.accessToken);
      localStorage.setItem(adminUserStorageKey, JSON.stringify(session.user));
      localStorage.setItem(
        adminPermissionsStorageKey,
        JSON.stringify(session.permissions)
      );
    },
    setCurrentSession(session: AdminSession) {
      this.user = session.user;
      this.permissions = session.permissions;
      localStorage.setItem(adminUserStorageKey, JSON.stringify(session.user));
      localStorage.setItem(
        adminPermissionsStorageKey,
        JSON.stringify(session.permissions)
      );
    },
    clearSession() {
      this.accessToken = null;
      this.user = null;
      this.permissions = [];
      clearStoredAdminSession();
    }
  }
});

function readStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(adminUserStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    clearStoredAdminSession();
    return null;
  }
}

function readStoredPermissions(): AdminPermission[] {
  const raw = localStorage.getItem(adminPermissionsStorageKey);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as AdminPermission[];
  } catch {
    clearStoredAdminSession();
    return [];
  }
}
