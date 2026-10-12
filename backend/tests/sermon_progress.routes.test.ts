import { sermonProgressSchema, sermonSchema } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import {
  buildTestApp,
  login,
  loginMember
} from "./route_test_harness.js";

describe("sermon playback progress routes", () => {
  it("persists isolated external and member playback progress", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const sermonId = "sermon-romans-hope";

    const missingIdentity = await app.inject({
      method: "POST",
      url: `/v1/sermons/${sermonId}/progress`,
      payload: { positionSeconds: 60, completed: false }
    });
    expect(missingIdentity.statusCode).toBe(400);
    expect(missingIdentity.json().error).toMatchObject({
      code: "sermon_progress_identity_required",
      nextAction: "provide_external_user_id"
    });

    const externalId = "ext_sermon_progress_guest_001";
    const externalSave = await app.inject({
      method: "POST",
      url: `/v1/sermons/${sermonId}/progress`,
      headers: { "x-external-user-id": externalId },
      payload: { positionSeconds: 600, completed: false }
    });
    expect(externalSave.statusCode).toBe(200);
    expect(
      expectResponseData(
        externalSave,
        sermonProgressSchema,
        "external sermon progress save"
      )
    ).toMatchObject({
      sermonId,
      positionSeconds: 600,
      completed: false,
      completedAt: null
    });

    const externalGet = await app.inject({
      method: "GET",
      url: `/v1/sermons/${sermonId}/progress`,
      headers: { "x-external-user-id": externalId }
    });
    expect(externalGet.statusCode).toBe(200);
    expect(
      expectResponseData(
        externalGet,
        sermonProgressSchema,
        "external sermon progress get"
      ).positionSeconds
    ).toBe(600);

    const isolatedGet = await app.inject({
      method: "GET",
      url: `/v1/sermons/${sermonId}/progress`,
      headers: { "x-external-user-id": "ext_sermon_progress_guest_002" }
    });
    expect(isolatedGet.statusCode).toBe(200);
    expectResponseData(
      isolatedGet,
      sermonProgressSchema.nullable(),
      "isolated external sermon progress"
    );
    expect(isolatedGet.json().data).toBeNull();

    const member = await loginMember(app, {
      email: "sermon-progress-member@mbc.local",
      displayName: "Sermon Progress Member"
    });
    const memberSave = await app.inject({
      method: "POST",
      url: `/v1/sermons/${sermonId}/progress`,
      headers: {
        authorization: `Bearer ${member.accessToken}`,
        "x-external-user-id": "ext_member_header_must_not_own_progress"
      },
      payload: { positionSeconds: 4000, completed: false }
    });
    expect(memberSave.statusCode).toBe(200);
    expect(
      expectResponseData(
        memberSave,
        sermonProgressSchema,
        "member sermon progress save"
      )
    ).toMatchObject({
      sermonId,
      positionSeconds: 2380,
      completed: true
    });

    const memberGet = await app.inject({
      method: "GET",
      url: `/v1/sermons/${sermonId}/progress`,
      headers: { authorization: `Bearer ${member.accessToken}` }
    });
    expect(memberGet.statusCode).toBe(200);
    expect(
      expectResponseData(
        memberGet,
        sermonProgressSchema,
        "member sermon progress get"
      ).completedAt
    ).toEqual(expect.any(String));

    const spoofedExternalGet = await app.inject({
      method: "GET",
      url: `/v1/sermons/${sermonId}/progress`,
      headers: {
        "x-external-user-id": "ext_member_header_must_not_own_progress"
      }
    });
    expect(spoofedExternalGet.json().data).toBeNull();

    await harness.close();
  });

  it("rejects progress for unpublished sermons", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const draftResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/sermons/local-drafts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        title: "Private Draft",
        speaker: "Pastor",
        sermonDate: "2026-07-12"
      }
    });
    const draft = expectResponseData(
      draftResponse,
      sermonSchema,
      "draft sermon for progress"
    );

    const response = await app.inject({
      method: "POST",
      url: `/v1/sermons/${draft.id}/progress`,
      headers: { "x-external-user-id": "ext_private_sermon_progress" },
      payload: { positionSeconds: 60, completed: false }
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error).toMatchObject({
      code: "sermon_not_found",
      evidence: { sermonId: draft.id }
    });

    await harness.close();
  });
});
