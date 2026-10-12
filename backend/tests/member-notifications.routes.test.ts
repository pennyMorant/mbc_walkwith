import {
  lifePostSchema,
  memberNotificationArchiveAllResponseSchema,
  memberNotificationItemResponseSchema,
  memberNotificationListResponseSchema,
  memberNotificationReadAllResponseSchema,
  memberPushDeviceResponseSchema,
  revokeMemberPushDeviceResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("member notification routes", () => {
  it("registers and revokes guest push devices without member auth", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const registerResponse = await app.inject({
      method: "PUT",
      url: "/v1/app/devices/push-token",
      payload: {
        installationId: "guest-installation-1",
        platform: "ios",
        provider: "fcm",
        pushToken: "token-guest-route-abcdefghijklmnopqrstuvwxyz",
        permissionStatus: "authorized",
        locale: "en"
      }
    });
    expect(registerResponse.statusCode).toBe(200);
    const register = expectResponseData(
      registerResponse,
      memberPushDeviceResponseSchema,
      "guest push device register"
    );
    expect(register.accepted).toBe(true);
    expect(register.device).toMatchObject({
      installationId: "guest-installation-1",
      platform: "ios",
      provider: "fcm",
      permissionStatus: "authorized"
    });

    const revokeResponse = await app.inject({
      method: "POST",
      url: "/v1/app/devices/push-token/revoke",
      payload: {
        installationId: "guest-installation-1"
      }
    });
    expect(revokeResponse.statusCode).toBe(200);
    const revoke = expectResponseData(
      revokeResponse,
      revokeMemberPushDeviceResponseSchema,
      "guest push device revoke"
    );
    expect(revoke.accepted).toBe(true);

    await harness.close();
  });

  it("lists, reads, marks all read, and archives backend inbox items", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const admin = await login(app);
    const member = await loginMember(app, {
      email: "notification-member@example.com",
      displayName: "Notification Member"
    });

    const firstPostId = await createAndPublishLifePost({
      app,
      accessToken: admin.accessToken,
      title: "Serve Team Meal",
      notificationTitle: "Serve team meal",
      notificationBody: "Dinner and prayer after service."
    });

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/member/notifications",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const list = expectResponseData(
      listResponse,
      memberNotificationListResponseSchema,
      "member notification list"
    );
    expect(list.unreadCount).toBe(1);
    expect(list.items).toEqual([
      expect.objectContaining({
        messageId: expect.any(String),
        type: "life_post_published",
        title: "Serve team meal",
        body: "Dinner and prayer after service.",
        route: `/life/posts/${firstPostId}`,
        data: {
          lifePostId: firstPostId,
          targetType: "life_post",
          targetId: firstPostId
        },
        readAt: null,
        archivedAt: null
      })
    ]);
    expect(list.items[0]).not.toHaveProperty("userId");
    const firstNotificationId = list.items[0]?.id;
    expect(firstNotificationId).toEqual(expect.any(String));
    if (!firstNotificationId) {
      throw new Error("expected notification id");
    }

    const readResponse = await app.inject({
      method: "PATCH",
      url: `/v1/member/notifications/${firstNotificationId}/read`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(readResponse.statusCode).toBe(200);
    const read = expectResponseData(
      readResponse,
      memberNotificationItemResponseSchema,
      "member notification read"
    );
    expect(read.item?.readAt).toEqual(expect.any(String));

    const secondPostId = await createAndPublishLifePost({
      app,
      accessToken: admin.accessToken,
      title: "Prayer Walk",
      notificationTitle: "Prayer walk",
      notificationBody: "Meet in the lobby at 10 AM."
    });

    const beforeReadAllResponse = await app.inject({
      method: "GET",
      url: "/v1/member/notifications?limit=10",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(beforeReadAllResponse.statusCode).toBe(200);
    const beforeReadAll = expectResponseData(
      beforeReadAllResponse,
      memberNotificationListResponseSchema,
      "member notifications before read all"
    );
    expect(beforeReadAll.unreadCount).toBe(1);
    expect(
      beforeReadAll.items.map((item: { route: string | null }) => item.route)
    ).toContain(`/life/posts/${secondPostId}`);

    const readAllResponse = await app.inject({
      method: "PATCH",
      url: "/v1/member/notifications/read-all",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(readAllResponse.statusCode).toBe(200);
    const readAll = expectResponseData(
      readAllResponse,
      memberNotificationReadAllResponseSchema,
      "member notification read all"
    );
    expect(readAll.updatedCount).toBe(1);

    const archiveResponse = await app.inject({
      method: "PATCH",
      url: `/v1/member/notifications/${firstNotificationId}/archive`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(archiveResponse.statusCode).toBe(200);
    const archive = expectResponseData(
      archiveResponse,
      memberNotificationItemResponseSchema,
      "member notification archive"
    );
    expect(archive.item?.archivedAt).toEqual(expect.any(String));

    const afterArchiveResponse = await app.inject({
      method: "GET",
      url: "/v1/member/notifications?limit=10",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(afterArchiveResponse.statusCode).toBe(200);
    const afterArchive = expectResponseData(
      afterArchiveResponse,
      memberNotificationListResponseSchema,
      "member notifications after archive"
    );
    expect(afterArchive.unreadCount).toBe(0);
    expect(
      afterArchive.items.map((item: { id: string }) => item.id)
    ).not.toContain(firstNotificationId);

    const archiveAllResponse = await app.inject({
      method: "PATCH",
      url: "/v1/member/notifications/archive-all",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(archiveAllResponse.statusCode).toBe(200);
    const archiveAll = expectResponseData(
      archiveAllResponse,
      memberNotificationArchiveAllResponseSchema,
      "member notification archive all"
    );
    expect(archiveAll.updatedCount).toBe(1);

    const afterArchiveAllResponse = await app.inject({
      method: "GET",
      url: "/v1/member/notifications?limit=10",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    const afterArchiveAll = expectResponseData(
      afterArchiveAllResponse,
      memberNotificationListResponseSchema,
      "member notifications after archive all"
    );
    expect(afterArchiveAll.items).toHaveLength(0);
    expect(afterArchiveAll.unreadCount).toBe(0);

    const archiveAllAgainResponse = await app.inject({
      method: "PATCH",
      url: "/v1/member/notifications/archive-all",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    const archiveAllAgain = expectResponseData(
      archiveAllAgainResponse,
      memberNotificationArchiveAllResponseSchema,
      "member notification archive all idempotent"
    );
    expect(archiveAllAgain.updatedCount).toBe(0);

    const missingResponse = await app.inject({
      method: "PATCH",
      url: "/v1/member/notifications/missing/read",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(missingResponse.statusCode).toBe(404);
    expect(missingResponse.json().error).toMatchObject({
      code: "notification_item_not_found",
      category: "not_found",
      sourceLayer: "feature",
      nextAction: "refresh"
    });

    const unauthenticatedResponse = await app.inject({
      method: "GET",
      url: "/v1/member/notifications"
    });
    expect(unauthenticatedResponse.statusCode).toBe(401);

    await harness.close();
  });
});

async function createAndPublishLifePost(input: {
  app: Awaited<ReturnType<typeof buildTestApp>>["app"];
  accessToken: string;
  title: string;
  notificationTitle: string;
  notificationBody: string;
}) {
  const createResponse = await input.app.inject({
    method: "POST",
    url: "/v1/admin/life-posts",
    headers: {
      authorization: `Bearer ${input.accessToken}`
    },
    payload: {
      type: "announcement",
      title: input.title,
      body: `${input.title} details for the congregation.`,
      meta: "This week",
      iconName: "church",
      visibility: "private"
    }
  });
  expect(createResponse.statusCode).toBe(200);
  const post = expectResponseData(
    createResponse,
    lifePostSchema,
    "notification life post create"
  );
  const postId = post.id;

  const publishResponse = await input.app.inject({
    method: "POST",
    url: `/v1/admin/life-posts/${postId}/publish`,
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "x-life-post-revision": String(post.revision)
    },
    payload: {
      visibility: "members",
      notifyApp: true,
      notification: {
        title: input.notificationTitle,
        body: input.notificationBody
      }
    }
  });
  expect(publishResponse.statusCode).toBe(200);
  expectResponseData(
    publishResponse,
    lifePostSchema,
    "notification life post publish"
  );
  return postId;
}
