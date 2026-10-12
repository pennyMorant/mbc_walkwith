import {
  adminLoginResponseSchema,
  sermonDiscoveryFacetsSchema,
  publicSermonListResponseSchema,
  publicSermonSchema,
  sermonListResponseSchema,
  sermonSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("sermon admin routes", () => {
  it("creates a local sermon draft through admin API", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/local-drafts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        title: "Sunday Sermon",
        speaker: "Pastor",
        sermonDate: "2026-05-10"
      }
    });

    expect(response.statusCode).toBe(200);
    const sermon = expectResponseData(
      response,
      sermonSchema,
      "admin sermon draft"
    );
    expect(sermon.status).toBe("draft");
    expect(sermon.title).toBe("Sunday Sermon");
    await harness.close();
  });

  it("rejects invalid sermon calendar dates at the contract boundary", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/local-drafts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        title: "Invalid Date Sermon",
        speaker: "Pastor",
        sermonDate: "2026-02-30"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatchObject({
      code: "validation_failed",
      category: "validation_error",
      sourceLayer: "surface"
    });
    await harness.close();
  });

  it("lists admin sermons with pagination envelope", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/sermons?limit=1",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const sermons = expectResponseData(
      response,
      sermonListResponseSchema,
      "admin sermon list"
    );
    expect(Array.isArray(sermons.items)).toBe(true);
    expect(sermons.nextCursor).toBeDefined();
    await harness.close();
  });

  it("returns public sermon recommendations for Bible reader context", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const response = await app.inject({
      method: "GET",
      url: "/v1/sermons/recommendations?bookId=rom&chapter=8&verseId=rom.8.28"
    });

    expect(response.statusCode).toBe(200);
    const recommendations = expectResponseData(
      response,
      publicSermonListResponseSchema,
      "public sermon recommendations"
    );
    expect(recommendations.items[0]?.id).toBe("sermon-romans-hope");
    expect(recommendations.items[0]?.references[0]?.verseId).toBe("rom.8.28");
    expect(response.json().data.items[0]).not.toHaveProperty("reviewMarkdown");
    expect(response.json().data.items[0]).not.toHaveProperty(
      "processingMetadata"
    );
    expect(response.json().data.items[0]).not.toHaveProperty("revision");

    const unrelatedChapterResponse = await app.inject({
      method: "GET",
      url: "/v1/sermons/recommendations?bookId=rom&chapter=1"
    });
    expect(unrelatedChapterResponse.statusCode).toBe(200);
    expect(unrelatedChapterResponse.json().data.items).toEqual([]);
    await harness.close();
  });

  it("returns published sermon discovery facets", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const response = await app.inject({
      method: "GET",
      url: "/v1/sermons/facets"
    });

    expect(response.statusCode).toBe(200);
    const facets = expectResponseData(
      response,
      sermonDiscoveryFacetsSchema,
      "public sermon discovery facets"
    );
    expect(facets.speakers).toContain("Pastor David Chen");
    expect(facets.series).toContain("Romans");
    expect(facets.topics).toEqual(["Hope", "Suffering"]);
    await harness.close();
  });

  it("requires admin auth for admin sermon APIs", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/sermons"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toMatchObject({
      code: "admin_auth_required",
      category: "authentication_required",
      sourceLayer: "surface",
      nextAction: "sign_in"
    });
    await harness.close();
  });

  it("requires review-ready sermon content before publishing drafts", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const draft = await createLocalSermon(app, accessToken, {
      title: "Publish Me"
    });
    const sermonId = draft.id;
    const publishDraftResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(draft.revision)
      }
    });
    expect(publishDraftResponse.statusCode).toBe(409);
    expect(publishDraftResponse.json().error).toMatchObject({
      code: "review_required",
      category: "validation_error",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "review_request"
    });
    expect(publishDraftResponse.json().error.evidence.missing).toEqual(
      expect.arrayContaining([
        "audio",
        "transcript",
        "outline",
        "scripture_references"
      ])
    );

    const patchDraftResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermons/${sermonId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(draft.revision)
      },
      payload: {
        status: "published"
      }
    });
    expect(patchDraftResponse.statusCode).toBe(409);
    expect(patchDraftResponse.json().error).toMatchObject({
      code: "review_required",
      nextAction: "review_request"
    });

    const uploadResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/audio`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "audio/mpeg",
        "x-file-name": encodeURIComponent("publish-me.mp3"),
        "x-sermon-revision": String(draft.revision)
      },
      payload: Buffer.from("reviewed sermon audio")
    });
    expect(uploadResponse.statusCode).toBe(200);
    const uploaded = expectResponseData(
      uploadResponse,
      sermonSchema,
      "admin sermon audio upload"
    );

    const reviewReadyResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermons/${sermonId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(uploaded.revision)
      },
      payload: {
        summary: "Reviewed and ready for the church.",
        status: "needs_review",
        transcript: {
          text: "Reviewed transcript body.",
          source: "manual_review",
          updatedAt: null
        },
        outline: [
          {
            title: "Hope in Christ",
            startSeconds: 0,
            summary: "The sermon opens with hope."
          }
        ],
        references: [
          {
            reference: "Romans 8:28",
            verseId: "rom.8.28",
            note: "Main text",
            startSeconds: 10
          }
        ]
      }
    });
    expect(reviewReadyResponse.statusCode).toBe(200);
    const reviewReady = expectResponseData(
      reviewReadyResponse,
      sermonSchema,
      "admin sermon review ready"
    );
    expect(reviewReady.status).toBe("needs_review");

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(reviewReady.revision)
      }
    });

    expect(publishResponse.statusCode).toBe(200);
    const published = expectResponseData(
      publishResponse,
      sermonSchema,
      "admin sermon publish"
    );
    expect(published.status).toBe("published");
    expect(published.audio.status).toBe("ready");
    await harness.close();
  });

  it("returns feature permission errors when editors publish sermons", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createEditorResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/users",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        email: "sermon-editor@mbc.local",
        name: "Sermon Editor",
        role: "content_editor",
        password: "password123"
      }
    });
    expect(createEditorResponse.statusCode).toBe(200);

    const editorLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: "sermon-editor@mbc.local",
        password: "password123"
      }
    });
    expect(editorLoginResponse.statusCode).toBe(200);
    const editorSession = expectResponseData(
      editorLoginResponse,
      adminLoginResponseSchema,
      "editor admin login"
    );
    const editorAccessToken = editorSession.accessToken;

    const editorDraft = await createLocalSermon(app, editorAccessToken, {
      title: "Editor Draft"
    });
    const sermonId = editorDraft.id;

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/publish`,
      headers: {
        authorization: `Bearer ${editorAccessToken}`,
        "x-sermon-revision": String(editorDraft.revision)
      }
    });

    expect(publishResponse.statusCode).toBe(403);
    expect(publishResponse.json().error).toMatchObject({
      code: "publish_permission_denied",
      category: "permission_denied",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      evidence: { sermonId },
      nextAction: "request_permission"
    });

    const updatePublishedResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/sermons/sermon-romans-hope",
      headers: {
        authorization: `Bearer ${editorAccessToken}`,
        "x-sermon-revision": "0"
      },
      payload: {
        summary: "An editor must not change live sermon content."
      }
    });
    expect(updatePublishedResponse.statusCode).toBe(403);
    expect(updatePublishedResponse.json().error).toMatchObject({
      code: "publish_permission_denied",
      evidence: { sermonId: "sermon-romans-hope" }
    });

    const uploadPublishedAudioResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/sermon-romans-hope/audio",
      headers: {
        authorization: `Bearer ${editorAccessToken}`,
        "content-type": "audio/mpeg",
        "x-file-name": "unauthorized.mp3",
        "x-sermon-revision": "0"
      },
      payload: Buffer.from("unauthorized audio")
    });
    expect(uploadPublishedAudioResponse.statusCode).toBe(403);
    expect(uploadPublishedAudioResponse.json().error).toMatchObject({
      code: "publish_permission_denied",
      evidence: { sermonId: "sermon-romans-hope" }
    });

    const unpublishResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/sermon-romans-hope/return-draft",
      headers: {
        authorization: `Bearer ${editorAccessToken}`,
        "x-sermon-revision": "0"
      }
    });
    expect(unpublishResponse.statusCode).toBe(403);
    expect(unpublishResponse.json().error).toMatchObject({
      code: "publish_permission_denied",
      evidence: { sermonId: "sermon-romans-hope" }
    });
    await harness.close();
  });

  it("creates local sermon drafts and imports reviewed local package data", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/local-drafts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        title: "Local Processed Sermon",
        speaker: "Pastor Local",
        sermonDate: "2026-05-24",
        series: "Psalms",
        primaryReference: "Psalm 23",
        summary: "Draft summary",
        transcript: {
          text: "Initial prepared manuscript.",
          source: "manual",
          updatedAt: null
        },
        reviewMarkdown: "# Initial review"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const sermon = expectResponseData(
      createResponse,
      sermonSchema,
      "admin local sermon create"
    );
    const sermonId = sermon.id;
    expect(sermon.status).toBe("draft");
    expect(sermon.title).toBe("Local Processed Sermon");
    expect(sermon.transcript).toMatchObject({
      text: "Initial prepared manuscript.",
      source: "manual"
    });
    expect(sermon.transcript?.updatedAt).toEqual(expect.any(String));
    expect(sermon.reviewMarkdown).toBe("# Initial review");

    const draftPublicResponse = await app.inject({
      method: "GET",
      url: `/v1/sermons/${sermonId}`
    });
    expect(draftPublicResponse.statusCode).toBe(404);
    expect(draftPublicResponse.json().error).toMatchObject({
      code: "sermon_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh"
    });

    const packageResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/local-package`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(sermon.revision)
      },
      payload: {
        summary: "Reviewed local summary",
        durationSeconds: 1991,
        transcript: {
          text: "Reviewed transcript body.",
          source: "local_whisper:ggml-large-v3.bin",
          updatedAt: null
        },
        outline: [
          {
            title: "The shepherd leads",
            startSeconds: 0,
            summary: "The Lord leads with care."
          }
        ],
        references: [
          {
            reference: "Psalm 23:1",
            verseId: "psa.23.1",
            note: "Primary text"
          }
        ],
        reviewMarkdown: "# Local Processed Sermon\n\n## Summary\nReviewed local summary",
        processingMetadata: {
          pipeline: "local-sermon-studio",
          transcriptionProvider: "local-whisper",
          summaryProvider: "local-ai"
        },
        submitForReview: true
      }
    });
    expect(packageResponse.statusCode).toBe(200);
    const packaged = expectResponseData(
      packageResponse,
      sermonSchema,
      "admin local sermon package"
    );
    expect(packaged.status).toBe("needs_review");
    expect(packaged.reviewMarkdown).toContain("# Local Processed Sermon");
    expect(packaged.processingMetadata?.pipeline).toBe(
      "local-sermon-studio"
    );
    expect(packaged.durationSeconds).toBe(1991);
    expect(packaged.transcript?.text).toBe("Reviewed transcript body.");
    expect(packaged.references[0]?.verseId).toBe("psa.23.1");

    const uploadResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/audio`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "audio/mpeg",
        "x-file-name": encodeURIComponent("local-processed-sermon.mp3"),
        "x-sermon-revision": String(packaged.revision)
      },
      payload: Buffer.from("local processed sermon audio")
    });
    expect(uploadResponse.statusCode).toBe(200);
    const uploaded = expectResponseData(
      uploadResponse,
      sermonSchema,
      "admin local sermon audio upload"
    );
    expect(uploaded.audio.status).toBe("ready");

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(uploaded.revision)
      }
    });
    expect(publishResponse.statusCode).toBe(200);
    const published = expectResponseData(
      publishResponse,
      sermonSchema,
      "admin local sermon publish"
    );
    expect(published.status).toBe("published");

    const publicResponse = await app.inject({
      method: "GET",
      url: `/v1/sermons/${sermonId}`
    });
    expect(publicResponse.statusCode).toBe(200);
    const publicSermon = expectResponseData(
      publicResponse,
      publicSermonSchema,
      "public local sermon"
    );
    expect(publicSermon.transcript?.text).toBe("Reviewed transcript body.");
    expect(publicResponse.json().data).not.toHaveProperty("reviewMarkdown");
    expect(publicResponse.json().data).not.toHaveProperty(
      "processingMetadata"
    );
    expect(publicResponse.json().data).not.toHaveProperty("revision");
    await harness.close();
  });

  it("rejects a stale admin editor revision without overwriting canonical data", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const draft = await createLocalSermon(app, accessToken, {
      title: "Concurrent Editor Draft"
    });

    const firstResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermons/${draft.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(draft.revision)
      },
      payload: { summary: "First editor canonical change." }
    });
    expect(firstResponse.statusCode).toBe(200);
    const first = expectResponseData(
      firstResponse,
      sermonSchema,
      "first concurrent sermon edit"
    );
    expect(first.revision).toBe(draft.revision + 1);

    const staleResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermons/${draft.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(draft.revision)
      },
      payload: { summary: "Stale editor overwrite." }
    });
    expect(staleResponse.statusCode).toBe(409);
    expect(staleResponse.json().error).toMatchObject({
      code: "sermon_state_changed",
      category: "state_conflict",
      evidence: { sermonId: draft.id },
      nextAction: "refresh"
    });

    const canonicalResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/sermons/${draft.id}`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const canonical = expectResponseData(
      canonicalResponse,
      sermonSchema,
      "canonical sermon after stale edit"
    );
    expect(canonical.summary).toBe("First editor canonical change.");
    expect(canonical.revision).toBe(first.revision);
    await harness.close();
  });

  it("requires a valid revision header for existing sermon mutations", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const draft = await createLocalSermon(app, accessToken, {
      title: "Revision Header Draft"
    });

    for (const revision of [undefined, "", "-1", "not-a-revision"]) {
      const response = await app.inject({
        method: "PATCH",
        url: `/v1/admin/sermons/${draft.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
          ...(revision !== undefined
            ? { "x-sermon-revision": revision }
            : {})
        },
        payload: { summary: "Must not be stored." }
      });
      expect(response.statusCode).toBe(400);
    }

    const canonicalResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/sermons/${draft.id}`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const canonical = expectResponseData(
      canonicalResponse,
      sermonSchema,
      "sermon after invalid revision headers"
    );
    expect(canonical.summary).toBeNull();
    expect(canonical.revision).toBe(draft.revision);
    await harness.close();
  });

  it("saves reviewed sermon content and publishes through admin PATCH", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const draft = await createLocalSermon(app, accessToken, {
      title: "Reviewed Sermon"
    });
    const sermonId = draft.id;

    const uploadResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/audio`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "audio/mpeg",
        "x-file-name": encodeURIComponent("reviewed-sermon.mp3"),
        "x-sermon-revision": String(draft.revision)
      },
      payload: Buffer.from("reviewed sermon audio bytes")
    });
    expect(uploadResponse.statusCode).toBe(200);
    const uploaded = expectResponseData(
      uploadResponse,
      sermonSchema,
      "admin reviewed sermon audio upload"
    );
    expect(uploaded.audio.status).toBe("ready");

    const patchResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermons/${sermonId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(uploaded.revision)
      },
      payload: {
        title: "Reviewed Sermon Final",
        speaker: "Pastor",
        sermonDate: "2026-05-10",
        summary: "Reviewed and ready.",
        status: "published",
        transcript: {
          text: "Reviewed transcript body.",
          source: "local_whisper:ggml-large-v3.bin",
          updatedAt: null
        },
        outline: [
          {
            title: "Opening",
            startSeconds: 0,
            summary: "Introduction"
          }
        ],
        references: [
          {
            reference: "Romans 8:28",
            verseId: "rom.8.28",
            note: "Main text",
            startSeconds: 30
          }
        ]
      }
    });

    expect(patchResponse.statusCode).toBe(200);
    const patched = expectResponseData(
      patchResponse,
      sermonSchema,
      "admin reviewed sermon patch"
    );
    expect(patched.status).toBe("published");
    expect(patched.publishedAt).toEqual(expect.any(String));
    expect(patched.outline).toHaveLength(1);
    expect(patched.references[0]?.verseId).toBe("rom.8.28");
    expect(patched.transcript?.text).toBe("Reviewed transcript body.");
    await harness.close();
  });
});

type TestApp = Awaited<ReturnType<typeof buildTestApp>>["app"];

async function createLocalSermon(
  app: TestApp,
  accessToken: string,
  payload: Record<string, unknown>
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/sermons/local-drafts",
    headers: {
      authorization: `Bearer ${accessToken}`
    },
    payload: {
      speaker: "Pastor",
      sermonDate: "2026-05-10",
      ...payload
    }
  });
  expect(response.statusCode).toBe(200);
  return expectResponseData(response, sermonSchema, "admin local sermon");
}
