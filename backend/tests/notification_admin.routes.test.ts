import {
  adminNotificationCancelResponseSchema,
  adminNotificationDeliveryListResponseSchema,
  adminNotificationRetryDueResponseSchema,
  lifePostSchema,
  memberPushDeviceResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("admin notification routes", () => {
  it("lists notification delivery tasks and retries due deliveries", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const admin = await login(app);
    const postId = await createAndPublishLifePost(
      app,
      admin.accessToken,
      "Admin notification test"
    );

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/notifications/deliveries?limit=10",
      headers: {
        authorization: `Bearer ${admin.accessToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const deliveries = expectResponseData(
      listResponse,
      adminNotificationDeliveryListResponseSchema,
      "admin notification deliveries"
    );
    expect(deliveries.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
        type: "life_post_published",
        channel: "push",
        status: "sent",
        messageId: expect.any(String),
        payload: expect.objectContaining({
          route: `/life/posts/${postId}`,
          data: {
            lifePostId: postId,
            targetType: "life_post",
            targetId: postId
          }
        })
        })
      ])
    );

    const retryResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/notifications/deliveries/retry-due",
      headers: {
        authorization: `Bearer ${admin.accessToken}`
      },
      payload: {
        limit: 5
      }
    });
    expect(retryResponse.statusCode).toBe(200);
    const retry = expectResponseData(
      retryResponse,
      adminNotificationRetryDueResponseSchema,
      "admin notification retry due"
    );
    expect(retry).toEqual({
      processed: 0,
      results: []
    });

    const unauthenticatedResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/notifications/deliveries"
    });
    expect(unauthenticatedResponse.statusCode).toBe(401);

    await harness.close();
  });

  it("retries and cancels a single retrying delivery task", async () => {
    const harness = await buildTestApp({
      fcmServiceAccountJson: JSON.stringify({
        project_id: "mbc-test",
        client_email: "firebase-adminsdk@example.iam.gserviceaccount.com",
        private_key: "not-a-private-key"
      })
    });
    const { app } = harness;
    const admin = await login(app);
    const member = await loginMember(app, {
      email: "notification-ops-member@example.com",
      displayName: "Notification Ops Member"
    });
    const memberDeviceResponse = await app.inject({
      method: "PUT",
      url: "/v1/member/devices/push-token",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        installationId: "member-notification-ops",
        platform: "ios",
        provider: "fcm",
        pushToken: "token-member-notification-ops-abcdefghijklmnopqrstuvwxyz",
        permissionStatus: "authorized",
        locale: "en"
      }
    });
    expect(memberDeviceResponse.statusCode).toBe(200);
    expectResponseData(
      memberDeviceResponse,
      memberPushDeviceResponseSchema,
      "member push device upsert"
    );

    await createAndPublishLifePost(
      app,
      admin.accessToken,
      "Retrying notification"
    );

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/notifications/deliveries?limit=10",
      headers: {
        authorization: `Bearer ${admin.accessToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const deliveries = expectResponseData(
      listResponse,
      adminNotificationDeliveryListResponseSchema,
      "admin notification deliveries"
    );
    const task = deliveries.items[0];
    expect(task).toBeDefined();
    if (!task) {
      throw new Error("expected notification delivery task");
    }
    expect(task).toMatchObject({
      status: "retrying",
      audience: "members",
      preferenceKey: "lifePostPublished"
    });

    const retryResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/notifications/deliveries/${task.id}/retry`,
      headers: {
        authorization: `Bearer ${admin.accessToken}`
      }
    });
    expect(retryResponse.statusCode).toBe(503);
    expect(retryResponse.json().error).toMatchObject({
      code: "notification_provider_unavailable",
      sourceLayer: "capability",
      nextAction: "retry"
    });

    const cancelResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/notifications/deliveries/${task.id}/cancel`,
      headers: {
        authorization: `Bearer ${admin.accessToken}`
      }
    });
    expect(cancelResponse.statusCode).toBe(200);
    const cancel = expectResponseData(
      cancelResponse,
      adminNotificationCancelResponseSchema,
      "admin notification cancel"
    );
    expect(cancel.task.status).toBe("cancelled");

    const retryCancelledResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/notifications/deliveries/${task.id}/retry`,
      headers: {
        authorization: `Bearer ${admin.accessToken}`
      }
    });
    expect(retryCancelledResponse.statusCode).toBe(409);
    expect(retryCancelledResponse.json().error.code).toBe(
      "notification_task_transition_not_allowed"
    );

    await harness.close();
  });

  it("does not mark active-device delivery sent when FCM is unconfigured", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const admin = await login(app);
    const member = await loginMember(app, {
      email: "unconfigured-push-member@example.com",
      displayName: "Unconfigured Push Member"
    });

    const deviceResponse = await app.inject({
      method: "PUT",
      url: "/v1/member/devices/push-token",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        installationId: "unconfigured-push-device",
        platform: "android",
        provider: "fcm",
        pushToken: "token-unconfigured-push-abcdefghijklmnopqrstuvwxyz",
        permissionStatus: "authorized",
        locale: "en"
      }
    });
    expect(deviceResponse.statusCode).toBe(200);

    await createAndPublishLifePost(
      app,
      admin.accessToken,
      "Unconfigured push delivery"
    );

    const deliveriesResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/notifications/deliveries?limit=10",
      headers: {
        authorization: `Bearer ${admin.accessToken}`
      }
    });
    expect(deliveriesResponse.statusCode).toBe(200);
    const deliveries = expectResponseData(
      deliveriesResponse,
      adminNotificationDeliveryListResponseSchema,
      "unconfigured notification delivery"
    );
    expect(deliveries.items[0]).toMatchObject({
      status: "retrying",
      lastErrorCode: "notification_provider_unavailable"
    });

    await harness.close();
  });
});

async function createAndPublishLifePost(
  app: Awaited<ReturnType<typeof buildTestApp>>["app"],
  accessToken: string,
  title: string,
  visibility: "public" | "members" = "members"
) {
  const createResponse = await app.inject({
    method: "POST",
    url: "/v1/admin/life-posts",
    headers: {
      authorization: `Bearer ${accessToken}`
    },
    payload: {
      type: "announcement",
      title,
      body: `${title} body.`,
      meta: "Notification ops",
      iconName: "church",
      visibility: "private"
    }
  });
  expect(createResponse.statusCode).toBe(200);
  const post = expectResponseData(createResponse, lifePostSchema, "life post");
  const postId = post.id;

  const publishResponse = await app.inject({
    method: "POST",
    url: `/v1/admin/life-posts/${postId}/publish`,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "x-life-post-revision": String(post.revision)
    },
    payload: {
      visibility,
      notifyApp: true,
      notification: {
        title,
        body: `${title} notification body.`
      }
    }
  });
  expect(publishResponse.statusCode).toBe(200);
  expectResponseData(publishResponse, lifePostSchema, "published life post");
  return postId;
}
