import type {
  AdminLoginResponse,
  AdminPermission,
  AdminSession
} from "@mbc/api-contracts";
import { defineStore } from "pinia";

import {
  type AdminAuthState,
  readStoredAdminAuthState
} from "./admin_auth_state";
import {
  adminAccessTokenStorageKey,
  adminPermissionsStorageKey,
  adminUserStorageKey,
  clearStoredAdminSession
} from "./auth_storage";

export const useAdminAuthStore = defineStore("admin-auth", {
  state: (): AdminAuthState => readStoredAdminAuthState(localStorage),
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
    syncStoredSession() {
      this.$patch(readStoredAdminAuthState(localStorage));
    },
    clearSession() {
      this.accessToken = null;
      this.user = null;
      this.permissions = [];
      clearStoredAdminSession();
    }
  }
});
