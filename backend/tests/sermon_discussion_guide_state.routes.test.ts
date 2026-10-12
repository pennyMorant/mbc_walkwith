import {
  auditLogListResponseSchema,
  sermonDiscussionGuideSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("sermon discussion guide state routes", () => {
  it("enforces review, audience, content lock, and publication lifecycle", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const headers = { authorization: `Bearer ${accessToken}` };
    const sermonId = "sermon-romans-hope";

    const directPublish = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers,
      payload: {
        sermonId,
        title: "Direct publish must fail",
        status: "published",
        audienceType: "public",
        prayerPrompts: ["Pray for wisdom."]
      }
    });
    expect(directPublish.statusCode).toBe(409);
    expect(directPublish.json().error).toMatchObject({
      code: "sermon_discussion_transition_invalid",
      evidence: {
        fromStatus: "new",
        toStatus: "published"
      }
    });

    const invalidPublicAudience = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers,
      payload: {
        sermonId,
        title: "Invalid public audience",
        status: "draft",
        audienceType: "public",
        audienceId: "must-not-be-present"
      }
    });
    expect(invalidPublicAudience.statusCode).toBe(400);
    expect(invalidPublicAudience.json().error).toMatchObject({
      code: "sermon_discussion_audience_invalid"
    });

    const invalidGroupAudience = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers,
      payload: {
        sermonId,
        title: "Invalid group audience",
        status: "draft",
        audienceType: "group"
      }
    });
    expect(invalidGroupAudience.statusCode).toBe(400);
    expect(invalidGroupAudience.json().error).toMatchObject({
      code: "sermon_discussion_audience_invalid"
    });

    const emptyPrayerPrompt = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers,
      payload: {
        sermonId,
        title: "Empty prayer prompt",
        status: "review",
        audienceType: "public",
        prayerPrompts: [""]
      }
    });
    expect(emptyPrayerPrompt.statusCode).toBe(400);

    const createDraft = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers,
      payload: {
        sermonId,
        title: "Reviewed discussion guide",
        status: "draft",
        audienceType: "public",
        audienceId: "",
        generatedMetadata: {
          source: "ai",
          details: { first: 1, second: 2 }
        },
        questions: [
          {
            id: "review-question",
            type: "application",
            prompt: "What will you practice this week?",
            sortOrder: 1
          }
        ]
      }
    });
    expect(createDraft.statusCode).toBe(200);
    const draft = expectResponseData(
      createDraft,
      sermonDiscussionGuideSchema,
      "discussion guide draft"
    );
    expect(draft.audienceId).toBeNull();

    const skipReview = await patchGuide(app, headers, draft.id, {
      status: "published"
    });
    expect(skipReview.statusCode).toBe(409);
    expect(skipReview.json().error).toMatchObject({
      code: "sermon_discussion_transition_invalid"
    });

    const review = await patchGuide(app, headers, draft.id, {
      status: "review"
    });
    expect(review.statusCode).toBe(200);

    const publish = await patchGuide(app, headers, draft.id, {
      status: "published"
    });
    expect(publish.statusCode).toBe(200);
    const published = expectResponseData(
      publish,
      sermonDiscussionGuideSchema,
      "discussion guide publish"
    );
    expect(published.publishedAt).toEqual(expect.any(String));

    const createCompetingGuide = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers,
      payload: {
        sermonId,
        title: "Competing public guide",
        status: "review",
        audienceType: "public",
        prayerPrompts: ["Pray for a single clear application."]
      }
    });
    expect(createCompetingGuide.statusCode).toBe(200);
    const competingGuide = expectResponseData(
      createCompetingGuide,
      sermonDiscussionGuideSchema,
      "competing public discussion guide"
    );
    const competingPublish = await patchGuide(
      app,
      headers,
      competingGuide.id,
      { status: "published" }
    );
    expect(competingPublish.statusCode).toBe(409);
    expect(competingPublish.json().error).toMatchObject({
      code: "sermon_discussion_public_guide_conflict",
      evidence: { sermonId }
    });

    const equivalentMetadata = await patchGuide(app, headers, draft.id, {
      generatedMetadata: {
        details: { second: 2, first: 1 },
        source: "ai"
      }
    });
    expect(equivalentMetadata.statusCode).toBe(200);

    const mutatePublished = await patchGuide(app, headers, draft.id, {
      title: "Changed without review"
    });
    expect(mutatePublished.statusCode).toBe(409);
    expect(mutatePublished.json().error).toMatchObject({
      code: "sermon_discussion_transition_invalid",
      evidence: { reason: "published_content_locked" }
    });

    const returnToReview = await patchGuide(app, headers, draft.id, {
      status: "review"
    });
    expect(returnToReview.statusCode).toBe(200);
    expect(returnToReview.json().data.publishedAt).toBeNull();

    const editInReview = await patchGuide(app, headers, draft.id, {
      title: "Changed after returning to review"
    });
    expect(editInReview.statusCode).toBe(200);

    const republish = await patchGuide(app, headers, draft.id, {
      status: "published"
    });
    expect(republish.statusCode).toBe(200);
    expect(republish.json().data.publishedAt).toEqual(expect.any(String));

    const archive = await patchGuide(app, headers, draft.id, {
      status: "archived"
    });
    expect(archive.statusCode).toBe(200);
    expect(archive.json().data.publishedAt).toBeNull();

    const publishAfterSlotReleased = await patchGuide(
      app,
      headers,
      competingGuide.id,
      { status: "published" }
    );
    expect(publishAfterSlotReleased.statusCode).toBe(200);

    const publishArchived = await patchGuide(app, headers, draft.id, {
      status: "published"
    });
    expect(publishArchived.statusCode).toBe(409);
    expect(publishArchived.json().error).toMatchObject({
      code: "sermon_discussion_transition_invalid"
    });

    const restoreDraft = await patchGuide(app, headers, draft.id, {
      status: "draft"
    });
    expect(restoreDraft.statusCode).toBe(200);

    const draftSermon = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/local-drafts",
      headers,
      payload: {
        title: "Draft sermon",
        speaker: "Pastor Test",
        sermonDate: "2026-06-21"
      }
    });
    expect(draftSermon.statusCode).toBe(200);

    const guideForDraftSermon = await app.inject({
      method: "POST",
      url: "/v1/admin/sermon-discussion-guides",
      headers,
      payload: {
        sermonId: draftSermon.json().data.id,
        title: "Guide for draft sermon",
        status: "review",
        audienceType: "public",
        actionSteps: [
          {
            id: "draft-sermon-action",
            title: "Wait for sermon review",
            description: "",
            sortOrder: 1
          }
        ]
      }
    });
    expect(guideForDraftSermon.statusCode).toBe(200);

    const draftSermonGuide = expectResponseData(
      guideForDraftSermon,
      sermonDiscussionGuideSchema,
      "guide for draft sermon"
    );
    const publishBeforeSermon = await patchGuide(
      app,
      headers,
      draftSermonGuide.id,
      { status: "published" }
    );
    expect(publishBeforeSermon.statusCode).toBe(409);
    expect(publishBeforeSermon.json().error).toMatchObject({
      code: "sermon_discussion_sermon_not_published"
    });

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=sermon_discussion_guide&limit=100",
      headers
    });
    expect(auditResponse.statusCode).toBe(200);
    const audits = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "discussion guide state audit"
    );
    expect(audits.items.map((item) => item.action)).toEqual(
      expect.arrayContaining([
        "sermon_discussion_guide.publish",
        "sermon_discussion_guide.review",
        "sermon_discussion_guide.archive"
      ])
    );

    await harness.close();
  });
});

async function patchGuide(
  app: Awaited<ReturnType<typeof buildTestApp>>["app"],
  headers: { authorization: string },
  guideId: string,
  payload: Record<string, unknown>
) {
  const guides = await app.inject({
    method: "GET",
    url: "/v1/admin/sermon-discussion-guides",
    headers
  });
  const guide = (guides.json().data.items as Array<{
    id: string;
    revision: number;
  }>).find((item) => item.id === guideId);
  if (!guide) {
    throw new Error(`Discussion guide ${guideId} was not found in test setup.`);
  }
  return app.inject({
    method: "PATCH",
    url: `/v1/admin/sermon-discussion-guides/${guideId}`,
    headers,
    payload: { ...payload, expectedRevision: guide.revision }
  });
}
