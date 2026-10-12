import {
  ministryGroupSchema,
  publicSermonDiscussionGuideSchema,
  sermonDiscussionGuideSchema,
  sermonDiscussionResponseListResponseSchema,
  sermonDiscussionResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("sermon discussion guide routes", () => {
  it("publishes sermon discussion guides and stores private responses without copying sermon source", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);
    const sermonId = "sermon-romans-hope";

    const guideResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        sermonId,
        title: "Romans 8 Hope Discussion",
        summary: "Small group material for applying the sermon.",
        status: "review",
        audienceType: "public",
        questions: [
          {
            id: "q1",
            type: "observation",
            prompt: "What promise stands out in Romans 8:28?",
            sortOrder: 10,
            startSeconds: 60
          },
          {
            id: "q2",
            type: "application",
            prompt: "Where do you need to trust Christ this week?",
            sortOrder: 20
          }
        ],
        actionSteps: [
          {
            id: "a1",
            title: "Pray with one person",
            description: "Share one concern and pray together this week.",
            sortOrder: 10
          }
        ],
        prayerPrompts: ["求主帮助我们在患难中仍信靠祂。"],
        generatedMetadata: {
          internalPrompt: "This must remain admin-only."
        }
      }
    });
    expect(guideResponse.statusCode).toBe(200);
    const reviewGuide = expectResponseData(
      guideResponse,
      sermonDiscussionGuideSchema,
      "sermon discussion guide create"
    );
    expect(reviewGuide).toMatchObject({
      sermonId,
      status: "review",
      audienceType: "public"
    });

    const publishGuideResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermon-discussion-guides/${reviewGuide.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "published",
        expectedRevision: reviewGuide.revision
      }
    });
    expect(publishGuideResponse.statusCode).toBe(200);
    const guide = expectResponseData(
      publishGuideResponse,
      sermonDiscussionGuideSchema,
      "sermon discussion guide publish"
    );
    expect(guide.status).toBe("published");

    const publicGuideResponse = await app.inject({
      method: "GET",
      url: `/v1/sermons/${sermonId}/discussion-guide`
    });
    expect(publicGuideResponse.statusCode).toBe(200);
    const publicGuide = expectResponseData(
      publicGuideResponse,
      publicSermonDiscussionGuideSchema,
      "public sermon discussion guide"
    );
    expect(publicGuide.status).toBe("published");
    expect(publicGuide.audienceType).toBe("public");
    expect(publicGuide.audienceId).toBeNull();
    expect(publicGuide.questions).toHaveLength(2);
    expect(JSON.stringify(publicGuideResponse.json())).not.toContain(
      "transcript"
    );
    expect(publicGuideResponse.json().data).not.toHaveProperty(
      "generatedMetadata"
    );
    expect(JSON.stringify(publicGuideResponse.json())).not.toContain(
      "admin-only"
    );

    const externalId = "ext_sermon_discussion_guest_001";

    const invalidQuestionResponse = await app.inject({
      method: "POST",
      url: `/v1/sermon-discussion-guides/${guide.id}/responses`,
      headers: {
        "x-external-user-id": externalId
      },
      payload: {
        questionId: "missing-question",
        content: "This should not attach to the guide.",
        status: "private"
      }
    });
    expect(invalidQuestionResponse.statusCode).toBe(409);
    expect(invalidQuestionResponse.json().error).toMatchObject({
      code: "sermon_discussion_response_invalid",
      evidence: {
        guideId: guide.id,
        questionId: "missing-question"
      }
    });

    const sharedWithoutGroupResponse = await app.inject({
      method: "POST",
      url: `/v1/sermon-discussion-guides/${guide.id}/responses`,
      headers: {
        "x-external-user-id": externalId
      },
      payload: {
        questionId: "q2",
        content: "I want to share this with a group.",
        status: "shared_with_group"
      }
    });
    expect(sharedWithoutGroupResponse.statusCode).toBe(403);
    expect(sharedWithoutGroupResponse.json().error).toMatchObject({
      code: "sermon_discussion_visibility_denied",
      evidence: {
        guideId: guide.id,
        status: "shared_with_group"
      }
    });

    const responseCreate = await app.inject({
      method: "POST",
      url: `/v1/sermon-discussion-guides/${guide.id}/responses`,
      headers: {
        "x-external-user-id": externalId
      },
      payload: {
        questionId: "q2",
        content: "I will ask my small group to pray with me.",
        status: "private"
      }
    });
    expect(responseCreate.statusCode).toBe(200);
    const userResponse = expectResponseData(
      responseCreate,
      sermonDiscussionResponseSchema,
      "sermon discussion response create"
    );
    expect(userResponse).toMatchObject({
      guideId: guide.id,
      questionId: "q2",
      userType: "external",
      userId: externalId,
      status: "private"
    });

    const responseList = await app.inject({
      method: "GET",
      url: `/v1/admin/sermon-discussion-guides/${guide.id}/responses`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(responseList.statusCode).toBe(200);
    const responses = expectResponseData(
      responseList,
      sermonDiscussionResponseListResponseSchema,
      "admin sermon discussion responses"
    );
    expect(responses.items.map((item) => item.id)).not.toContain(
      userResponse.id
    );
    expect(JSON.stringify(responseList.json())).not.toContain(
      "small group to pray"
    );

    const privateOverrideList = await app.inject({
      method: "GET",
      url: `/v1/admin/sermon-discussion-guides/${guide.id}/responses?status=private`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(privateOverrideList.statusCode).toBe(200);
    const privateOverrideResponses = expectResponseData(
      privateOverrideList,
      sermonDiscussionResponseListResponseSchema,
      "admin private sermon discussion response override"
    );
    expect(privateOverrideResponses.items).toEqual([]);
    expect(JSON.stringify(privateOverrideList.json())).not.toContain(
      "small group to pray"
    );

    const hideResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermon-discussion-guides/responses/${userResponse.id}/hide`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(hideResponse.statusCode).toBe(404);
    expect(hideResponse.json().error).toMatchObject({
      code: "sermon_discussion_response_not_found"
    });
    expect(JSON.stringify(hideResponse.json())).not.toContain(
      "small group to pray"
    );

    const createGroupResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/groups",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        name: "Discussion Guide Test Group",
        description: "A real scoped audience for discussion guide tests.",
        meetingTime: "Sunday 1 PM",
        location: "Room 201",
        leaderName: "Test Leader",
        visibility: "members",
        status: "active",
        capacity: 12
      }
    });
    expect(createGroupResponse.statusCode).toBe(200);
    const group = expectResponseData(
      createGroupResponse,
      ministryGroupSchema,
      "discussion guide audience group create"
    );

    const missingGroupGuideResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        sermonId,
        title: "Missing Group Discussion",
        status: "review",
        audienceType: "group",
        audienceId: "missing-group"
      }
    });
    expect(missingGroupGuideResponse.statusCode).toBe(404);
    expect(missingGroupGuideResponse.json().error).toMatchObject({
      code: "sermon_discussion_audience_target_not_found",
      evidence: {
        audienceType: "group",
        audienceId: "missing-group"
      }
    });

    const groupGuideResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        sermonId,
        title: "Private Group Discussion",
        status: "review",
        audienceType: "group",
        audienceId: group.id
      }
    });
    expect(groupGuideResponse.statusCode).toBe(200);
    const groupReviewGuide = expectResponseData(
      groupGuideResponse,
      sermonDiscussionGuideSchema,
      "group sermon discussion guide create"
    );

    const publishGroupGuideResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermon-discussion-guides/${groupReviewGuide.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "published",
        expectedRevision: groupReviewGuide.revision
      }
    });
    expect(publishGroupGuideResponse.statusCode).toBe(409);
    expect(publishGroupGuideResponse.json().error).toMatchObject({
      code: "sermon_discussion_review_required"
    });

    const addGroupMaterialResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermon-discussion-guides/${groupReviewGuide.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        expectedRevision: groupReviewGuide.revision,
        actionSteps: [
          {
            id: "group-action",
            title: "Pray together",
            description: "Meet and pray this week.",
            sortOrder: 1
          }
        ]
      }
    });
    expect(addGroupMaterialResponse.statusCode).toBe(200);
    const groupGuideWithMaterial = expectResponseData(
      addGroupMaterialResponse,
      sermonDiscussionGuideSchema,
      "group sermon discussion guide material"
    );

    const republishGroupGuideResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermon-discussion-guides/${groupReviewGuide.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "published",
        expectedRevision: groupGuideWithMaterial.revision
      }
    });
    expect(republishGroupGuideResponse.statusCode).toBe(200);
    const groupGuide = expectResponseData(
      republishGroupGuideResponse,
      sermonDiscussionGuideSchema,
      "group sermon discussion guide publish"
    );

    const unauthorizedGroupResponse = await app.inject({
      method: "POST",
      url: `/v1/sermon-discussion-guides/${groupGuide.id}/responses`,
      headers: {
        "x-external-user-id": externalId
      },
      payload: {
        content: "A private group response must not be accepted by UUID.",
        status: "private"
      }
    });
    expect(unauthorizedGroupResponse.statusCode).toBe(404);
    expect(unauthorizedGroupResponse.json().error).toMatchObject({
      code: "sermon_discussion_guide_not_found"
    });

    const draftSermonResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/local-drafts",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "Draft Sermon With Discussion Material",
        speaker: "Pastor Test",
        sermonDate: "2026-06-14"
      }
    });
    expect(draftSermonResponse.statusCode).toBe(200);
    const draftSermonId = draftSermonResponse.json().data.id as string;

    const draftGuideResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        sermonId: draftSermonId,
        title: "Unpublished Discussion Material",
        status: "draft",
        audienceType: "public"
      }
    });
    expect(draftGuideResponse.statusCode).toBe(200);

    const unpublishedGuideResponse = await app.inject({
      method: "GET",
      url: `/v1/sermons/${draftSermonId}/discussion-guide`
    });
    expect(unpublishedGuideResponse.statusCode).toBe(404);
    expect(unpublishedGuideResponse.json().error).toMatchObject({
      code: "sermon_discussion_guide_not_found"
    });

    await harness.close();
  });
});
