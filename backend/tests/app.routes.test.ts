import {
  adminDashboardResponseSchema,
  adminLoginResponseSchema,
  adminRefreshTokenResponseSchema,
  adminSessionSchema,
  adminUserSchema,
  appSettingListResponseSchema,
  healthResponseSchema,
  memberAuthLoginResponseSchema,
  memberAuthMeResponseSchema,
  memberAuthRegisterResponseSchema,
  memberAuthSessionSchema,
  memberPushDeviceResponseSchema,
  revokeMemberPushDeviceResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember, testConfig } from "./route_test_harness.js";

describe("backend core and auth routes", () => {
  it("responds to health checks", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const response = await app.inject({
      method: "GET",
      url: "/v1/health"
    });

    expect(response.statusCode).toBe(200);
    const health = expectResponseData(
      response,
      healthResponseSchema,
      "health"
    );
    expect(health.ok).toBe(true);
    expect(health.data.mode).toBe("mock");
    expect(health.data.databaseConfigured).toBe(false);
    await harness.close();
  });

  it("returns real admin dashboard metrics", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/dashboard",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const dashboard = expectResponseData(
      response,
      adminDashboardResponseSchema,
      "admin dashboard"
    );
    expect(
      dashboard.metrics.map((metric: { id: string }) => metric.id)
    ).toContain("published_sermons");
    expect(dashboard.jobs.queued).toEqual(expect.any(Number));
    await harness.close();
  });

  it("filters dashboard metrics by the authenticated admin role", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const owner = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/users",
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: {
        email: "dashboard.finance@mbc.local",
        name: "Dashboard Finance",
        role: "finance",
        password: "password123"
      }
    });
    expect(createResponse.statusCode).toBe(200);

    const loginResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: "dashboard.finance@mbc.local",
        password: "password123"
      }
    });
    const finance = expectResponseData(
      loginResponse,
      adminLoginResponseSchema,
      "finance admin login"
    );
    const dashboardResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/dashboard",
      headers: { authorization: `Bearer ${finance.accessToken}` }
    });
    const dashboard = expectResponseData(
      dashboardResponse,
      adminDashboardResponseSchema,
      "finance dashboard"
    );

    expect(dashboard.metrics.map((metric) => metric.id)).toEqual([
      "giving_year_total",
      "giving_transaction_count"
    ]);
    expect(dashboard.jobs).toBeNull();
    await harness.close();
  });

  it("returns structured errors for protected admin routes", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/dashboard"
    });
    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body.error).toMatchObject({
      code: "admin_auth_required",
      category: "authentication_required",
      sourceLayer: "surface",
      message: expect.any(String),
      recoverable: true,
      retryable: false,
      evidence: { requestId: expect.any(String) },
      nextAction: "sign_in"
    });
    expect(body.requestId).toEqual(expect.any(String));
    await harness.close();
  });

  it("returns public app settings for mobile feature flags", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const response = await app.inject({
      method: "GET",
      url: "/v1/settings/public?category=features"
    });

    expect(response.statusCode).toBe(200);
    const settings = expectResponseData(
      response,
      appSettingListResponseSchema,
      "public app settings"
    );
    expect(
      settings.items.map((setting: { key: string }) => setting.key)
    ).toContain("features.givingEnabled");

    const fullResponse = await app.inject({
      method: "GET",
      url: "/v1/settings/public?limit=200"
    });
    expect(fullResponse.statusCode).toBe(200);
    const fullSettings = expectResponseData(
      fullResponse,
      appSettingListResponseSchema,
      "full public app settings"
    );
    const fullKeys = fullSettings.items.map(
      (setting: { key: string }) => setting.key
    );
    expect(fullKeys).toContain("church.name");
    expect(fullKeys).toContain("member.registrationMode");
    expect(fullKeys).not.toContain("publicLanding.contact");
    await harness.close();
  });

  it("keeps member auth optional while supporting account password sign-in", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const publicSermonsResponse = await app.inject({
      method: "GET",
      url: "/v1/sermons?limit=5"
    });
    expect(publicSermonsResponse.statusCode).toBe(200);

    const password = "MemberPass123!";
    const registerResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/register",
      payload: {
        email: "optional-member@example.com",
        displayName: "Optional Member",
        password
      }
    });
    expect(registerResponse.statusCode).toBe(200);
    const registration = expectResponseData(
      registerResponse,
      memberAuthRegisterResponseSchema,
      "member auth register"
    );
    expect(registration.status).toBe("pending_email_verification");
    if (registration.status !== "pending_email_verification") {
      throw new Error("member registration did not return code request");
    }
    const challengeId = registration.codeRequest.challengeId;
    expect(challengeId).toEqual(expect.any(String));
    expect(registration.codeRequest.delivery).toBe("email");
    const devCode = registration.codeRequest.devCode;
    expect(devCode).toEqual(expect.any(String));
    if (!devCode) {
      throw new Error("member auth request code missing devCode in test mode");
    }
    expect(devCode).toMatch(/^\d{6}$/);

    const verifyResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/verify-code",
      payload: {
        challengeId,
        code: devCode,
        displayName: "Optional Member"
      }
    });
    expect(verifyResponse.statusCode).toBe(200);
    const session = expectResponseData(
      verifyResponse,
      memberAuthSessionSchema,
      "member auth verify"
    );
    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.member.email).toBe("optional-member@example.com");

    const loginResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/login",
      payload: {
        email: "optional-member@example.com",
        password
      }
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginSession = expectResponseData(
      loginResponse,
      memberAuthLoginResponseSchema,
      "member password login"
    );
    expect(loginSession.member.email).toBe("optional-member@example.com");
    const accessToken = loginSession.accessToken;

    const meResponse = await app.inject({
      method: "GET",
      url: "/v1/member/auth/me",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(meResponse.statusCode).toBe(200);
    const me = expectResponseData(
      meResponse,
      memberAuthMeResponseSchema,
      "member auth me"
    );
    expect(me.member.displayName).toBe("Optional Member");

    const logoutResponse = await app.inject({
      method: "POST",
      url: "/v1/member/auth/logout",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(logoutResponse.statusCode).toBe(200);

    const afterLogoutResponse = await app.inject({
      method: "GET",
      url: "/v1/member/auth/me",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(afterLogoutResponse.statusCode).toBe(401);
    expect(afterLogoutResponse.json().error).toMatchObject({
      code: "member_session_invalid",
      category: "authentication_required",
      sourceLayer: "feature",
      nextAction: "sign_in",
      evidence: {
        reason: "revoked"
      }
    });
    await harness.close();
  });

  it("allows debug member access only outside production", async () => {
    const debugToken = "test-debug-member-token";
    const harness = await buildTestApp({
      debugMemberAuthBypass: true,
      debugMemberAccessToken: debugToken,
      debugMemberEmail: "debug.member@mbc.local",
      debugMemberDisplayName: "Debug Member"
    });
    const { app } = harness;

    const meResponse = await app.inject({
      method: "GET",
      url: "/v1/member/auth/me",
      headers: {
        authorization: `Bearer ${debugToken}`
      }
    });

    expect(meResponse.statusCode).toBe(200);
    const me = expectResponseData(
      meResponse,
      memberAuthMeResponseSchema,
      "debug member auth me"
    );
    expect(me.member).toMatchObject({
      email: "debug.member@mbc.local",
      displayName: "Debug Member",
      fellowshipGroupId: "friday-fellowship"
    });
    await harness.close();

    const productionHarness = await buildTestApp({
      nodeEnv: "production",
      debugMemberAuthBypass: true,
      debugMemberAccessToken: debugToken,
      debugMemberEmail: "debug.member@mbc.local",
      debugMemberDisplayName: "Debug Member",
      bootstrapDevAdmin: false
    });
    const productionResponse = await productionHarness.app.inject({
      method: "GET",
      url: "/v1/member/auth/me",
      headers: {
        authorization: `Bearer ${debugToken}`
      }
    });
    expect(productionResponse.statusCode).toBe(401);
    expect(productionResponse.json().error).toMatchObject({
      code: "member_session_invalid",
      category: "authentication_required",
      nextAction: "sign_in"
    });
    await productionHarness.close();
  });

  it("updates member notification preferences and manages push tokens", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const member = await loginMember(app, {
      email: "push-member@example.com",
      displayName: "Push Member"
    });

    const updatePreferencesResponse = await app.inject({
      method: "PATCH",
      url: "/v1/member/preferences/notifications",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        weeklyBulletin: true,
        sermonPublished: false,
        lifePostPublished: true,
        prayerUpdates: true
      }
    });
    expect(updatePreferencesResponse.statusCode).toBe(200);
    const notificationPreferences = expectResponseData(
      updatePreferencesResponse,
      memberAuthMeResponseSchema,
      "member notification preferences"
    );
    expect(notificationPreferences.member.notificationSettings).toEqual({
      weeklyBulletin: true,
      sermonPublished: false,
      lifePostPublished: true,
      prayerUpdates: true
    });

    const upsertDeviceResponse = await app.inject({
      method: "PUT",
      url: "/v1/member/devices/push-token",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        installationId: "ios-installation-1",
        platform: "ios",
        provider: "fcm",
        pushToken: "fcm-token-abcdefghijklmnopqrstuvwxyz-1234567890",
        permissionStatus: "authorized",
        locale: "en",
        appVersion: "1.0.0"
      }
    });
    expect(upsertDeviceResponse.statusCode).toBe(200);
    const upsertDevice = expectResponseData(
      upsertDeviceResponse,
      memberPushDeviceResponseSchema,
      "member push device upsert"
    );
    expect(upsertDevice.accepted).toBe(true);
    expect(upsertDevice.device.installationId).toBe("ios-installation-1");

    const revokeDeviceResponse = await app.inject({
      method: "POST",
      url: "/v1/member/devices/push-token/revoke",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        installationId: "ios-installation-1"
      }
    });
    expect(revokeDeviceResponse.statusCode).toBe(200);
    const revokeDevice = expectResponseData(
      revokeDeviceResponse,
      revokeMemberPushDeviceResponseSchema,
      "member push device revoke"
    );
    expect(revokeDevice.accepted).toBe(true);

    const unauthenticatedResponse = await app.inject({
      method: "PUT",
      url: "/v1/member/devices/push-token",
      payload: {
        installationId: "ios-installation-1",
        platform: "ios",
        provider: "fcm",
        pushToken: "fcm-token-abcdefghijklmnopqrstuvwxyz-1234567890",
        permissionStatus: "authorized",
        locale: "en"
      }
    });
    expect(unauthenticatedResponse.statusCode).toBe(401);
    expect(unauthenticatedResponse.json().error).toMatchObject({
      code: "member_auth_required",
      category: "authentication_required",
      sourceLayer: "surface",
      nextAction: "sign_in"
    });
    await harness.close();
  });

  it("returns the current admin session", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/auth/me",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const session = expectResponseData(
      response,
      adminSessionSchema,
      "admin session"
    );
    expect(session.user.email).toBe(testConfig.devAdminEmail);
    expect(session.permissions).toContain("sermons:publish");
    await harness.close();
  });

  it("rotates admin refresh tokens", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const session = await login(app);

    const refreshResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/refresh",
      payload: {
        refreshToken: session.refreshToken
      }
    });

    expect(refreshResponse.statusCode).toBe(200);
    const refresh = expectResponseData(
      refreshResponse,
      adminRefreshTokenResponseSchema,
      "admin refresh token"
    );
    expect(refresh.accessToken).toEqual(expect.any(String));
    expect(refresh.refreshToken).not.toBe(session.refreshToken);

    const reuseResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/refresh",
      payload: {
        refreshToken: session.refreshToken
      }
    });

    expect(reuseResponse.statusCode).toBe(401);
    expect(reuseResponse.json().error).toMatchObject({
      code: "admin_refresh_token_invalid",
      category: "authentication_required",
      sourceLayer: "feature",
      nextAction: "sign_in",
      evidence: {
        reason: "revoked"
      }
    });

    const missingRefreshTokenResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/refresh",
      payload: {}
    });
    expect(missingRefreshTokenResponse.statusCode).toBe(401);
    expect(missingRefreshTokenResponse.json().error).toMatchObject({
      code: "admin_refresh_token_required",
      category: "authentication_required",
      sourceLayer: "surface",
      nextAction: "sign_in"
    });
    await harness.close();
  });

  it("refreshes admin sessions from the HttpOnly cookie", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const loginResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: testConfig.devAdminEmail,
        password: testConfig.devAdminPassword
      }
    });
    const cookie = loginResponse.headers["set-cookie"];

    const refreshResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/refresh",
      headers: {
        cookie: Array.isArray(cookie) ? cookie[0] : cookie
      },
      payload: {}
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.headers["set-cookie"]).toBeDefined();
    const refresh = expectResponseData(
      refreshResponse,
      adminRefreshTokenResponseSchema,
      "admin cookie refresh"
    );
    expect(refresh.permissions).toContain("users:manage");
    await harness.close();
  });

  it("lets admins change their own password", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/change-password",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        currentPassword: testConfig.devAdminPassword,
        newPassword: "changed-password"
      }
    });

    expect(response.statusCode).toBe(200);
    const session = expectResponseData(
      response,
      adminSessionSchema,
      "admin change password"
    );
    expect(session.user.email).toBe(testConfig.devAdminEmail);

    const oldLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: testConfig.devAdminEmail,
        password: testConfig.devAdminPassword
      }
    });
    expect(oldLoginResponse.statusCode).toBe(401);
    expect(oldLoginResponse.json().error).toMatchObject({
      code: "admin_credentials_invalid",
      category: "authentication_required",
      sourceLayer: "feature",
      nextAction: "sign_in"
    });

    const newLoginResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: testConfig.devAdminEmail,
        password: "changed-password"
      }
    });
    expect(newLoginResponse.statusCode).toBe(200);
    await harness.close();
  });

  it("revokes admin access token on logout", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const session = await login(app);

    const logoutResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/logout",
      headers: {
        authorization: `Bearer ${session.accessToken}`
      },
      payload: {
        refreshToken: session.refreshToken
      }
    });

    expect(logoutResponse.statusCode).toBe(200);

    const meResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/auth/me",
      headers: {
        authorization: `Bearer ${session.accessToken}`
      }
    });

    expect(meResponse.statusCode).toBe(401);
    await harness.close();
  });

  it("manages admin users through owner-only APIs", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/users",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        email: "editor@mbc.local",
        name: "Content Editor",
        role: "content_editor",
        password: "password123"
      }
    });

    expect(createResponse.statusCode).toBe(200);
    const createdUser = expectResponseData(
      createResponse,
      adminUserSchema,
      "admin user create"
    );
    const userId = createdUser.id;

    const duplicateCreateResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/users",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        email: "editor@mbc.local",
        name: "Duplicate Editor",
        role: "content_editor",
        password: "password123"
      }
    });
    expect(duplicateCreateResponse.statusCode).toBe(409);
    expect(duplicateCreateResponse.json().error).toMatchObject({
      code: "admin_user_email_conflict",
      category: "state_conflict",
      sourceLayer: "feature",
      nextAction: "review_request",
      evidence: {
        email: "editor@mbc.local"
      }
    });

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/users/${userId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        role: "pastor",
        status: "disabled"
      }
    });

    expect(updateResponse.statusCode).toBe(200);
    const updatedUser = expectResponseData(
      updateResponse,
      adminUserSchema,
      "admin user update"
    );
    expect(updatedUser.role).toBe("pastor");
    expect(updatedUser.status).toBe("disabled");

    const resetResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/users/${userId}/reset-password`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        password: "newpassword123"
      }
    });

    expect(resetResponse.statusCode).toBe(200);

    const missingResetResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/users/missing-admin-user/reset-password",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        password: "newpassword123"
      }
    });
    expect(missingResetResponse.statusCode).toBe(404);
    expect(missingResetResponse.json().error).toMatchObject({
      code: "admin_user_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        adminUserId: "missing-admin-user"
      }
    });
    await harness.close();
  });
});
