import { describe, expect, test } from "bun:test";

import { readStoredAdminAuthState } from "../src/core/auth/admin_auth_state";
import {
  adminAccessTokenStorageKey,
  adminPermissionsStorageKey,
  adminUserStorageKey,
  isAdminSessionStorageKey
} from "../src/core/auth/auth_storage";

function sessionStorage(values: Record<string, string>) {
  const data = new Map(Object.entries(values));
  return {
    data,
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    }
  };
}

const validUser = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  role: "admin",
  status: "active"
};

describe("admin auth state", () => {
  test("restores one validated session snapshot", () => {
    const storage = sessionStorage({
      [adminAccessTokenStorageKey]: "access-token",
      [adminUserStorageKey]: JSON.stringify(validUser),
      [adminPermissionsStorageKey]: JSON.stringify([
        "dashboard:read",
        "sermons:read"
      ])
    });

    expect(readStoredAdminAuthState(storage)).toEqual({
      accessToken: "access-token",
      user: validUser,
      permissions: ["dashboard:read", "sermons:read"]
    });
  });

  test("clears the entire snapshot when one field is missing", () => {
    const storage = sessionStorage({
      [adminAccessTokenStorageKey]: "stale-token",
      [adminUserStorageKey]: JSON.stringify(validUser)
    });

    expect(readStoredAdminAuthState(storage)).toEqual({
      accessToken: null,
      user: null,
      permissions: []
    });
    expect(storage.data.size).toBe(0);
  });

  test("rejects malformed users and unknown permissions atomically", () => {
    const invalidSnapshots = [
      {
        [adminAccessTokenStorageKey]: "token",
        [adminUserStorageKey]: JSON.stringify({ ...validUser, email: "bad" }),
        [adminPermissionsStorageKey]: JSON.stringify(["dashboard:read"])
      },
      {
        [adminAccessTokenStorageKey]: "token",
        [adminUserStorageKey]: JSON.stringify(validUser),
        [adminPermissionsStorageKey]: JSON.stringify(["unknown:permission"])
      }
    ];

    for (const snapshot of invalidSnapshots) {
      const storage = sessionStorage(snapshot);
      expect(readStoredAdminAuthState(storage).accessToken).toBeNull();
      expect(storage.data.size).toBe(0);
    }
  });

  test("recognizes only changes that can alter the admin session", () => {
    expect(isAdminSessionStorageKey(adminAccessTokenStorageKey)).toBe(true);
    expect(isAdminSessionStorageKey(adminUserStorageKey)).toBe(true);
    expect(isAdminSessionStorageKey(adminPermissionsStorageKey)).toBe(true);
    expect(isAdminSessionStorageKey(null)).toBe(true);
    expect(isAdminSessionStorageKey("unrelated-preference")).toBe(false);
  });

  test("connects successful refreshes to the canonical store and cache guard", async () => {
    const [refresh, main, store] = await Promise.all([
      Bun.file(
        new URL("../src/core/auth/admin_session_refresh.ts", import.meta.url)
      ).text(),
      Bun.file(new URL("../src/main.ts", import.meta.url)).text(),
      Bun.file(
        new URL("../src/core/auth/auth_store.ts", import.meta.url)
      ).text()
    ]);

    expect(refresh).toContain("notifyAdminSessionRefreshed()");
    expect(main).toContain("adminSessionRefreshedEventName");
    expect(main).toContain("authStore.syncStoredSession()");
    expect(main).toContain('window.addEventListener("storage"');
    expect(main).toContain("isAdminSessionStorageKey(event.key)");
    expect(main).toContain("force: true");
    expect(store).toContain("this.$patch(readStoredAdminAuthState(localStorage))");
  });
});
