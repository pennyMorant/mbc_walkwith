import type { AdminPermission } from "@mbc/api-contracts";

type AdminQueryCacheSession = {
  accessToken: string | null;
  user: { id: string } | null;
  permissions: readonly AdminPermission[];
};

export function createAdminQueryCacheGuard(
  initialSession: AdminQueryCacheSession,
  clear: () => void
) {
  let activeScope = adminQueryCacheScope(initialSession);

  return (nextSession: AdminQueryCacheSession) => {
    const nextScope = adminQueryCacheScope(nextSession);
    if (nextScope === activeScope) return;
    activeScope = nextScope;
    clear();
  };
}

function adminQueryCacheScope(session: AdminQueryCacheSession) {
  return JSON.stringify([
    session.accessToken,
    session.user?.id ?? null,
    [...new Set(session.permissions)].sort()
  ]);
}
