export const adminAccessTokenStorageKey = "mbc_admin_access_token";
export const adminUserStorageKey = "mbc_admin_user";
export const adminPermissionsStorageKey = "mbc_admin_permissions";
export const adminSessionClearedEventName = "mbc-admin-session-cleared";
export const adminSessionRefreshedEventName = "mbc-admin-session-refreshed";

const adminSessionStorageKeys = new Set([
  adminAccessTokenStorageKey,
  adminUserStorageKey,
  adminPermissionsStorageKey
]);

export function isAdminSessionStorageKey(key: string | null) {
  return key === null || adminSessionStorageKeys.has(key);
}

export function clearStoredAdminSession() {
  localStorage.removeItem(adminAccessTokenStorageKey);
  localStorage.removeItem(adminUserStorageKey);
  localStorage.removeItem(adminPermissionsStorageKey);
}

export function notifyAdminSessionCleared() {
  window.dispatchEvent(new Event(adminSessionClearedEventName));
}

export function notifyAdminSessionRefreshed() {
  window.dispatchEvent(new Event(adminSessionRefreshedEventName));
}
