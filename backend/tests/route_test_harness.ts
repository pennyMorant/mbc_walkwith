import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  adminLoginResponseSchema,
  memberAuthRegisterResponseSchema,
  memberAuthSessionSchema
} from "@mbc/api-contracts";
import { expect } from "vitest";

import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import { expectResponseData } from "./contract_assertions.js";

export async function login(app: Awaited<ReturnType<typeof buildApp>>) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/auth/login",
    payload: {
      email: testConfig.devAdminEmail,
      password: testConfig.devAdminPassword
    }
  });

  expect(response.statusCode).toBe(200);
  return expectResponseData(response, adminLoginResponseSchema, "admin login");
}

export async function loginMember(
  app: Awaited<ReturnType<typeof buildApp>>,
  input: { email: string; displayName: string; password?: string }
) {
  const password = input.password ?? "MemberPass123!";
  const registerResponse = await app.inject({
    method: "POST",
    url: "/v1/member/auth/register",
    payload: {
      email: input.email,
      displayName: input.displayName,
      password
    }
  });
  expect(registerResponse.statusCode).toBe(200);
  const registration = expectResponseData(
    registerResponse,
    memberAuthRegisterResponseSchema,
    "member auth register"
  );
  if (registration.status === "signed_in") {
    return {
      accessToken: registration.session.accessToken,
      memberId: registration.session.member.id
    };
  }
  if (registration.status === "pending_approval") {
    throw new Error("member registration requires approval in test helper");
  }
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
      code: devCode
    }
  });
  expect(verifyResponse.statusCode).toBe(200);
  const session = expectResponseData(
    verifyResponse,
    memberAuthSessionSchema,
    "member auth verify"
  );
  return {
    accessToken: session.accessToken,
    memberId: session.member.id
  };
}

export async function buildTestApp(configOverrides: Partial<AppConfig> = {}) {
  const mediaUploadDir = await mkdtemp(join(tmpdir(), "mbc-routes-media-"));
  const app = await buildApp({
    ...testConfig,
    ...configOverrides,
    mediaUploadDir
  });

  return {
    app,
    async close() {
      await app.close();
      await rm(mediaUploadDir, { recursive: true, force: true });
    }
  };
}

export const testConfig: AppConfig = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 0,
  publicApiBaseUrl: "http://localhost:3020/v1",
  adminWebOrigin: "http://localhost:5173",
  useMockData: true,
  databaseUrl: undefined,
  mediaStorageDriver: "local",
  mediaUploadDir: "uploads-test",
  s3Endpoint: undefined,
  s3Region: "us-east-1",
  s3Bucket: undefined,
  s3AccessKeyId: undefined,
  s3SecretAccessKey: undefined,
  s3ForcePathStyle: true,
  authSecret: "test-secret-minimum-32-characters",
  appUserAuthSecret: "test-member-secret-minimum-32-characters",
  debugMemberAuthBypass: true,
  debugMemberAccessToken: "mbc-debug-member-access",
  debugMemberEmail: "debug.member@mbc.local",
  debugMemberDisplayName: "Debug Member",
  devAdminEmail: "admin@mbc.local",
  devAdminPassword: "password123",
  bootstrapDevAdmin: true,
  fcmServiceAccountJson: undefined,
  firebaseServiceAccountJson: undefined,
  memberAuthRateLimitWindowMs: 60000,
  memberAuthRateLimitPerWindow: 10,
  fcmHttpTimeoutMs: 10000,
  notificationRetrySchedulerEnabled: false,
  notificationRetrySchedulerIntervalMs: 60000,
  notificationRetrySchedulerBatchSize: 20,
  aiProvider: "disabled",
  aiApiKey: undefined,
  aiBaseUrl: undefined,
  aiModel: undefined,
  aiTimeoutMs: 30000,
  aiMaxOutputTokens: 1200,
  aiAuditEnabled: true,
  aiExtraHeaders: {},
  aiRateLimitWindowMs: 60000,
  aiAdminRateLimitPerWindow: 20,
  aiMemberRateLimitPerWindow: 10,
  stripeSecretKey: undefined,
  stripeWebhookSecret: undefined,
  stripeApiBaseUrl: "https://api.stripe.test",
  givingCheckoutSuccessUrl: "mbcwalkwith://life/giving?checkout=success",
  givingCheckoutCancelUrl: "mbcwalkwith://life/giving?checkout=cancel",
  memberEmailProvider: "disabled",
  memberEmailResendApiKey: undefined,
  memberEmailFrom: undefined,
  memberEmailReplyTo: undefined,
  memberEmailHttpTimeoutMs: 10000
};
