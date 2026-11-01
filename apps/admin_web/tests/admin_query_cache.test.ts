import { describe, expect, it, mock } from "bun:test";

import { createAdminQueryCacheGuard } from "../src/core/query/admin_query_cache";

describe("admin query cache guard", () => {
  const ownerSession = {
    accessToken: "owner-token",
    user: { id: "admin-1" },
    permissions: ["dashboard:read", "users:read"] as const
  };

  it("keeps cache for the same authenticated scope", () => {
    const clear = mock(() => undefined);
    const updateSession = createAdminQueryCacheGuard(ownerSession, clear);

    updateSession({ ...ownerSession });
    updateSession({
      ...ownerSession,
      permissions: ["users:read", "dashboard:read", "users:read"]
    });
    expect(clear).not.toHaveBeenCalled();
  });

  it("clears cache when token, identity, or permissions change", () => {
    const clear = mock(() => undefined);
    const updateSession = createAdminQueryCacheGuard(ownerSession, clear);

    updateSession({
      ...ownerSession,
      permissions: ["dashboard:read"]
    });
    updateSession({
      ...ownerSession,
      user: { id: "admin-2" },
      permissions: ["dashboard:read"]
    });
    updateSession({
      accessToken: null,
      user: null,
      permissions: []
    });

    expect(clear).toHaveBeenCalledTimes(3);
  });
});
