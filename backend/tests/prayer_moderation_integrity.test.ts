import {
  adminPrayerRequestSchema,
  prayerRequestSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("prayer moderation integrity", () => {
  it("approves the edited scope atomically and records every moderation change", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const requestId = await createPrivatePrayer(app);

    const approveResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/prayer-requests/${requestId}/approve`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        visibility: "members",
        moderationNote: "Approved for members.",
        notifyApp: false
      }
    });
    expect(approveResponse.statusCode).toBe(200);
    const approved = expectResponseData(
      approveResponse,
      adminPrayerRequestSchema,
      "atomic prayer approval"
    );
    expect(approved).toMatchObject({
      id: requestId,
      status: "approved",
      visibility: "members",
      groupId: null,
      moderationNote: "Approved for members."
    });
    expect(approved.moderatedAt).not.toBeNull();
    expect(approved.moderatedByAdminUserId).not.toBeNull();

    const visibilityResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/prayer-requests/${requestId}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { visibility: "public" }
    });
    expect(visibilityResponse.statusCode).toBe(200);
    const visibilityUpdated = expectResponseData(
      visibilityResponse,
      adminPrayerRequestSchema,
      "prayer visibility moderation"
    );
    expect(visibilityUpdated.visibility).toBe("public");
    expect(visibilityUpdated.groupId).toBeNull();
    expect(visibilityUpdated.moderatedAt).not.toBeNull();
    expect(visibilityUpdated.moderatedByAdminUserId).not.toBeNull();

    const emptyUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/prayer-requests/${requestId}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {}
    });
    expect(emptyUpdateResponse.statusCode).toBe(400);

    const invalidGroupApprovalResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/prayer-requests/${requestId}/approve`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { visibility: "group" }
    });
    expect(invalidGroupApprovalResponse.statusCode).toBe(400);

    await harness.close();
  });
});

async function createPrivatePrayer(
  app: Awaited<ReturnType<typeof buildTestApp>>["app"]
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/prayer-requests",
    payload: {
      title: "Family care",
      body: "Please pray for a private family need.",
      visibility: "private",
      submitterName: "Member"
    }
  });
  expect(response.statusCode).toBe(200);
  return expectResponseData(
    response,
    prayerRequestSchema,
    "private prayer create"
  ).id;
}
