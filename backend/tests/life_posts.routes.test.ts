import {
  adminLoginResponseSchema,
  auditLogListResponseSchema,
  deletedResponseSchema,
  lifeImageUploadResponseSchema,
  lifePostSchema,
  publicLifePostSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("life post routes", () => {
  it("publishes life posts through admin API and public feed", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const imageUploadResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts/images",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "image/png",
        "x-file-name": encodeURIComponent("prayer-night.png")
      },
      payload: Buffer.from("fake png bytes")
    });
    expect(imageUploadResponse.statusCode).toBe(200);
    const imageUpload = expectResponseData(
      imageUploadResponse,
      lifeImageUploadResponseSchema,
      "life post image upload"
    );
    expect(imageUpload.imageUrl).toMatch(/^\/v1\/life\/images\//);
    const imageUrl = imageUpload.imageUrl;

    const invalidImageBodyResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts/images",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        file: "not-binary"
      }
    });
    expect(invalidImageBodyResponse.statusCode).toBe(400);
    expect(invalidImageBodyResponse.json().error).toMatchObject({
      code: "life_image_upload_body_invalid",
      category: "validation_error",
      sourceLayer: "surface",
      recoverable: true,
      retryable: false,
      nextAction: "review_request"
    });

    const imageResponse = await app.inject({
      method: "GET",
      url: imageUrl
    });
    expect(imageResponse.statusCode).toBe(200);
    expect(imageResponse.headers["content-type"]).toBe("image/png");

    const missingImageResponse = await app.inject({
      method: "GET",
      url: "/v1/life/images/missing-image.png"
    });
    expect(missingImageResponse.statusCode).toBe(404);
    expect(missingImageResponse.json().error).toMatchObject({
      code: "life_image_not_found",
      category: "not_found",
      sourceLayer: "capability",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        fileName: "missing-image.png"
      }
    });

    const invalidScheduleResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        type: "announcement",
        title: "Zero duration",
        body: "This should be rejected.",
        meta: "Wednesday 7 PM",
        iconName: "prayer",
        startsAt: "2026-06-04T02:00:00.000Z",
        endsAt: "2026-06-04T02:00:00.000Z",
        visibility: "private"
      }
    });
    expect(invalidScheduleResponse.statusCode).toBe(400);
    expect(invalidScheduleResponse.json().error).toMatchObject({
      code: "life_post_schedule_invalid",
      category: "validation_error",
      sourceLayer: "domain",
      nextAction: "review_request"
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        type: "announcement",
        title: "Prayer Night",
        body: "Join us for prayer.",
        meta: "Wednesday 7 PM",
        iconName: "prayer",
        startsAt: "2026-06-04T02:00:00.000Z",
        endsAt: "2026-06-04T03:30:00.000Z",
        imageUrl,
        visibility: "private",
        displayWeight: 100,
        ctaLabel: "Register",
        ctaUrl: "https://example.com/prayer-night"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const createdPost = expectResponseData(
      createResponse,
      lifePostSchema,
      "admin life post create"
    );
    expect(createdPost.visibility).toBe("private");
    expect(createdPost.status).toBe("draft");
    expect(createdPost.displayWeight).toBe(100);
    expect(createdPost.ctaLabel).toBe("Register");
    expect(createdPost.ctaUrl).toBe("https://example.com/prayer-night");
    expect(createdPost.body).toBe("Join us for prayer.");
    expect(createdPost.meta).toBe("Wednesday 7 PM");
    expect(createdPost.iconName).toBe("prayer");
    expect(createdPost.startsAt).toBe("2026-06-04T02:00:00.000Z");
    expect(createdPost.endsAt).toBe("2026-06-04T03:30:00.000Z");
    expect(createdPost.imageUrl).toBe(imageUrl);
    const postId = createdPost.id;

    const submitReviewResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/submit-review`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(createdPost.revision)
      }
    });
    expect(submitReviewResponse.statusCode).toBe(200);
    const reviewPost = expectResponseData(
      submitReviewResponse,
      lifePostSchema,
      "admin life post submit review"
    );
    expect(reviewPost.status).toBe("needs_review");

    const privateDetail = await app.inject({
      method: "GET",
      url: `/v1/life/posts/${postId}`
    });
    expect(privateDetail.statusCode).toBe(404);
    expect(privateDetail.json().error).toMatchObject({
      code: "life_post_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        lifePostId: postId
      }
    });

    const publicBefore = await app.inject({
      method: "GET",
      url: "/v1/life/posts?limit=50"
    });
    expect(publicBefore.statusCode).toBe(200);
    const beforePosts = expectResponseData(
      publicBefore,
      publicLifePostSchema.array(),
      "public life post list before publish"
    );
    expect(
      beforePosts.map((post: { id: string }) => post.id)
    ).not.toContain(postId);

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(reviewPost.revision)
      }
    });
    expect(publishResponse.statusCode).toBe(200);
    const published = expectResponseData(
      publishResponse,
      lifePostSchema,
      "admin life post publish"
    );
    expect(published.visibility).toBe("public");
    expect(published.status).toBe("published");

    const publicAfter = await app.inject({
      method: "GET",
      url: "/v1/life/posts?limit=50"
    });
    expect(publicAfter.statusCode).toBe(200);
    const afterPosts = expectResponseData(
      publicAfter,
      publicLifePostSchema.array(),
      "public life post list after publish"
    );
    expect(
      afterPosts.map((post: { id: string }) => post.id)
    ).toContain(postId);
    expect(afterPosts[0]?.id).toBe(postId);
    const listedPost = afterPosts.find(
      (post: { id: string }) => post.id === postId
    );
    expect(listedPost?.displayWeight).toBe(100);
    expect(listedPost?.meta).toBe("Wednesday 7 PM");

    const publicInRange = await app.inject({
      method: "GET",
      url: "/v1/life/posts?limit=50&from=2026-06-04T00:00:00.000Z&to=2026-06-05T00:00:00.000Z"
    });
    expect(publicInRange.statusCode).toBe(200);
    const inRangePosts = expectResponseData(
      publicInRange,
      publicLifePostSchema.array(),
      "public life post list in range"
    );
    expect(inRangePosts.map((post: { id: string }) => post.id)).toContain(
      postId
    );

    const publicOutsideRange = await app.inject({
      method: "GET",
      url: "/v1/life/posts?limit=50&from=2026-06-06T00:00:00.000Z&to=2026-06-07T00:00:00.000Z"
    });
    expect(publicOutsideRange.statusCode).toBe(200);
    const outsideRangePosts = expectResponseData(
      publicOutsideRange,
      publicLifePostSchema.array(),
      "public life post list outside range"
    );
    expect(
      outsideRangePosts.map((post: { id: string }) => post.id)
    ).not.toContain(postId);

    const publicTouchingStart = await app.inject({
      method: "GET",
      url: "/v1/life/posts?limit=50&from=2026-06-04T03:30:00.000Z&to=2026-06-05T00:00:00.000Z"
    });
    expect(publicTouchingStart.statusCode).toBe(200);
    const touchingStartPosts = expectResponseData(
      publicTouchingStart,
      publicLifePostSchema.array(),
      "public life post list touching range start"
    );
    expect(
      touchingStartPosts.map((post: { id: string }) => post.id)
    ).not.toContain(postId);

    const publicDetail = await app.inject({
      method: "GET",
      url: `/v1/life/posts/${postId}`
    });
    expect(publicDetail.statusCode).toBe(200);
    const publicPost = expectResponseData(
      publicDetail,
      publicLifePostSchema,
      "public life post detail"
    );
    expect(publicPost.id).toBe(postId);
    expect(publicPost.title).toBe("Prayer Night");
    expect(publicPost.body).toBe("Join us for prayer.");
    expect(publicPost.visibility).toBe("public");
    expect(publicPost.displayWeight).toBe(100);
    expect(publicPost.ctaLabel).toBe("Register");
    expect(publicPost.ctaUrl).toBe("https://example.com/prayer-night");
    expect(publicPost.startsAt).toBe("2026-06-04T02:00:00.000Z");
    expect(publicPost.endsAt).toBe("2026-06-04T03:30:00.000Z");
    expect(publicPost.imageUrl).toBe(imageUrl);

    const memberOnlyResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        type: "announcement",
        title: "Members Meal",
        body: "Members-only meal details.",
        meta: "Members only",
        iconName: "meal",
        visibility: "members"
      }
    });
    expect(memberOnlyResponse.statusCode).toBe(200);
    const memberOnlyPost = expectResponseData(
      memberOnlyResponse,
      lifePostSchema,
      "admin members-only life post create"
    );
    const memberOnlyPostId = memberOnlyPost.id;

    const directPublishUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${memberOnlyPostId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(memberOnlyPost.revision)
      },
      payload: {
        status: "published"
      }
    });
    expect(directPublishUpdateResponse.statusCode).toBe(400);

    const invalidProcessingStatusResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${memberOnlyPostId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "processing"
      }
    });
    expect(invalidProcessingStatusResponse.statusCode).toBe(400);
    expect(invalidProcessingStatusResponse.json().error).toMatchObject({
      code: "validation_failed",
      category: "validation_error",
      sourceLayer: "surface"
    });

    const publishMemberOnlyResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${memberOnlyPostId}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(memberOnlyPost.revision)
      },
      payload: {
        visibility: "members",
        notifyApp: true,
        notification: {
          title: "Members meal",
          body: "Dinner details for church members."
        }
      }
    });
    expect(publishMemberOnlyResponse.statusCode).toBe(200);
    const publishedMemberOnly = expectResponseData(
      publishMemberOnlyResponse,
      lifePostSchema,
      "admin members-only life post publish"
    );
    expect(publishedMemberOnly.status).toBe("published");
    expect(publishedMemberOnly.visibility).toBe("members");

    const publishAuditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?resourceType=life_post&resourceId=${memberOnlyPostId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(publishAuditResponse.statusCode).toBe(200);
    const publishAudit = expectResponseData(
      publishAuditResponse,
      auditLogListResponseSchema,
      "life post publish audit"
    ).items.find((log: { action: string }) => log.action === "life_post.publish");
    expect(publishAudit).toMatchObject({
      action: "life_post.publish",
      afterJson: {
        notification: {
          requested: true,
          status: "sent",
          result: {
            attempted: 0
          }
        }
      }
    });

    const publicMemberOnlyDetail = await app.inject({
      method: "GET",
      url: `/v1/life/posts/${memberOnlyPostId}`
    });
    expect(publicMemberOnlyDetail.statusCode).toBe(404);
    expect(publicMemberOnlyDetail.json().error).toMatchObject({
      code: "life_post_not_found",
      evidence: {
        lifePostId: memberOnlyPostId
      }
    });

    const member = await loginMember(app, {
      email: "life-member@example.com",
      displayName: "Life Member"
    });
    const memberLifePosts = await app.inject({
      method: "GET",
      url: "/v1/member/life/posts?limit=50",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberLifePosts.statusCode).toBe(200);
    const memberPosts = expectResponseData(
      memberLifePosts,
      publicLifePostSchema.array(),
      "member life post list"
    );
    expect(
      memberPosts.map((post: { id: string }) => post.id)
    ).toContain(memberOnlyPostId);

    const memberLifeDetail = await app.inject({
      method: "GET",
      url: `/v1/member/life/posts/${memberOnlyPostId}`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberLifeDetail.statusCode).toBe(200);
    const memberPost = expectResponseData(
      memberLifeDetail,
      publicLifePostSchema,
      "member life post detail"
    );
    expect(memberPost.visibility).toBe("members");
    expect(memberPost.isRead).toBe(false);
    expect(memberPost.readAt).toBeNull();

    const markReadResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${memberOnlyPostId}/read`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(markReadResponse.statusCode).toBe(200);
    const readPost = expectResponseData(
      markReadResponse,
      publicLifePostSchema,
      "member life post mark read"
    );
    expect(readPost.id).toBe(memberOnlyPostId);
    expect(readPost.isRead).toBe(true);
    expect(readPost.readAt).toEqual(expect.any(String));

    const memberLifePostsAfterRead = await app.inject({
      method: "GET",
      url: "/v1/member/life/posts?limit=50",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberLifePostsAfterRead.statusCode).toBe(200);
    const memberPostsAfterRead = expectResponseData(
      memberLifePostsAfterRead,
      publicLifePostSchema.array(),
      "member life post list after read"
    );
    expect(
      memberPostsAfterRead.find(
        (post: { id: string }) => post.id === memberOnlyPostId
      )?.isRead
    ).toBe(true);

    await sleep(5);
    const updateMemberOnlyResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${memberOnlyPostId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(publishedMemberOnly.revision)
      },
      payload: {
        title: "Members Meal Updated"
      }
    });
    expect(updateMemberOnlyResponse.statusCode).toBe(200);

    const memberLifeDetailAfterUpdate = await app.inject({
      method: "GET",
      url: `/v1/member/life/posts/${memberOnlyPostId}`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberLifeDetailAfterUpdate.statusCode).toBe(200);
    const unreadAfterUpdate = expectResponseData(
      memberLifeDetailAfterUpdate,
      publicLifePostSchema,
      "member life post detail after update"
    );
    expect(unreadAfterUpdate.title).toBe("Members Meal Updated");
    expect(unreadAfterUpdate.isRead).toBe(false);
    expect(unreadAfterUpdate.readAt).toBe(readPost.readAt);

    const unpublishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/unpublish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(published.revision)
      }
    });
    expect(unpublishResponse.statusCode).toBe(200);
    const unpublished = expectResponseData(
      unpublishResponse,
      lifePostSchema,
      "admin life post unpublish"
    );
    expect(unpublished.visibility).toBe("private");
    expect(unpublished.status).toBe("draft");

    const archiveResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/archive`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(unpublished.revision)
      }
    });
    expect(archiveResponse.statusCode).toBe(200);
    const archived = expectResponseData(
      archiveResponse,
      lifePostSchema,
      "admin life post archive"
    );
    expect(archived.status).toBe("archived");
    expect(archived.visibility).toBe("private");

    const unpublishedDetail = await app.inject({
      method: "GET",
      url: `/v1/life/posts/${postId}`
    });
    expect(unpublishedDetail.statusCode).toBe(404);
    expect(unpublishedDetail.json().error).toMatchObject({
      code: "life_post_not_found",
      evidence: {
        lifePostId: postId
      }
    });

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/v1/admin/life-posts/${postId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(archived.revision)
      }
    });
    expect(deleteResponse.statusCode).toBe(200);
    const deleted = expectResponseData(
      deleteResponse,
      deletedResponseSchema,
      "life post delete"
    );
    expect(deleted.deleted).toBe(true);

    const repeatDeleteResponse = await app.inject({
      method: "DELETE",
      url: `/v1/admin/life-posts/${postId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(archived.revision)
      }
    });
    expect(repeatDeleteResponse.statusCode).toBe(404);
    expect(repeatDeleteResponse.json().error).toMatchObject({
      code: "life_post_not_found",
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

  it("protects life post publishing with atomic content and revisions", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        type: "announcement",
        title: "Atomic draft",
        body: "",
        visibility: "private"
      }
    });
    const draft = expectResponseData(
      createResponse,
      lifePostSchema,
      "life post atomic draft"
    );
    expect(draft.revision).toBe(0);

    const missingRevisionResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${draft.id}/publish`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expect(missingRevisionResponse.statusCode).toBe(400);
    expect(missingRevisionResponse.json().error).toMatchObject({
      code: "validation_failed",
      category: "validation_error"
    });

    const incompleteResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${draft.id}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(draft.revision)
      }
    });
    expect(incompleteResponse.statusCode).toBe(409);
    expect(incompleteResponse.json().error).toMatchObject({
      code: "life_post_publish_not_ready",
      category: "state_conflict",
      evidence: { lifePostId: draft.id, missing: ["body"] }
    });

    const invalidActionResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${draft.id}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(draft.revision)
      },
      payload: {
        content: {
          body: "Ready body with an incomplete action.",
          ctaLabel: "Open details"
        }
      }
    });
    expect(invalidActionResponse.statusCode).toBe(409);
    expect(invalidActionResponse.json().error).toMatchObject({
      code: "life_post_publish_not_ready",
      evidence: { lifePostId: draft.id, missing: ["action"] }
    });

    const invalidActionUrlResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${draft.id}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(draft.revision)
      },
      payload: {
        content: {
          body: "Ready body with a non-web action.",
          ctaLabel: "Email us",
          ctaUrl: "mailto:office@example.com"
        }
      }
    });
    expect(invalidActionUrlResponse.statusCode).toBe(409);
    expect(invalidActionUrlResponse.json().error).toMatchObject({
      code: "life_post_publish_not_ready",
      evidence: { lifePostId: draft.id, missing: ["action_url"] }
    });

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${draft.id}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(draft.revision)
      },
      payload: {
        visibility: "public",
        content: {
          title: "Atomic published post",
          body: "The saved content and published state share one command.",
          ctaLabel: "Open details",
          ctaUrl: "https://example.com/details"
        }
      }
    });
    expect(publishResponse.statusCode).toBe(200);
    const published = expectResponseData(
      publishResponse,
      lifePostSchema,
      "life post atomic publish"
    );
    expect(published).toMatchObject({
      revision: 1,
      status: "published",
      visibility: "public",
      title: "Atomic published post",
      body: "The saved content and published state share one command."
    });

    const staleResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${draft.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(draft.revision)
      },
      payload: { title: "Stale overwrite" }
    });
    expect(staleResponse.statusCode).toBe(409);
    expect(staleResponse.json().error).toMatchObject({
      code: "life_post_state_changed",
      category: "state_conflict",
      nextAction: "refresh"
    });

    const createEditorResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/users",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        email: "life-editor@mbc.local",
        name: "Life Editor",
        role: "content_editor",
        password: "password123"
      }
    });
    expect(createEditorResponse.statusCode).toBe(200);
    const editorLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: "life-editor@mbc.local",
        password: "password123"
      }
    });
    const editorSession = expectResponseData(
      editorLoginResponse,
      adminLoginResponseSchema,
      "life editor login"
    );
    const editorUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${draft.id}`,
      headers: {
        authorization: `Bearer ${editorSession.accessToken}`,
        "x-life-post-revision": String(published.revision)
      },
      payload: { title: "Unauthorized live edit" }
    });
    expect(editorUpdateResponse.statusCode).toBe(403);
    expect(editorUpdateResponse.json().error).toMatchObject({
      code: "life_post_publish_permission_denied",
      category: "permission_denied"
    });

    const reviewDraftResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        type: "announcement",
        title: "Pastor review draft",
        body: "This canonical draft is ready for a publisher to approve.",
        visibility: "private"
      }
    });
    const reviewDraft = expectResponseData(
      reviewDraftResponse,
      lifePostSchema,
      "pastor review draft"
    );
    const createPastorResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/users",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        email: "life-pastor@mbc.local",
        name: "Life Pastor",
        role: "pastor",
        password: "password123"
      }
    });
    expect(createPastorResponse.statusCode).toBe(200);
    const pastorLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: "life-pastor@mbc.local",
        password: "password123"
      }
    });
    const pastorSession = expectResponseData(
      pastorLoginResponse,
      adminLoginResponseSchema,
      "life pastor login"
    );
    const pastorPublishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${reviewDraft.id}/publish`,
      headers: {
        authorization: `Bearer ${pastorSession.accessToken}`,
        "x-life-post-revision": String(reviewDraft.revision)
      },
      payload: { visibility: "public" }
    });
    expect(pastorPublishResponse.statusCode).toBe(200);
    expectResponseData(
      pastorPublishResponse,
      lifePostSchema,
      "pastor canonical publish"
    );

    const publicResponse = await app.inject({
      method: "GET",
      url: `/v1/life/posts/${draft.id}`
    });
    expect(publicResponse.statusCode).toBe(200);
    expect(publicResponse.json().data).not.toHaveProperty("revision");
    const publicPost = expectResponseData(
      publicResponse,
      publicLifePostSchema,
      "life post public revision projection"
    );
    expect(publicPost.title).toBe("Atomic published post");

    await harness.close();
  });
});

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
