import {
  adminNotificationDeliveryListResponseSchema,
  adminPrayerRequestListResponseSchema,
  adminPrayerRequestSchema,
  auditLogListResponseSchema,
  deletedResponseSchema,
  memberAuthMeResponseSchema,
  memberPushDeviceResponseSchema,
  prayerRequestListResponseSchema,
  prayerRequestSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("prayer routes", () => {
  it("creates generic member-only prayer update notifications on approval", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminAccessToken } = await login(app);
    const { accessToken: memberAccessToken } = await loginMember(app, {
      email: "prayer-notify-member@example.com",
      displayName: "Prayer Notify Member"
    });

    const settingsResponse = await app.inject({
      method: "PATCH",
      url: "/v1/member/preferences/notifications",
      headers: {
        authorization: `Bearer ${memberAccessToken}`
      },
      payload: {
        weeklyBulletin: true,
        sermonPublished: true,
        lifePostPublished: true,
        prayerUpdates: true
      }
    });
    expect(settingsResponse.statusCode).toBe(200);
    expectResponseData(
      settingsResponse,
      memberAuthMeResponseSchema,
      "member notification preferences"
    );

    const deviceResponse = await app.inject({
      method: "PUT",
      url: "/v1/member/devices/push-token",
      headers: {
        authorization: `Bearer ${memberAccessToken}`
      },
      payload: {
        installationId: "prayer-member-device",
        platform: "ios",
        provider: "fcm",
        pushToken: "token-prayer-member-abcdefghijklmnopqrstuvwxyz",
        permissionStatus: "authorized",
        locale: "en"
      }
    });
    expect(deviceResponse.statusCode).toBe(200);
    expectResponseData(
      deviceResponse,
      memberPushDeviceResponseSchema,
      "member prayer push device"
    );

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/prayer-requests",
      payload: {
        title: "Sensitive request",
        body: "Private health details should stay out of push payloads.",
        visibility: "members",
        submitterName: "Member"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const requestId = expectResponseData(
      createResponse,
      prayerRequestSchema,
      "prayer notification request create"
    ).id;

    const approveResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/prayer-requests/${requestId}/approve`,
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      },
      payload: {
        notifyApp: true
      }
    });
    expect(approveResponse.statusCode).toBe(200);
    expectResponseData(
      approveResponse,
      adminPrayerRequestSchema,
      "admin prayer notification approve"
    );

    const deliveriesResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/notifications/deliveries?type=prayer_update_published",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(deliveriesResponse.statusCode).toBe(200);
    const deliveries = expectResponseData(
      deliveriesResponse,
      adminNotificationDeliveryListResponseSchema,
      "admin prayer notification deliveries"
    );
    expect(deliveries.items[0]).toMatchObject({
      type: "prayer_update_published",
      audience: "members",
      preferenceKey: "prayerUpdates",
      payload: {
        title: "Prayer update",
        body: "A new prayer update is available.",
        route: "/life"
      }
    });
    expect(JSON.stringify(deliveries.items[0])).not.toContain(
      "Private health details"
    );

    await harness.close();
  });

  it("does not broadcast private prayer approvals to all members", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminAccessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/prayer-requests",
      payload: {
        title: "Private pastoral care",
        body: "This must remain limited to the submitter and pastoral team.",
        visibility: "private",
        submitterName: "Private Member"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const requestId = expectResponseData(
      createResponse,
      prayerRequestSchema,
      "private prayer request create"
    ).id;

    const approveResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/prayer-requests/${requestId}/approve`,
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      },
      payload: {
        notifyApp: true
      }
    });
    expect(approveResponse.statusCode).toBe(200);

    const deliveriesResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/notifications/deliveries?type=prayer_update_published",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(deliveriesResponse.statusCode).toBe(200);
    const deliveries = expectResponseData(
      deliveriesResponse,
      adminNotificationDeliveryListResponseSchema,
      "private prayer notification deliveries"
    );
    expect(deliveries.items).toEqual([]);

    const auditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?resourceType=prayer_request&resourceId=${requestId}&limit=20`,
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    const approvalAudit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "private prayer approval audit"
    ).items.find(
      (log: { action: string }) => log.action === "prayer_request.approve"
    );
    expect(approvalAudit?.afterJson).toMatchObject({
      notification: {
        requested: false,
        reason: "visibility_not_broadcastable",
        visibility: "private"
      }
    });

    await harness.close();
  });

  it("moderates privacy-aware prayer requests through admin API", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/prayer-requests",
      payload: {
        title: "Family care",
        body: "Please pray for family health.",
        visibility: "private",
        submitterName: "Member",
        submitterEmail: "member@mbc.local"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const created = expectResponseData(
      createResponse,
      prayerRequestSchema,
      "prayer request create"
    );
    expect(created.status).toBe("pending");
    expect(created.visibility).toBe("private");
    expect(created).not.toHaveProperty("submitterEmail");
    const requestId = created.id;

    const createAuditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?resourceType=prayer_request&resourceId=${requestId}&limit=20`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(createAuditResponse.statusCode).toBe(200);
    const createAudit = expectResponseData(
      createAuditResponse,
      auditLogListResponseSchema,
      "prayer request create audit"
    ).items.find(
      (log: { action: string }) => log.action === "prayer_request.create"
    );
    expect(createAudit?.afterJson).toMatchObject({
      hasSubmitterName: true,
      submitterNameLength: "Member".length,
      hasSubmitterEmail: true
    });
    expect(JSON.stringify(createAudit)).not.toContain("Member");
    expect(JSON.stringify(createAudit)).not.toContain("member@mbc.local");
    expect(JSON.stringify(createAudit)).not.toContain(
      "Please pray for family health."
    );

    const publicBefore = await app.inject({
      method: "GET",
      url: "/v1/prayer-requests?limit=50"
    });
    expect(publicBefore.statusCode).toBe(200);
    const publicBeforeList = expectResponseData(
      publicBefore,
      prayerRequestListResponseSchema,
      "public prayer list before approval"
    );
    expect(
      publicBeforeList.items.map((request: { id: string }) => request.id)
    ).not.toContain(requestId);

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/prayer-requests?status=pending",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const adminList = expectResponseData(
      listResponse,
      adminPrayerRequestListResponseSchema,
      "admin prayer pending list"
    );
    expect(
      adminList.items.map((request: { id: string }) => request.id)
    ).toContain(requestId);

    const groupBeforeApprovalResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/prayer-requests?visibility=group&groupId=friday-fellowship&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(groupBeforeApprovalResponse.statusCode).toBe(200);
    const groupBeforeApproval = expectResponseData(
      groupBeforeApprovalResponse,
      adminPrayerRequestListResponseSchema,
      "admin group prayer list before approval"
    );
    expect(
      groupBeforeApproval.items.map((request: { id: string }) => request.id)
    ).not.toContain(requestId);

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/prayer-requests/${requestId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        visibility: "group",
        groupId: "friday-fellowship",
        status: "approved",
        moderationNote: "Approved for small group sharing."
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    const updated = expectResponseData(
      updateResponse,
      adminPrayerRequestSchema,
      "admin prayer update"
    );
    expect(updated.status).toBe("approved");
    expect(updated.visibility).toBe("group");
    expect(updated.moderatedByAdminUserId).toBeDefined();
    const {
      accessToken: groupMemberAccessToken,
      memberId: groupMemberId
    } = await loginMember(app, {
      email: "group-prayer-member@example.com",
      displayName: "Group Prayer Member"
    });
    const groupMemberUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/members/${groupMemberId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        fellowshipGroupId: "friday-fellowship"
      }
    });
    expect(groupMemberUpdateResponse.statusCode).toBe(200);

    const groupAfterApprovalResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/prayer-requests?visibility=group&groupId=friday-fellowship&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(groupAfterApprovalResponse.statusCode).toBe(200);
    const groupAfterApproval = expectResponseData(
      groupAfterApprovalResponse,
      adminPrayerRequestListResponseSchema,
      "admin group prayer list after approval"
    );
    expect(
      groupAfterApproval.items.map((request: { id: string }) => request.id)
    ).toContain(requestId);

    const publicAfter = await app.inject({
      method: "GET",
      url: "/v1/prayer-requests?visibility=group&groupId=friday-fellowship&limit=50"
    });
    expect(publicAfter.statusCode).toBe(200);
    const publicAfterList = expectResponseData(
      publicAfter,
      prayerRequestListResponseSchema,
      "public group prayer list after approval"
    );
    expect(
      publicAfterList.items.map((request: { id: string }) => request.id)
    ).not.toContain(requestId);

    const memberSharedAfter = await app.inject({
      method: "GET",
      url: "/v1/member/prayer-requests/shared?visibility=group&groupId=client-supplied-group&limit=50",
      headers: {
        authorization: `Bearer ${groupMemberAccessToken}`
      }
    });
    expect(memberSharedAfter.statusCode).toBe(200);
    const memberSharedAfterList = expectResponseData(
      memberSharedAfter,
      prayerRequestListResponseSchema,
      "member shared group prayer list"
    );
    expect(
      memberSharedAfterList.items.map((request: { id: string }) => request.id)
    ).toContain(requestId);

    const { accessToken: noGroupMemberAccessToken } = await loginMember(app, {
      email: "no-group-prayer-member@example.com",
      displayName: "No Group Prayer Member"
    });
    const noGroupSharedResponse = await app.inject({
      method: "GET",
      url: "/v1/member/prayer-requests/shared?visibility=group&groupId=friday-fellowship&limit=50",
      headers: {
        authorization: `Bearer ${noGroupMemberAccessToken}`
      }
    });
    expect(noGroupSharedResponse.statusCode).toBe(200);
    const noGroupShared = expectResponseData(
      noGroupSharedResponse,
      prayerRequestListResponseSchema,
      "member shared no-group prayer list"
    );
    expect(
      noGroupShared.items.map((request: { id: string }) => request.id)
    ).not.toContain(requestId);

    const hideResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/prayer-requests/${requestId}/hide`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        moderationNote: "Do not share."
      }
    });
    expect(hideResponse.statusCode).toBe(200);
    const hidden = expectResponseData(
      hideResponse,
      adminPrayerRequestSchema,
      "admin prayer hide"
    );
    expect(hidden.status).toBe("hidden");

    const auditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?resourceType=prayer_request&resourceId=${requestId}&limit=20`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const hideAuditLog = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "prayer request audit"
    ).items.find(
      (log: { action: string }) => log.action === "prayer_request.hide"
    );
    expect(hideAuditLog).toBeDefined();
    if (!hideAuditLog) {
      throw new Error("expected prayer request hide audit log");
    }
    expect(hideAuditLog.afterJson).toMatchObject({
      hasModerationNote: true,
      moderationNoteLength: "Do not share.".length
    });
    expect(JSON.stringify(hideAuditLog)).not.toContain("Do not share.");

    const publicHidden = await app.inject({
      method: "GET",
      url: "/v1/prayer-requests?visibility=group&groupId=friday-fellowship&limit=50"
    });
    expect(publicHidden.statusCode).toBe(200);
    const publicHiddenList = expectResponseData(
      publicHidden,
      prayerRequestListResponseSchema,
      "public hidden prayer list"
    );
    expect(
      publicHiddenList.items.map((request: { id: string }) => request.id)
    ).not.toContain(requestId);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/v1/admin/prayer-requests/${requestId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(deleteResponse.statusCode).toBe(200);
    const deleted = expectResponseData(
      deleteResponse,
      deletedResponseSchema,
      "prayer request delete"
    );
    expect(deleted.deleted).toBe(true);

    const repeatDeleteResponse = await app.inject({
      method: "DELETE",
      url: `/v1/admin/prayer-requests/${requestId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(repeatDeleteResponse.statusCode).toBe(404);
    expect(repeatDeleteResponse.json().error).toMatchObject({
      code: "prayer_request_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        requestId
      }
    });
    await harness.close();
  });

  it("keeps prayer submission guest-friendly while linking signed-in members", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminAccessToken } = await login(app);
    const { accessToken: memberAccessToken, memberId } = await loginMember(app, {
      email: "prayer-member@example.com",
      displayName: "Prayer Member"
    });

    const guestResponse = await app.inject({
      method: "POST",
      url: "/v1/prayer-requests",
      payload: {
        title: "Guest request",
        body: "Please pray for a guest family.",
        visibility: "private",
        submitterName: "Guest"
      }
    });
    expect(guestResponse.statusCode).toBe(200);
    const guestRequestId = expectResponseData(
      guestResponse,
      prayerRequestSchema,
      "guest prayer request"
    ).id;

    const memberResponse = await app.inject({
      method: "POST",
      url: "/v1/prayer-requests",
      headers: {
        authorization: `Bearer ${memberAccessToken}`
      },
      payload: {
        title: "Member request",
        body: "Please pray for a member need.",
        visibility: "private",
        submitterName: "Prayer Member"
      }
    });
    expect(memberResponse.statusCode).toBe(200);
    const memberPrayer = expectResponseData(
      memberResponse,
      prayerRequestSchema,
      "member prayer request"
    );
    expect(memberPrayer.status).toBe("pending");
    const memberRequestId = memberPrayer.id;

    const memberListResponse = await app.inject({
      method: "GET",
      url: "/v1/member/prayer-requests?limit=50",
      headers: {
        authorization: `Bearer ${memberAccessToken}`
      }
    });
    expect(memberListResponse.statusCode).toBe(200);
    const memberRequestIds = expectResponseData(
      memberListResponse,
      prayerRequestListResponseSchema,
      "member prayer list"
    ).items.map((request: { id: string }) => request.id);
    expect(memberRequestIds).toContain(memberRequestId);
    expect(memberRequestIds).not.toContain(guestRequestId);

    const adminListResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/prayer-requests?query=Member%20request&limit=50",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(adminListResponse.statusCode).toBe(200);
    const adminPrayerRequest = expectResponseData(
      adminListResponse,
      adminPrayerRequestListResponseSchema,
      "admin member prayer list"
    ).items.find((request: { id: string }) => request.id === memberRequestId);
    expect(adminPrayerRequest).toBeDefined();
    if (!adminPrayerRequest) {
      throw new Error("expected admin prayer request");
    }
    expect(adminPrayerRequest.authorUserId).toBe(memberId);

    const listAuditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=prayer_request&resourceId=list&action=prayer_request.list&limit=20",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(listAuditResponse.statusCode).toBe(200);
    const listAudit = expectResponseData(
      listAuditResponse,
      auditLogListResponseSchema,
      "prayer request list audit"
    ).items.find(
      (log: { afterJson: unknown }) =>
        JSON.stringify(log.afterJson).includes('"hasQuery":true')
    );
    expect(listAudit?.afterJson).toMatchObject({
      hasQuery: true,
      queryLength: "Member request".length
    });
    expect(JSON.stringify(listAudit)).not.toContain("Member request");

    const approveMembersResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/prayer-requests/${memberRequestId}`,
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      },
      payload: {
        visibility: "members",
        status: "approved",
        moderationNote: "Approved for signed-in members."
      }
    });
    expect(approveMembersResponse.statusCode).toBe(200);
    expectResponseData(
      approveMembersResponse,
      adminPrayerRequestSchema,
      "admin members prayer approve"
    );

    const guestSharedResponse = await app.inject({
      method: "GET",
      url: "/v1/prayer-requests?visibility=members&limit=50"
    });
    expect(guestSharedResponse.statusCode).toBe(200);
    const guestShared = expectResponseData(
      guestSharedResponse,
      prayerRequestListResponseSchema,
      "guest members prayer list"
    );
    expect(
      guestShared.items.map((request: { id: string }) => request.id)
    ).not.toContain(memberRequestId);

    const memberSharedResponse = await app.inject({
      method: "GET",
      url: "/v1/member/prayer-requests/shared?visibility=members&limit=50",
      headers: {
        authorization: `Bearer ${memberAccessToken}`
      }
    });
    expect(memberSharedResponse.statusCode).toBe(200);
    const memberShared = expectResponseData(
      memberSharedResponse,
      prayerRequestListResponseSchema,
      "member shared prayer list"
    );
    expect(
      memberShared.items.map((request: { id: string }) => request.id)
    ).toContain(memberRequestId);

    const unauthenticatedMineResponse = await app.inject({
      method: "GET",
      url: "/v1/member/prayer-requests"
    });
    expect(unauthenticatedMineResponse.statusCode).toBe(401);
    await harness.close();
  });
});
