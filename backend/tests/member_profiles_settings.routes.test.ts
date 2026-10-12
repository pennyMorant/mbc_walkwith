import {
  appSettingListResponseSchema,
  appSettingSchema,
  auditLogListResponseSchema,
  memberAuthMeResponseSchema,
  memberAuthLoginResponseSchema,
  memberAuthRequestCodeResponseSchema,
  memberListResponseSchema,
  memberAuthRegisterResponseSchema,
  memberAuthSessionSchema,
  memberAuthVerifyCodeResponseSchema,
  memberProfileSchema,
  memberRegistrationSettingsSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("member profile and settings routes", () => {
  it("manages member profiles through admin API", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/members",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        email: "member-new@example.com",
        displayName: "New Member",
        phone: "+1 555 0199",
        address: "123 Church Way",
        faithStartYear: 2010,
        baptizedYear: 2012,
        joinedChurchAt: "2021-06-20",
        emergencyContactName: "Emergency Friend",
        emergencyContactPhone: "+1 555 0123",
        status: "active",
        roles: ["member", "leader"],
        appLocale: "zh-Hans",
        fellowshipGroupId: "new-group",
        notificationSettings: {
          weeklyBulletin: true,
          sermonPublished: true,
          lifePostPublished: true,
          prayerUpdates: true
        }
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const createdMember = expectResponseData(
      createResponse,
      memberProfileSchema,
      "admin member create"
    );
    expect(createdMember.email).toBe("member-new@example.com");
    expect(createdMember.address).toBe("123 Church Way");
    expect(createdMember.faithStartYear).toBe(2010);
    expect(createdMember.joinedChurchAt).toBe("2021-06-20");
    expect(createdMember.roles).toEqual(["member", "leader"]);
    expect(createdMember.appLocale).toBe("zh-Hans");
    const memberId = createdMember.id;

    const passwordlessLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/login",
      payload: {
        email: "member-new@example.com",
        password: "MemberPass123!"
      }
    });
    const unknownLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/login",
      payload: {
        email: "unknown-member@example.com",
        password: "MemberPass123!"
      }
    });
    expect(passwordlessLoginResponse.statusCode).toBe(401);
    expect(unknownLoginResponse.statusCode).toBe(401);
    expect(passwordlessLoginResponse.json().error).toMatchObject({
      code: "member_credentials_invalid",
      evidence: {}
    });
    expect(unknownLoginResponse.json().error).toMatchObject({
      code: "member_credentials_invalid",
      evidence: {}
    });

    const duplicateCreateResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/members",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        email: "member-new@example.com",
        displayName: "Duplicate Member",
        roles: ["member"],
        status: "active"
      }
    });
    expect(duplicateCreateResponse.statusCode).toBe(409);
    expect(duplicateCreateResponse.json().error).toMatchObject({
      code: "member_email_conflict",
      category: "state_conflict",
      sourceLayer: "feature",
      nextAction: "review_request",
      evidence: {
        email: "member-new@example.com"
      }
    });

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/members?query=New%20Member&fellowshipGroupId=new-group",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const members = expectResponseData(
      listResponse,
      memberListResponseSchema,
      "admin member list"
    );
    expect(
      members.items.map((member: { id: string }) => member.id)
    ).toContain(memberId);
    const listedMember = members.items.find((member) => member.id === memberId);
    expect(listedMember).toBeDefined();
    expect(listedMember).not.toHaveProperty("phone");
    expect(listedMember).not.toHaveProperty("address");
    expect(listedMember).not.toHaveProperty("emergencyContactName");
    expect(listedMember).not.toHaveProperty("notificationSettings");

    const detailResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/members/${memberId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(detailResponse.statusCode).toBe(200);
    const detail = expectResponseData(
      detailResponse,
      memberProfileSchema,
      "admin member detail"
    );
    expect(detail.address).toBe("123 Church Way");
    expect(detail.emergencyContactName).toBe("Emergency Friend");

    const invalidMemberIdResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/members/not-a-uuid",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(invalidMemberIdResponse.statusCode).toBe(400);

    const duplicateUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/members/${memberId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        email: "grace@example.com"
      }
    });
    expect(duplicateUpdateResponse.statusCode).toBe(409);
    expect(duplicateUpdateResponse.json().error).toMatchObject({
      code: "member_email_conflict",
      category: "state_conflict",
      sourceLayer: "feature",
      nextAction: "review_request",
      evidence: {
        email: "grace@example.com"
      }
    });

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/members/${memberId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "inactive",
        address: null,
        faithStartYear: 2014,
        roles: ["leader", "pastor"],
        appLocale: "es",
        fellowshipGroupId: "updated-group",
        notificationSettings: {
          weeklyBulletin: false,
          sermonPublished: true,
          lifePostPublished: false,
          prayerUpdates: false
        }
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    const updatedMember = expectResponseData(
      updateResponse,
      memberProfileSchema,
      "admin member update"
    );
    expect(updatedMember.status).toBe("inactive");
    expect(updatedMember.address).toBeNull();
    expect(updatedMember.faithStartYear).toBe(2014);
    expect(updatedMember.roles).toEqual(["leader", "pastor"]);
    expect(updatedMember.appLocale).toBe("es");
    expect(updatedMember.fellowshipGroupId).toBe("updated-group");
    expect(updatedMember.notificationSettings.weeklyBulletin).toBe(false);
    expect(updatedMember.notificationSettings.lifePostPublished).toBe(false);

    const retainedDetailResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/members/${memberId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(retainedDetailResponse.statusCode).toBe(200);
    const retainedMember = expectResponseData(
      retainedDetailResponse,
      memberProfileSchema,
      "inactive member remains retained"
    );
    expect(retainedMember.status).toBe("inactive");

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=member&limit=20",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "member audit logs"
    );
    expect(
      audit.items.map((log: { action: string }) => log.action)
    ).toEqual(
      expect.arrayContaining([
        "member.create",
        "member.list",
        "member.view",
        "member.update"
      ])
    );
    const listAudit = audit.items.find((log) => log.action === "member.list");
    expect(listAudit?.afterJson).toMatchObject({
      hasFellowshipGroupId: true,
      hasQuery: true,
      queryLength: "New Member".length,
      count: 1
    });
    expect(JSON.stringify(listAudit?.afterJson)).not.toContain("New Member");
    await harness.close();
  });

  it("updates app settings through admin API", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/settings?category=church",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const settings = expectResponseData(
      listResponse,
      appSettingListResponseSchema,
      "admin setting list"
    );
    expect(
      settings.items.map((setting: { key: string }) => setting.key)
    ).toContain("church.name");

    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/church.name",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: "MBC Test"
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    const setting = expectResponseData(
      updateResponse,
      appSettingSchema,
      "admin setting update"
    );
    expect(setting.value).toBe("MBC Test");

    const timezoneResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/church.timezone",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: "  America/Los_Angeles  "
      }
    });
    expect(timezoneResponse.statusCode).toBe(200);
    expect(
      expectResponseData(
        timezoneResponse,
        appSettingSchema,
        "admin timezone setting update"
      ).value
    ).toBe("America/Los_Angeles");

    const invalidTimezoneResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/church.timezone",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: "Not/A_Timezone"
      }
    });
    expect(invalidTimezoneResponse.statusCode).toBe(400);
    expect(invalidTimezoneResponse.json().error).toMatchObject({
      code: "setting_value_invalid",
      category: "validation_error",
      sourceLayer: "feature",
      evidence: { settingKey: "church.timezone" },
      nextAction: "review_request"
    });

    const missingUpdateResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/missing.setting",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: "Missing"
      }
    });
    expect(missingUpdateResponse.statusCode).toBe(404);
    expect(missingUpdateResponse.json().error).toMatchObject({
      code: "setting_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        settingKey: "missing.setting"
      }
    });

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=setting&resourceId=church.name",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "setting audit logs"
    );
    expect(audit.items[0]?.action).toBe("setting.update");
    await harness.close();
  });

  it("uses admin-controlled registration settings for member registration", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const defaultsResponse = await app.inject({
      method: "GET",
      url: "/v1/member/auth/registration-settings"
    });
    expect(defaultsResponse.statusCode).toBe(200);
    const defaults = expectResponseData(
      defaultsResponse,
      memberRegistrationSettingsSchema,
      "member registration settings"
    );
    expect(defaults).toMatchObject({
      mode: "open",
      requireEmailVerification: true,
      requireAdminApproval: false
    });

    const codeRegistrationResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "code-register@example.com",
        displayName: "Code Register",
        password: "MemberPass123!"
      }
    });
    expect(codeRegistrationResponse.statusCode).toBe(200);
    const codeRegistration = expectResponseData(
      codeRegistrationResponse,
      memberAuthRegisterResponseSchema,
      "member code registration"
    );
    expect(codeRegistration.status).toBe("pending_email_verification");
    if (codeRegistration.status !== "pending_email_verification") {
      throw new Error("member registration did not return code request");
    }
    const codeRegistrationDevCode = codeRegistration.codeRequest.devCode;
    expect(codeRegistrationDevCode).toEqual(expect.any(String));
    if (!codeRegistrationDevCode) {
      throw new Error("member registration missing dev code in test mode");
    }

    await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/member.requireAdminApproval",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: true
      }
    });

    const approvalRegistrationResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "approval-register@example.com",
        displayName: "Approval Register",
        password: "MemberPass123!"
      }
    });
    expect(approvalRegistrationResponse.statusCode).toBe(200);
    const approvalRegistration = expectResponseData(
      approvalRegistrationResponse,
      memberAuthRegisterResponseSchema,
      "member approval registration"
    );
    expect(approvalRegistration.status).toBe("pending_email_verification");
    if (approvalRegistration.status !== "pending_email_verification") {
      throw new Error("approval registration did not return code request");
    }
    const approvalDevCode = approvalRegistration.codeRequest.devCode;
    expect(approvalDevCode).toEqual(expect.any(String));
    if (!approvalDevCode) {
      throw new Error("member approval registration missing devCode");
    }
    const approvalVerifyResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/verify-code",
      payload: {
        challengeId: approvalRegistration.codeRequest.challengeId,
        code: approvalDevCode,
        displayName: "Approval Register"
      }
    });
    expect(approvalVerifyResponse.statusCode).toBe(200);
    const approvalVerify = expectResponseData(
      approvalVerifyResponse,
      memberAuthVerifyCodeResponseSchema,
      "member approval verification"
    );
    expect(approvalVerify).toMatchObject({
      status: "pending_approval"
    });

    await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/member.requireAdminApproval",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: false
      }
    });

    await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/member.requireEmailVerification",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: false
      }
    });

    const directRegistrationResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "direct-register@example.com",
        password: "MemberPass123!"
      }
    });
    expect(directRegistrationResponse.statusCode).toBe(200);
    const directRegistration = expectResponseData(
      directRegistrationResponse,
      memberAuthRegisterResponseSchema,
      "member direct registration"
    );
    expect(directRegistration.status).toBe("signed_in");
    expect(directRegistration.session.member.email).toBe(
      "direct-register@example.com"
    );
    expect(directRegistration.session.member.displayName).toBe(
      "direct-register"
    );

    const directLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/login",
      payload: {
        email: "direct-register@example.com",
        password: "MemberPass123!"
      }
    });
    expect(directLoginResponse.statusCode).toBe(200);
    const directLogin = expectResponseData(
      directLoginResponse,
      memberAuthLoginResponseSchema,
      "member direct password login"
    );
    expect(directLogin.member.email).toBe("direct-register@example.com");

    const duplicatePublicRegistrationResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "direct-register@example.com",
        password: "AnotherPass123!"
      }
    });
    expect(duplicatePublicRegistrationResponse.statusCode).toBe(409);
    expect(duplicatePublicRegistrationResponse.json().error).toMatchObject({
      code: "member_registration_unavailable",
      category: "state_conflict",
      evidence: {}
    });
    expect(
      JSON.stringify(duplicatePublicRegistrationResponse.json().error)
    ).not.toContain("direct-register@example.com");

    const concurrentRegistrations = await Promise.all([
      app.inject({
        method: "POST",
        url: "/v1/member/auth/register",
        payload: {
          email: "concurrent-register@example.com",
          password: "MemberPass123!"
        }
      }),
      app.inject({
        method: "POST",
        url: "/v1/member/auth/register",
        payload: {
          email: "concurrent-register@example.com",
          password: "MemberPass123!"
        }
      })
    ]);
    expect(concurrentRegistrations.map((response) => response.statusCode).sort())
      .toEqual([200, 409]);
    const concurrentConflict = concurrentRegistrations.find(
      (response) => response.statusCode === 409
    );
    expect(concurrentConflict?.json().error).toMatchObject({
      code: "member_registration_unavailable",
      evidence: {}
    });

    await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/member.registrationMode",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: "closed"
      }
    });

    const closedRegistrationResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "closed-register@example.com",
        displayName: "Closed Register",
        password: "MemberPass123!"
      }
    });
    expect(closedRegistrationResponse.statusCode).toBe(403);
    expect(closedRegistrationResponse.json().error).toMatchObject({
      code: "member_registration_closed",
      category: "permission_denied",
      sourceLayer: "feature",
      nextAction: "contact_admin",
      evidence: {
        mode: "closed"
      }
    });

    const closedChallengeResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/verify-code",
      payload: {
        challengeId: codeRegistration.codeRequest.challengeId,
        code: codeRegistrationDevCode
      }
    });
    expect(closedChallengeResponse.statusCode).toBe(403);

    await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/member.registrationMode",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: "open"
      }
    });
    const reopenedChallengeResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/verify-code",
      payload: {
        challengeId: codeRegistration.codeRequest.challengeId,
        code: codeRegistrationDevCode
      }
    });
    expect(reopenedChallengeResponse.statusCode).toBe(200);
    expectResponseData(
      reopenedChallengeResponse,
      memberAuthVerifyCodeResponseSchema,
      "member challenge after registration reopens"
    );

    await harness.close();
  });

  it("resets a password through a one-time challenge and revokes old sessions", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminAccessToken } = await login(app);

    await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/member.requireEmailVerification",
      headers: { authorization: `Bearer ${adminAccessToken}` },
      payload: { value: false }
    });
    const registrationResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "password-reset@example.com",
        password: "MemberPass123!"
      }
    });
    const registration = expectResponseData(
      registrationResponse,
      memberAuthRegisterResponseSchema,
      "member registration before password reset"
    );
    if (registration.status !== "signed_in") {
      throw new Error("member registration did not create a session");
    }
    const accessToken = registration.session.accessToken;

    const resetResponses = await Promise.all(
      Array.from({ length: 3 }, () =>
        app.inject({
          method: "POST",
          url: "/v1/member/auth/password-reset/request",
          payload: { email: "password-reset@example.com" }
        })
      )
    );
    expect(resetResponses.map((response) => response.statusCode)).toEqual([
      200,
      200,
      200
    ]);
    const resetRequests = resetResponses.map((response) =>
      expectResponseData(
        response,
        memberAuthRequestCodeResponseSchema,
        "member password reset request"
      )
    );
    expect(new Set(resetRequests.map((request) => request.challengeId)).size).toBe(1);
    const resetRequest = resetRequests.find((request) => request.devCode != null);
    if (!resetRequest) {
      throw new Error("password reset request did not expose a test code");
    }
    expect(resetRequest.devCode).toEqual(expect.any(String));

    const confirmResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/password-reset/confirm",
      payload: {
        challengeId: resetRequest.challengeId,
        code: resetRequest.devCode,
        password: "ReplacementPass123!"
      }
    });
    expect(confirmResponse.statusCode).toBe(200);
    expect(confirmResponse.json().data).toEqual({ accepted: true });

    const previousSessionResponse = await app.inject({
      method: "GET",
      url: "/v1/member/auth/me",
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expect(previousSessionResponse.statusCode).toBe(401);

    const newLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/login",
      payload: {
        email: "password-reset@example.com",
        password: "ReplacementPass123!"
      }
    });
    expect(newLoginResponse.statusCode).toBe(200);

    const unknownResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/password-reset/request",
      payload: { email: "unknown-reset@example.com" }
    });
    expect(unknownResponse.statusCode).toBe(200);
    expect(unknownResponse.json().data).toMatchObject({
      accepted: true,
      delivery: "email"
    });
    const newlyRegisteredResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "unknown-reset@example.com",
        password: "MemberPass123!"
      }
    });
    expect(newlyRegisteredResponse.statusCode).toBe(200);
    const newlyRegisteredResetResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/password-reset/request",
      payload: { email: "unknown-reset@example.com" }
    });
    const newlyRegisteredReset = expectResponseData(
      newlyRegisteredResetResponse,
      memberAuthRequestCodeResponseSchema,
      "newly registered member password reset request"
    );
    expect(newlyRegisteredReset.devCode).toEqual(expect.any(String));
    await harness.close();
  });

  it("locks an email verification challenge after five invalid attempts", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const registerResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "verification-attempts@example.com",
        password: "MemberPass123!"
      }
    });
    expect(registerResponse.statusCode).toBe(200);
    const registration = expectResponseData(
      registerResponse,
      memberAuthRegisterResponseSchema,
      "member registration before verification attempt limit"
    );
    expect(registration.status).toBe("pending_email_verification");
    if (registration.status !== "pending_email_verification") {
      throw new Error("member registration did not return a verification code");
    }
    const devCode = registration.codeRequest.devCode;
    expect(devCode).toEqual(expect.any(String));
    if (!devCode) {
      throw new Error("member registration did not return dev code in test mode");
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/v1/member/auth/verify-code",
        payload: {
          challengeId: registration.codeRequest.challengeId,
          code: "000000"
        }
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().error).toMatchObject({
        code: "member_login_code_invalid"
      });
    }

    const correctCodeAfterLockResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/verify-code",
      payload: {
        challengeId: registration.codeRequest.challengeId,
        code: devCode
      }
    });
    expect(correctCodeAfterLockResponse.statusCode).toBe(401);
    expect(correctCodeAfterLockResponse.json().error).toMatchObject({
      code: "member_login_code_invalid"
    });

    await harness.close();
  });

  it("consumes a valid registration challenge exactly once", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const registerResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "single-consume@example.com",
        password: "MemberPass123!"
      }
    });
    const registration = expectResponseData(
      registerResponse,
      memberAuthRegisterResponseSchema,
      "single consume member registration"
    );
    if (registration.status !== "pending_email_verification") {
      throw new Error("single consume registration did not return code request");
    }
    const devCode = registration.codeRequest.devCode;
    if (!devCode) {
      throw new Error("single consume registration missing dev code");
    }

    const responses = await Promise.all([
      app.inject({
        method: "POST",
        url: "/v1/member/auth/verify-code",
        payload: {
          challengeId: registration.codeRequest.challengeId,
          code: devCode
        }
      }),
      app.inject({
        method: "POST",
        url: "/v1/member/auth/verify-code",
        payload: {
          challengeId: registration.codeRequest.challengeId,
          code: devCode
        }
      })
    ]);

    expect(responses.map((response) => response.statusCode).sort()).toEqual([
      200,
      401
    ]);
    expect(
      responses.find((response) => response.statusCode === 401)?.json().error
    ).toMatchObject({ code: "member_login_code_invalid" });
    await harness.close();
  });

  it("refuses production email verification without a delivery provider", async () => {
    const harness = await buildTestApp({ nodeEnv: "production" });
    const { app } = harness;

    const response = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "missing-email-provider@example.com",
        password: "MemberPass123!"
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error).toMatchObject({
      code: "member_email_verification_unavailable",
      category: "configuration_missing",
      sourceLayer: "capability",
      nextAction: "contact_admin"
    });

    await harness.close();
  });

  it("lets active members update their self-editable profile fields", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const registerResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "profile-self@example.com",
        displayName: "Profile Self",
        password: "MemberPass123!"
      }
    });
    expect(registerResponse.statusCode).toBe(200);
    const registration = expectResponseData(
      registerResponse,
      memberAuthRegisterResponseSchema,
      "member registration before self update"
    );
    expect(registration.status).toBe("pending_email_verification");
    const devCode = registration.codeRequest.devCode;
    expect(devCode).toEqual(expect.any(String));
    if (!devCode) {
      throw new Error("member auth request code missing devCode in test mode");
    }

    const verifyResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/verify-code",
      payload: {
        challengeId: registration.codeRequest.challengeId,
        code: devCode,
        displayName: "Profile Self"
      }
    });
    expect(verifyResponse.statusCode).toBe(200);
    const session = expectResponseData(
      verifyResponse,
      memberAuthSessionSchema,
      "member auth verify before self update"
    );

    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/v1/member/profile",
      headers: {
        authorization: `Bearer ${session.accessToken}`
      },
      payload: {
        displayName: "Profile Updated",
        phone: "+1 555 0144",
        address: "Example member address",
        faithStartYear: 2008,
        baptizedYear: 2011,
        joinedChurchAt: "2022-09-04",
        emergencyContactName: "Care Lead",
        emergencyContactPhone: "+1 555 0155"
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    const updatedEnvelope = expectResponseData(
      updateResponse,
      memberAuthMeResponseSchema,
      "member self update"
    );
    const updated = updatedEnvelope.member;
    expect(updated.displayName).toBe("Profile Updated");
    expect(updated.phone).toBe("+1 555 0144");
    expect(updated.address).toBe("Example member address");
    expect(updated.faithStartYear).toBe(2008);
    expect(updated.baptizedYear).toBe(2011);
    expect(updated.joinedChurchAt).toBe("2022-09-04");
    expect(updated.emergencyContactName).toBe("Care Lead");
    expect(updated.roles).toEqual(["member"]);

    const auditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?resourceType=member&resourceId=${updated.id}`,
      headers: {
        authorization: `Bearer ${(await login(app)).accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "member self update audit logs"
    );
    expect(
      audit.items.map((log: { action: string }) => log.action)
    ).toContain("member.profile.self_update");
    const profileAudit = audit.items.find(
      (log) => log.action === "member.profile.self_update"
    );
    const serializedProfileAudit = JSON.stringify({
      before: profileAudit?.beforeJson,
      after: profileAudit?.afterJson
    });
    expect(serializedProfileAudit).not.toContain("Example member address");
    expect(serializedProfileAudit).not.toContain("Care Lead");
    expect(serializedProfileAudit).not.toContain("2022-09-04");
    expect(profileAudit?.afterJson).toMatchObject({
      hasAddress: true,
      hasEmergencyContact: true,
      hasFaithStartYear: true,
      hasBaptizedYear: true,
      hasJoinedChurchAt: true
    });

    await harness.close();
  });
});
