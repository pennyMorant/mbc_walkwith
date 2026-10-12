export const adminAccessTokenStorageKey = "mbc_admin_access_token";
export const adminUserStorageKey = "mbc_admin_user";
export const adminPermissionsStorageKey = "mbc_admin_permissions";
export const adminSessionClearedEventName = "mbc-admin-session-cleared";

export function clearStoredAdminSession() {
  localStorage.removeItem(adminAccessTokenStorageKey);
  localStorage.removeItem(adminUserStorageKey);
  localStorage.removeItem(adminPermissionsStorageKey);
}

export function notifyAdminSessionCleared() {
  window.dispatchEvent(new Event(adminSessionClearedEventName));
}
