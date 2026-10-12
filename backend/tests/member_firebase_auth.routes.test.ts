import { describe, expect, it } from "vitest";

import { buildTestApp } from "./route_test_harness.js";

describe("member Firebase auth route", () => {
  it("reports missing server credentials without accepting the token", async () => {
    const harness = await buildTestApp();
    const response = await harness.app.inject({
      method: "POST",
      url: "/v1/member/auth/firebase",
      payload: { idToken: "untrusted-client-token" }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error).toMatchObject({
      code: "member_firebase_auth_unavailable",
      category: "configuration_missing",
      sourceLayer: "capability"
    });
    await harness.close();
  });

  it("rate limits repeated Firebase authentication attempts by client", async () => {
    const harness = await buildTestApp({
      memberAuthRateLimitPerWindow: 1
    });
    const request = {
      method: "POST" as const,
      url: "/v1/member/auth/firebase",
      payload: { idToken: "untrusted-client-token" }
    };

    expect((await harness.app.inject(request)).statusCode).toBe(503);
    const limited = await harness.app.inject(request);
    expect(limited.statusCode).toBe(429);
    expect(limited.headers["retry-after"]).toEqual(expect.any(String));
    expect(limited.json().error).toMatchObject({
      code: "member_auth_rate_limit_exceeded",
      category: "retry_exhausted",
      retryable: true,
      evidence: { action: "firebase", limit: 1 }
    });
    await harness.close();
  });
});
