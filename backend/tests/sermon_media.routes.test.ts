import {
  deletedResponseSchema,
  publicSermonSchema,
  sermonSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("sermon media routes", () => {
  it("publishes church-recorded sermons with uploaded manuscript and audio", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/local-drafts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        title: "Church Recorded Sermon",
        speaker: "Pastor Audio",
        sermonDate: "2026-06-07",
        series: "Church Archive",
        primaryReference: "John 15:5",
        summary: "A church-recorded sermon draft."
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const draft = expectResponseData(
      createResponse,
      sermonSchema,
      "admin sermon media draft"
    );
    const sermonId = draft.id;

    const manuscriptResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/sermons/${sermonId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(draft.revision)
      },
      payload: {
        transcript: {
          text: "Prepared manuscript uploaded by church staff.",
          source: "church-recorded-sermon.md",
          updatedAt: null
        },
        reviewMarkdown:
          "# Church Recorded Sermon\n\nReviewed manuscript notes.",
        outline: [
          {
            title: "Abide in Christ",
            startSeconds: 0,
            summary: "Jesus calls disciples to abide in him."
          }
        ],
        references: [
          {
            reference: "John 15:5",
            verseId: "jhn.15.5",
            note: "Main sermon text",
            startSeconds: 45
          }
        ]
      }
    });
    expect(manuscriptResponse.statusCode).toBe(200);
    const manuscript = expectResponseData(
      manuscriptResponse,
      sermonSchema,
      "admin sermon manuscript"
    );
    expect(manuscript.transcript?.text).toContain("Prepared manuscript");
    expect(manuscript.transcript?.source).toBe(
      "church-recorded-sermon.md"
    );
    expect(manuscript.reviewMarkdown).toContain(
      "Reviewed manuscript notes"
    );

    const uploadResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/audio`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "audio/mpeg",
        "x-file-name": encodeURIComponent("church-recorded-sermon.mp3"),
        "x-sermon-revision": String(manuscript.revision)
      },
      payload: Buffer.from("church recorded audio bytes")
    });
    expect(uploadResponse.statusCode).toBe(200);
    const uploaded = expectResponseData(
      uploadResponse,
      sermonSchema,
      "admin sermon media audio upload"
    );
    expect(uploaded.audio.status).toBe("ready");
    expect(uploaded.audio.fileName).toBe("church-recorded-sermon.mp3");

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
      "admin sermon media publish"
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
      "public sermon media detail"
    );
    expect(publicSermon.audio.status).toBe("ready");
    expect(publicSermon.transcript?.text).toContain("Prepared manuscript");
    expect(publicResponse.json().data).not.toHaveProperty("reviewMarkdown");
    expect(publicResponse.json().data).not.toHaveProperty(
      "processingMetadata"
    );
    expect(publicResponse.json().data).not.toHaveProperty("revision");

    const audioResponse = await app.inject({
      method: "GET",
      url: `/v1/sermons/${sermonId}/audio`,
      headers: {
        range: "bytes=0-5"
      }
    });
    expect(audioResponse.statusCode).toBe(206);
    expect(audioResponse.body).toBe("church");
    await harness.close();
  });

  it("uploads and streams sermon audio through sermon APIs", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const uploadResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/sermon-romans-hope/audio",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "audio/mpeg",
        "x-file-name": encodeURIComponent("romans-hope.mp3"),
        "x-sermon-revision": "0"
      },
      payload: Buffer.from("demo audio bytes")
    });

    expect(uploadResponse.statusCode).toBe(200);
    const uploaded = expectResponseData(
      uploadResponse,
      sermonSchema,
      "admin sermon audio upload"
    );
    expect(uploaded.audio.status).toBe("ready");
    expect(uploaded.audio.fileName).toBe("romans-hope.mp3");

    const streamResponse = await app.inject({
      method: "GET",
      url: "/v1/sermons/sermon-romans-hope/audio",
      headers: {
        range: "bytes=0-3"
      }
    });
    expect(streamResponse.statusCode).toBe(206);
    expect(streamResponse.headers["content-range"]).toBe("bytes 0-3/16");
    expect(streamResponse.body).toBe("demo");

    const suffixRangeResponse = await app.inject({
      method: "GET",
      url: "/v1/sermons/sermon-romans-hope/audio",
      headers: {
        range: "bytes=-5"
      }
    });
    expect(suffixRangeResponse.statusCode).toBe(206);
    expect(suffixRangeResponse.headers["content-range"]).toBe("bytes 11-15/16");
    expect(suffixRangeResponse.body).toBe("bytes");

    const invalidRangeResponse = await app.inject({
      method: "GET",
      url: "/v1/sermons/sermon-romans-hope/audio",
      headers: {
        range: "bytes=10-3"
      }
    });
    expect(invalidRangeResponse.statusCode).toBe(200);
    expect(invalidRangeResponse.headers["content-range"]).toBeUndefined();
    expect(invalidRangeResponse.body).toBe("demo audio bytes");

    const lockedDeleteResponse = await app.inject({
      method: "DELETE",
      url: "/v1/admin/sermons/sermon-romans-hope/audio",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(uploaded.revision)
      }
    });
    expect(lockedDeleteResponse.statusCode).toBe(409);
    expect(lockedDeleteResponse.json().error).toMatchObject({
      code: "sermon_published_asset_locked",
      category: "state_conflict",
      evidence: { sermonId: "sermon-romans-hope", asset: "audio" },
      nextAction: "return_draft"
    });

    const returnDraftResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/sermon-romans-hope/return-draft",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(uploaded.revision)
      }
    });
    expect(returnDraftResponse.statusCode).toBe(200);
    const returnedDraft = expectResponseData(
      returnDraftResponse,
      sermonSchema,
      "admin sermon return draft before audio delete"
    );

    const deleteAudioResponse = await app.inject({
      method: "DELETE",
      url: "/v1/admin/sermons/sermon-romans-hope/audio",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(returnedDraft.revision)
      }
    });
    expect(deleteAudioResponse.statusCode).toBe(200);
    const deletedAudio = expectResponseData(
      deleteAudioResponse,
      sermonSchema,
      "admin sermon audio delete"
    );
    expect(deletedAudio.audio.status).toBe("missing");

    const missingResponse = await app.inject({
      method: "GET",
      url: "/v1/sermons/sermon-romans-hope/audio"
    });
    expect(missingResponse.statusCode).toBe(404);
    expect(missingResponse.json().error).toMatchObject({
      code: "sermon_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh"
    });
    await harness.close();
  });

  it("imports reviewed local sermon packages instead of server transcription jobs", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const draft = await createLocalSermon(app, accessToken, {
      title: "Locally Processed Sermon"
    });
    const sermonId = draft.id;

    const uploadResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/audio`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "audio/mpeg",
        "x-file-name": encodeURIComponent("locally-processed.mp3"),
        "x-sermon-revision": String(draft.revision)
      },
      payload: Buffer.from("demo audio bytes")
    });
    expect(uploadResponse.statusCode).toBe(200);
    const uploaded = expectResponseData(
      uploadResponse,
      sermonSchema,
      "admin local sermon audio upload"
    );

    const localPackageResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/local-package`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(uploaded.revision)
      },
      payload: {
        transcript: {
          text: "Reviewed local transcript body.",
          source: "local-sermon-studio",
          updatedAt: null
        },
        outline: [
          {
            title: "Local outline point",
            startSeconds: 0,
            summary: "Prepared and reviewed before upload."
          }
        ],
        references: [
          {
            reference: "John 15:5",
            verseId: "jhn.15.5",
            note: "Reviewed local reference",
            startSeconds: 45
          }
        ],
        reviewMarkdown: "# Locally Processed Sermon\n\nReviewed package.",
        processingMetadata: {
          pipeline: "local-sermon-studio",
          transcriptionProvider: "faster-whisper-cpu"
        },
        submitForReview: true
      }
    });
    expect(localPackageResponse.statusCode).toBe(200);
    const localPackage = expectResponseData(
      localPackageResponse,
      sermonSchema,
      "admin local sermon package"
    );
    expect(localPackage.status).toBe("needs_review");

    const sermonResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/sermons/${sermonId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(sermonResponse.statusCode).toBe(200);
    const sermon = expectResponseData(
      sermonResponse,
      sermonSchema,
      "admin local sermon detail"
    );
    expect(sermon.status).toBe("needs_review");
    expect(sermon.transcript?.text).toContain("Reviewed local transcript");
    expect(sermon.outline).toHaveLength(1);
    expect(sermon.references).toHaveLength(1);
    expect(sermon.processingMetadata?.pipeline).toBe(
      "local-sermon-studio"
    );
    await harness.close();
  });

  it("archives and deletes sermons through admin API", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const draft = await createLocalSermon(app, accessToken, {
      title: "Remove Me"
    });
    const sermonId = draft.id;

    const archiveResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/archive`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(draft.revision)
      }
    });
    expect(archiveResponse.statusCode).toBe(200);
    const archived = expectResponseData(
      archiveResponse,
      sermonSchema,
      "admin sermon archive"
    );
    expect(archived.status).toBe("archived");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/v1/admin/sermons/${sermonId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(archived.revision)
      }
    });
    expect(deleteResponse.statusCode).toBe(200);
    const deleted = expectResponseData(
      deleteResponse,
      deletedResponseSchema,
      "admin sermon delete"
    );
    expect(deleted.deleted).toBe(true);
    await harness.close();
  });

  it("moves sermons through review workflow actions", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const initialDraft = await createLocalSermon(app, accessToken, {
      title: "Review Me"
    });
    const sermonId = initialDraft.id;

    const reviewResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/submit-review`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(initialDraft.revision)
      }
    });
    expect(reviewResponse.statusCode).toBe(200);
    const review = expectResponseData(
      reviewResponse,
      sermonSchema,
      "admin sermon submit review"
    );
    expect(review.status).toBe("needs_review");

    const draftResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/return-draft`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(review.revision)
      }
    });
    expect(draftResponse.statusCode).toBe(200);
    const draft = expectResponseData(
      draftResponse,
      sermonSchema,
      "admin sermon return draft"
    );
    expect(draft.status).toBe("draft");

    const failedResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/${sermonId}/mark-failed`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-sermon-revision": String(draft.revision)
      }
    });
    expect(failedResponse.statusCode).toBe(200);
    const failed = expectResponseData(
      failedResponse,
      sermonSchema,
      "admin sermon mark failed"
    );
    expect(failed.status).toBe("failed");
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
  return expectResponseData(response, sermonSchema, "admin sermon draft");
}
