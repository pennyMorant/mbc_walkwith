import { lifePostSchema, publicLifePostSchema } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("event registration failure routes", () => {
  it("returns event_not_open when event registration is closed", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const member = await loginMember(app, {
      email: "closed-event-member@example.com",
      displayName: "Closed Event Member"
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        type: "fellowship",
        title: "Closed Registration Event",
        body: "Registration deadline has already passed.",
        iconName: "event",
        startsAt: "2030-08-01T18:00:00.000Z",
        visibility: "private",
        registrationEnabled: true,
        registrationCapacity: 10,
        registrationDeadline: "2000-01-01T00:00:00.000Z"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const createdPost = expectResponseData(
      createResponse,
      lifePostSchema,
      "closed event create"
    );
    const postId = createdPost.id;

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(createdPost.revision)
      },
      payload: {
        visibility: "members"
      }
    });
    expect(publishResponse.statusCode).toBe(200);
    expectResponseData(publishResponse, lifePostSchema, "closed event publish");

    const registerResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/register`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        partySize: 1
      }
    });

    expect(registerResponse.statusCode).toBe(409);
    expect(registerResponse.json().error).toMatchObject({
      code: "event_not_open",
      category: "state_conflict",
      sourceLayer: "domain",
      recoverable: true,
      retryable: false,
      evidence: { lifePostId: postId },
      nextAction: "refresh"
    });

    await harness.close();
  });

  it("blocks member registration cancellation for hidden events", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const member = await loginMember(app, {
      email: "hidden-event-member@example.com",
      displayName: "Hidden Event Member"
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        type: "fellowship",
        title: "Hidden Event",
        body: "Visible at first, then hidden.",
        iconName: "event",
        startsAt: "2030-07-01T18:00:00.000Z",
        visibility: "private",
        registrationEnabled: true,
        registrationCapacity: 10
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const createdPost = expectResponseData(
      createResponse,
      lifePostSchema,
      "hidden event create"
    );
    const postId = createdPost.id;

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(createdPost.revision)
      },
      payload: {
        visibility: "members"
      }
    });
    expect(publishResponse.statusCode).toBe(200);
    const publishedPost = expectResponseData(
      publishResponse,
      lifePostSchema,
      "hidden event publish"
    );

    const registerResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/register`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        partySize: 1
      }
    });
    expect(registerResponse.statusCode).toBe(200);
    const registered = expectResponseData(
      registerResponse,
      publicLifePostSchema,
      "hidden event register"
    );
    expect(registered.registrationSummary).toMatchObject({
      myRegistrationStatus: "confirmed"
    });

    const hideResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${postId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(publishedPost.revision)
      },
      payload: {
        visibility: "private"
      }
    });
    expect(hideResponse.statusCode).toBe(200);
    const hidden = expectResponseData(
      hideResponse,
      lifePostSchema,
      "hidden event private patch"
    );
    expect(hidden).toMatchObject({
      status: "published",
      visibility: "private"
    });

    const cancelResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/registration/cancel`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(cancelResponse.statusCode).toBe(404);
    expect(cancelResponse.json().error).toMatchObject({
      code: "event_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        lifePostId: postId
      }
    });

    await harness.close();
  });
});
