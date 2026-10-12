import {
  adminLoginResponseSchema,
  auditLogListResponseSchema,
  sermonAudioCleanupListResponseSchema,
  sermonAudioCleanupTaskSchema,
  sermonSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("sermon audio cleanup routes", () => {
  it("lists safe cleanup evidence and retries idempotently", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/local-drafts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        title: "Cleanup route sermon",
        speaker: "Pastor",
        sermonDate: "2026-07-12"
      }
    });
    let sermon = expectResponseData(
      createResponse,
      sermonSchema,
      "cleanup route sermon"
    );

    sermon = await uploadAudio(app, accessToken, sermon, "first.mp3");
    sermon = await uploadAudio(app, accessToken, sermon, "second.mp3");

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/sermons/audio-cleanups?status=succeeded",
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expect(listResponse.statusCode).toBe(200);
    const list = expectResponseData(
      listResponse,
      sermonAudioCleanupListResponseSchema,
      "sermon audio cleanup list"
    );
    const task = list.items.find((item) => item.sermonId === sermon.id);
    expect(task).toMatchObject({
      reason: "audio_replaced",
      status: "succeeded",
      attempts: 1,
      lastError: null
    });
    expect(listResponse.json().data.items[0]).not.toHaveProperty("storagePath");

    const retryResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/sermons/audio-cleanups/${task!.id}/retry`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expect(retryResponse.statusCode).toBe(200);
    expectResponseData(
      retryResponse,
      sermonAudioCleanupTaskSchema,
      "idempotent sermon audio cleanup retry"
    );
    expect(retryResponse.json().data.attempts).toBe(1);

    const auditResponse = await app.inject({
      method: "GET",
      url:
        "/v1/admin/audit-logs?action=sermon.audio_cleanup.retry" +
        `&resourceType=sermon_audio_cleanup_task&resourceId=${task!.id}`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "sermon audio cleanup retry audit"
    );
    expect(audit.items).toHaveLength(1);
    expect(JSON.stringify(audit)).not.toContain("storagePath");

    await harness.close();
  });

  it("protects cleanup operations and returns a stable missing-task error", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const unauthenticated = await app.inject({
      method: "GET",
      url: "/v1/admin/sermons/audio-cleanups"
    });
    expect(unauthenticated.statusCode).toBe(401);

    const { accessToken } = await login(app);
    const viewerAccessToken = await createAdminSession(
      app,
      accessToken,
      "cleanup-viewer@mbc.local",
      "viewer"
    );
    const viewerList = await app.inject({
      method: "GET",
      url: "/v1/admin/sermons/audio-cleanups",
      headers: { authorization: `Bearer ${viewerAccessToken}` }
    });
    expect(viewerList.statusCode).toBe(200);

    const viewerRetry = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/audio-cleanups/00000000-0000-4000-8000-000000000000/retry",
      headers: { authorization: `Bearer ${viewerAccessToken}` }
    });
    expect(viewerRetry.statusCode).toBe(403);

    const missing = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/audio-cleanups/00000000-0000-4000-8000-000000000000/retry",
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error).toMatchObject({
      code: "sermon_audio_cleanup_not_found",
      category: "not_found",
      nextAction: "refresh"
    });

    await harness.close();
  });
});

async function uploadAudio(
  app: Awaited<ReturnType<typeof buildTestApp>>["app"],
  accessToken: string,
  sermon: ReturnType<typeof sermonSchema.parse>,
  fileName: string
) {
  const response = await app.inject({
    method: "POST",
    url: `/v1/admin/sermons/${sermon.id}/audio`,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "audio/mpeg",
      "x-file-name": encodeURIComponent(fileName),
      "x-sermon-revision": String(sermon.revision)
    },
    payload: Buffer.from(`audio-${fileName}`)
  });
  expect(response.statusCode).toBe(200);
  return expectResponseData(
    response,
    sermonSchema,
    `sermon audio upload ${fileName}`
  );
}

async function createAdminSession(
  app: Awaited<ReturnType<typeof buildTestApp>>["app"],
  ownerAccessToken: string,
  email: string,
  role: "viewer"
) {
  const createResponse = await app.inject({
    method: "POST",
    url: "/v1/admin/users",
    headers: { authorization: `Bearer ${ownerAccessToken}` },
    payload: {
      email,
      name: "Cleanup Viewer",
      role,
      password: "password123"
    }
  });
  expect(createResponse.statusCode).toBe(200);
  const loginResponse = await app.inject({
    method: "POST",
    url: "/v1/admin/auth/login",
    payload: { email, password: "password123" }
  });
  return expectResponseData(
    loginResponse,
    adminLoginResponseSchema,
    "cleanup viewer login"
  ).accessToken;
}
