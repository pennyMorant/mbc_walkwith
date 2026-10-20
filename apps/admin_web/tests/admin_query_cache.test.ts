import { describe, expect, it, mock } from "bun:test";

import { createAdminQueryCacheGuard } from "../src/core/query/admin_query_cache";

describe("admin query cache guard", () => {
  it("clears cached role projections whenever the access token changes", () => {
    const clear = mock(() => undefined);
    const updateToken = createAdminQueryCacheGuard("owner-token", clear);

    updateToken("owner-token");
    expect(clear).not.toHaveBeenCalled();

    updateToken(null);
    updateToken("viewer-token");

    expect(clear).toHaveBeenCalledTimes(2);
  });
});
