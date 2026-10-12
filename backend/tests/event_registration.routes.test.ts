import {
  auditLogListResponseSchema,
  eventCheckInCodeCheckInResponseSchema,
  eventCheckInCodeSchema,
  eventRegistrationExportResponseSchema,
  eventRegistrationListResponseSchema,
  eventRegistrationSchema,
  lifePostSchema,
  publicLifePostSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { InMemoryLifePostRepository } from "../src/modules/life/in-memory-life-post.repository.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

async function waitFor(predicate: () => boolean): Promise<void> {
  while (!predicate()) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

describe("event registration routes", () => {
  it("serializes concurrent capacity decisions for the same event", async () => {
    const repository = new InMemoryLifePostRepository();
    const entered: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstRelease = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = repository.withEventRegistrationLock(
      "event-capacity",
      async () => {
        entered.push("first");
        await firstRelease;
        entered.push("first-complete");
      }
    );
    await waitFor(() => entered.includes("first"));

    const second = repository.withEventRegistrationLock(
      "event-capacity",
      async () => {
        entered.push("second");
      }
    );
    await Promise.resolve();
    expect(entered).toEqual(["first"]);

    releaseFirst!();
    await Promise.all([first, second]);
    expect(entered).toEqual(["first", "first-complete", "second"]);
  });

  it("supports event registration from member app and admin exports", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const now = Date.now();
    const startsAt = new Date(now - 15 * 60 * 1000).toISOString();
    const endsAt = new Date(now + 60 * 60 * 1000).toISOString();
    const registrationDeadline = new Date(
      now + 2 * 60 * 60 * 1000
    ).toISOString();
    const member = await loginMember(app, {
      email: "event-member@example.com",
      displayName: "活动会友"
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        type: "fellowship",
        title: "Church Picnic",
        body: "Bring lunch and invite a friend.",
        meta: "Saturday 11 AM",
        iconName: "event",
        startsAt,
        endsAt,
        visibility: "private",
        registrationEnabled: true,
        registrationCapacity: 3,
        registrationDeadline,
        registrationMaxPartySize: 2
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const createdPost = expectResponseData(
      createResponse,
      lifePostSchema,
      "admin event life post create"
    );
    expect(createdPost.registrationEnabled).toBe(true);
    const postId = createdPost.id;

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(createdPost.revision)
      },
      payload: {
        visibility: "members"
      }
    });
    expect(publishResponse.statusCode).toBe(200);
    expectResponseData(publishResponse, lifePostSchema, "admin event publish");

    const detailBefore = await app.inject({
      method: "GET",
      url: `/v1/member/life/posts/${postId}`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(detailBefore.statusCode).toBe(200);
    const before = expectResponseData(
      detailBefore,
      publicLifePostSchema,
      "member event detail before registration"
    );
    expect(before.registrationSummary).toMatchObject({
      enabled: true,
      capacity: 3,
      registeredCount: 0,
      remainingCount: 3
    });

    const registerResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/register`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        partySize: 2,
        note: "Can help set up chairs."
      }
    });
    expect(registerResponse.statusCode).toBe(200);
    const registered = expectResponseData(
      registerResponse,
      publicLifePostSchema,
      "member event register"
    );
    expect(registered.registrationSummary).toMatchObject({
      registeredCount: 2,
      remainingCount: 1,
      myRegistrationStatus: "confirmed"
    });

    const duplicateResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/register`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        partySize: 1
      }
    });
    expect(duplicateResponse.statusCode).toBe(200);
    const duplicate = expectResponseData(
      duplicateResponse,
      publicLifePostSchema,
      "member event duplicate register"
    );
    expect(duplicate.registrationSummary).toMatchObject({
      registeredCount: 2,
      remainingCount: 1,
      myRegistrationStatus: "confirmed",
      myPartySize: 2
    });

    const updateRegistrationResponse = await app.inject({
      method: "PATCH",
      url: `/v1/member/life/posts/${postId}/registration`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        partySize: 1,
        note: "Updated: no setup help needed."
      }
    });
    expect(updateRegistrationResponse.statusCode).toBe(200);
    const updatedRegistration = expectResponseData(
      updateRegistrationResponse,
      publicLifePostSchema,
      "member event registration update"
    );
    expect(updatedRegistration.registrationSummary).toMatchObject({
      registeredCount: 1,
      remainingCount: 2,
      myRegistrationStatus: "confirmed",
      myPartySize: 1,
      myNote: "Updated: no setup help needed."
    });

    const registrationsResponse = await app.inject({
      method: "GET",
      url:
        `/v1/admin/life-posts/${postId}/registrations` +
        "?query=event-member%40example.com&limit=1&offset=0",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(registrationsResponse.statusCode).toBe(200);
    const registrations = expectResponseData(
      registrationsResponse,
      eventRegistrationListResponseSchema,
      "admin event registrations"
    );
    expect(registrations.items[0]).toMatchObject({
      attendeeName: "活动会友",
      attendeeEmail: "event-member@example.com",
      partySize: 1,
      status: "confirmed",
      note: "Updated: no setup help needed."
    });
    expect(registrations).toMatchObject({
      total: 1,
      limit: 1,
      offset: 0
    });
    const listAuditResponse = await app.inject({
      method: "GET",
      url:
        "/v1/admin/audit-logs?action=life_post.registrations.list" +
        `&resourceType=life_post&resourceId=${postId}&limit=20`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(listAuditResponse.statusCode).toBe(200);
    const listAudit = expectResponseData(
      listAuditResponse,
      auditLogListResponseSchema,
      "admin event registration list audit"
    );
    expect(listAudit.items[0]?.afterJson).toMatchObject({
      count: 1,
      total: 1,
      limit: 1,
      offset: 0,
      queryApplied: true
    });
    expect(listAudit.items[0]?.afterJson).not.toHaveProperty("query");
    const registrationId = registrations.items[0]?.id;
    expect(registrationId).toEqual(expect.any(String));
    if (!registrationId) {
      throw new Error("expected event registration id");
    }

    const viewerCreateResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/users",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        email: "event-viewer@example.com",
        name: "Event Viewer",
        role: "viewer",
        password: "viewerpass123"
      }
    });
    expect(viewerCreateResponse.statusCode).toBe(200);
    const viewerLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: "event-viewer@example.com",
        password: "viewerpass123"
      }
    });
    expect(viewerLoginResponse.statusCode).toBe(200);
    const viewerAccessToken = viewerLoginResponse.json().data.accessToken;

    const viewerRegistrationsResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/life-posts/${postId}/registrations`,
      headers: {
        authorization: `Bearer ${viewerAccessToken}`
      }
    });
    expect(viewerRegistrationsResponse.statusCode).toBe(403);

    const viewerExportResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/life-posts/${postId}/registrations/export`,
      headers: {
        authorization: `Bearer ${viewerAccessToken}`
      }
    });
    expect(viewerExportResponse.statusCode).toBe(403);

    const adminEditRegistrationResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${postId}/registrations/${registrationId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        partySize: 2,
        note: "Admin corrected party size."
      }
    });
    expect(adminEditRegistrationResponse.statusCode).toBe(200);
    const adminEditedRegistration = expectResponseData(
      adminEditRegistrationResponse,
      eventRegistrationSchema,
      "admin event registration edit"
    );
    expect(adminEditedRegistration).toMatchObject({
      partySize: 2,
      note: "Admin corrected party size."
    });

    const checkInResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${postId}/registrations/${registrationId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "checked_in"
      }
    });
    expect(checkInResponse.statusCode).toBe(200);
    const checkedIn = expectResponseData(
      checkInResponse,
      eventRegistrationSchema,
      "admin event registration check in"
    );
    expect(checkedIn).toMatchObject({
      status: "checked_in",
      checkInMethod: "admin_manual",
      checkedInByAdminUserId: expect.any(String),
      checkedInAt: expect.any(String)
    });

    const detailAfterCheckIn = await app.inject({
      method: "GET",
      url: `/v1/member/life/posts/${postId}`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(detailAfterCheckIn.statusCode).toBe(200);
    const afterCheckIn = expectResponseData(
      detailAfterCheckIn,
      publicLifePostSchema,
      "member event detail after check in"
    );
    expect(afterCheckIn.registrationSummary).toMatchObject({
      registeredCount: 2,
      remainingCount: 1,
      myRegistrationStatus: "checked_in",
      myCheckInMethod: "admin_manual",
      myCheckedInAt: expect.any(String)
    });

    const updateAfterCheckInResponse = await app.inject({
      method: "PATCH",
      url: `/v1/member/life/posts/${postId}/registration`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        partySize: 1,
        note: "Late edit after check-in."
      }
    });
    expect(updateAfterCheckInResponse.statusCode).toBe(409);
    expect(updateAfterCheckInResponse.json().error).toMatchObject({
      code: "check_in_not_allowed",
      category: "state_conflict",
      sourceLayer: "domain",
      recoverable: true,
      retryable: false,
      nextAction: "refresh"
    });

    const exportResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/life-posts/${postId}/registrations/export`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(exportResponse.statusCode).toBe(200);
    const exportData = expectResponseData(
      exportResponse,
      eventRegistrationExportResponseSchema,
      "admin event registration export"
    );
    expect(exportData.contentType).toBe("text/csv");
    expect(exportData.csv).toContain("event-member");
    expect(exportData.csv).toContain("event-member@example.com");
    expect(exportData.csv).toContain("admin_manual");
    expect(Buffer.byteLength(exportData.csv, "utf8")).toBeGreaterThan(
      exportData.csv.length
    );

    const exportAuditResponse = await app.inject({
      method: "GET",
      url:
        "/v1/admin/audit-logs?action=life_post.registrations.export" +
        `&resourceType=life_post&resourceId=${postId}&limit=20`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(exportAuditResponse.statusCode).toBe(200);
    const exportAudit = expectResponseData(
      exportAuditResponse,
      auditLogListResponseSchema,
      "admin event registration export audit"
    );
    expect(exportAudit.items[0]?.afterJson).toMatchObject({
      byteLength: Buffer.byteLength(exportData.csv, "utf8")
    });

    const cancelResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/registration/cancel`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(cancelResponse.statusCode).toBe(409);
    expect(cancelResponse.json().error).toMatchObject({
      code: "check_in_not_allowed",
      category: "state_conflict",
      sourceLayer: "domain",
      recoverable: true,
      retryable: false,
      nextAction: "refresh"
    });

    const adminCancelCheckedInResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${postId}/registrations/${registrationId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "cancelled"
      }
    });
    expect(adminCancelCheckedInResponse.statusCode).toBe(200);

    const reRegisterResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/register`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        partySize: 1,
        note: "Signing up again after cancelling."
      }
    });
    expect(reRegisterResponse.statusCode).toBe(200);
    const reRegistered = expectResponseData(
      reRegisterResponse,
      publicLifePostSchema,
      "member event re-register"
    );
    expect(reRegistered.registrationSummary).toMatchObject({
      registeredCount: 1,
      remainingCount: 2,
      myRegistrationStatus: "confirmed",
      myPartySize: 1
    });

    const confirmedCancelResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/registration/cancel`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(confirmedCancelResponse.statusCode).toBe(200);
    const confirmedCancelled = expectResponseData(
      confirmedCancelResponse,
      publicLifePostSchema,
      "member event confirmed cancel"
    );
    expect(confirmedCancelled.registrationSummary).toMatchObject({
      registeredCount: 0,
      remainingCount: 3
    });
    expect(
      confirmedCancelled.registrationSummary.myRegistrationStatus
    ).toBeNull();

    const qrRegisterResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/register`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        partySize: 1,
        note: "Signing up again for QR check-in."
      }
    });
    expect(qrRegisterResponse.statusCode).toBe(200);
    expectResponseData(
      qrRegisterResponse,
      publicLifePostSchema,
      "member event QR register"
    );

    const checkInCodeResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/check-in-code`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        rotate: false
      }
    });
    expect(checkInCodeResponse.statusCode).toBe(200);
    const checkInCode = expectResponseData(
      checkInCodeResponse,
      eventCheckInCodeSchema,
      "admin event check-in code"
    );
    expect(checkInCode.lifePostId).toBe(postId);
    expect(checkInCode.qrPayload).toContain("mbcg:event-check-in:");
    expect(checkInCode.shortCode).toContain("MBCG-");

    const memberCheckInResponse = await app.inject({
      method: "POST",
      url: "/v1/member/life/check-in-code",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        code: checkInCode.qrPayload
      }
    });
    expect(memberCheckInResponse.statusCode).toBe(200);
    const memberCheckIn = expectResponseData(
      memberCheckInResponse,
      eventCheckInCodeCheckInResponseSchema,
      "member event QR check in"
    );
    expect(memberCheckIn.post.registrationSummary).toMatchObject({
      registeredCount: 1,
      remainingCount: 2,
      myRegistrationStatus: "checked_in",
      myCheckInMethod: "onsite_qr",
      myCheckedInAt: expect.any(String)
    });
    expect(memberCheckIn.registration).toMatchObject({
      status: "checked_in",
      checkInMethod: "onsite_qr"
    });
    const qrRegistrationId = memberCheckIn.registration.id;

    const repeatQrCheckInResponse = await app.inject({
      method: "POST",
      url: "/v1/member/life/check-in-code",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        code: checkInCode.shortCode
      }
    });
    expect(repeatQrCheckInResponse.statusCode).toBe(200);
    const repeatQrCheckIn = expectResponseData(
      repeatQrCheckInResponse,
      eventCheckInCodeCheckInResponseSchema,
      "member event repeat QR check in"
    );
    expect(repeatQrCheckIn.registration).toMatchObject({
      status: "checked_in",
      checkInMethod: "onsite_qr"
    });

    const secondCancelResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/registration/cancel`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(secondCancelResponse.statusCode).toBe(409);
    expect(secondCancelResponse.json().error).toMatchObject({
      code: "check_in_not_allowed",
      category: "state_conflict",
      sourceLayer: "domain",
      recoverable: true,
      retryable: false,
      nextAction: "refresh"
    });

    const adminCancelQrCheckedInResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${postId}/registrations/${qrRegistrationId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "cancelled"
      }
    });
    expect(adminCancelQrCheckedInResponse.statusCode).toBe(200);

    const adminCreateRegistrationResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/registrations`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        attendeeName: "Phone Guest",
        attendeeEmail: "phone-guest@example.com",
        partySize: 1,
        note: "Called the church office."
      }
    });
    expect(adminCreateRegistrationResponse.statusCode).toBe(200);
    const adminCreatedRegistration = expectResponseData(
      adminCreateRegistrationResponse,
      eventRegistrationSchema,
      "admin event registration create"
    );
    expect(adminCreatedRegistration).toMatchObject({
      userId: null,
      attendeeName: "Phone Guest",
      attendeeEmail: "phone-guest@example.com",
      partySize: 1,
      status: "confirmed",
      note: "Called the church office."
    });

    const secondMember = await loginMember(app, {
      email: "event-second@example.com",
      displayName: "Event Second"
    });
    const fillCapacityResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/register`,
      headers: {
        authorization: `Bearer ${secondMember.accessToken}`
      },
      payload: {
        partySize: 1
      }
    });
    expect(fillCapacityResponse.statusCode).toBe(200);
    expectResponseData(
      fillCapacityResponse,
      publicLifePostSchema,
      "member event fill capacity"
    );
    const thirdMember = await loginMember(app, {
      email: "event-third@example.com",
      displayName: "Event Third"
    });
    const fillRemainingCapacityResponse = await app.inject({
      method: "POST",
      url: `/v1/member/life/posts/${postId}/register`,
      headers: {
        authorization: `Bearer ${thirdMember.accessToken}`
      },
      payload: {
        partySize: 1
      }
    });
    expect(fillRemainingCapacityResponse.statusCode).toBe(200);
    expectResponseData(
      fillRemainingCapacityResponse,
      publicLifePostSchema,
      "member event fill remaining capacity"
    );

    const restoreCancelledResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/life-posts/${postId}/registrations/${registrationId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "confirmed"
      }
    });
    expect(restoreCancelledResponse.statusCode).toBe(409);
    expect(restoreCancelledResponse.json().error).toMatchObject({
      code: "event_capacity_full",
      category: "state_conflict",
      sourceLayer: "domain",
      recoverable: true,
      retryable: false,
      nextAction: "refresh"
    });

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=event_registration&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "event registration audit"
    );
    expect(audit.items.map((log) => log.action)).toEqual(
      expect.arrayContaining([
        "life_post.registration.member_register",
        "life_post.registration.member_update",
        "life_post.registration.qr_check_in",
        "life_post.registration.member_cancel",
        "life_post.registration.create",
        "life_post.registration.update"
      ])
    );

    await harness.close();
  });
});
