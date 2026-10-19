import {
  mediaCleanupListResponseSchema,
  mediaCleanupTaskSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("media cleanup routes", () => {
  it("protects task evidence and returns a stable missing-task error", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const unauthenticated = await app.inject({
      method: "GET",
      url: "/v1/admin/media/cleanup-tasks"
    });
    expect(unauthenticated.statusCode).toBe(401);

    const { accessToken } = await login(app);
    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/media/cleanup-tasks",
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expectResponseData(
      listResponse,
      mediaCleanupListResponseSchema,
      "media cleanup list"
    );
    expect(JSON.stringify(listResponse.json())).not.toContain("storageKey");

    const missingId = "00000000-0000-4000-8000-000000000000";
    const retryResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/media/cleanup-tasks/${missingId}/retry`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expect(retryResponse.statusCode).toBe(404);
    expect(retryResponse.json().error).toMatchObject({
      code: "media_cleanup_not_found",
      nextAction: "refresh"
    });

    await harness.close();
  });

  it("parses the cleanup task contract without an internal key", () => {
    const task = mediaCleanupTaskSchema.parse({
      id: "00000000-0000-4000-8000-000000000001",
      mediaAssetId: "00000000-0000-4000-8000-000000000002",
      reason: "unbound_upload",
      status: "failed",
      attempts: 1,
      retryable: true,
      lastError: "object_delete_failed",
      completedAt: null,
      createdAt: "2026-10-18T00:00:00.000Z",
      updatedAt: "2026-10-18T00:00:00.000Z"
    });
    expect(task).not.toHaveProperty("storageKey");
  });
});
