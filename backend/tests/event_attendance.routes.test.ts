import { eventCheckInCodeSchema, lifePostSchema } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("event attendance routes", () => {
  it("blocks member and QR check-in before the event window", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const member = await loginMember(app, {
      email: "early-check-in@example.com",
      displayName: "Early Check In"
    });
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        type: "fellowship",
        title: "Future Fellowship",
        body: "Check in when the fellowship begins.",
        iconName: "event",
        startsAt,
        endsAt,
        visibility: "private",
        registrationEnabled: true,
        registrationCapacity: 10,
        registrationDeadline: new Date(
          Date.now() + 4 * 60 * 60 * 1000
        ).toISOString()
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const post = expectResponseData(
      createResponse,
      lifePostSchema,
      "future event create"
    );

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${post.id}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(post.revision)
      },
      payload: { visibility: "members" }
    });
    expect(publishResponse.statusCode).toBe(200);

    const registerResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${post.id}/register`,
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: { partySize: 1 }
    });
    expect(registerResponse.statusCode).toBe(200);

    const directCheckInResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${post.id}/registration/check-in`,
      headers: { authorization: `Bearer ${member.accessToken}` }
    });
    expect(directCheckInResponse.statusCode).toBe(409);
    expect(directCheckInResponse.json().error).toMatchObject({
      code: "check_in_not_allowed",
      evidence: { lifePostId: post.id, reason: "before_window" }
    });

    const codeResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${post.id}/check-in-code`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { rotate: false }
    });
    expect(codeResponse.statusCode).toBe(200);
    const code = expectResponseData(
      codeResponse,
      eventCheckInCodeSchema,
      "future event check-in code"
    );

    const qrCheckInResponse = await app.inject({
      method: "POST",
      url: "/v1/member/life/check-in-code",
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: { code: code.qrPayload }
    });
    expect(qrCheckInResponse.statusCode).toBe(409);
    expect(qrCheckInResponse.json().error).toMatchObject({
      code: "check_in_not_allowed",
      evidence: { lifePostId: post.id, reason: "before_window" }
    });

    await harness.close();
  });
});
