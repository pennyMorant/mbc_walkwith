import { afterEach, describe, expect, it } from "vitest";

import { loadConfig } from "../src/config/env.js";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNodeEnv = process.env.NODE_ENV;
const originalUseMockData = process.env.USE_MOCK_DATA;
const originalTrustProxy = process.env.TRUST_PROXY;
const originalAiEnv = {
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_API_KEY: process.env.AI_API_KEY,
  AI_BASE_URL: process.env.AI_BASE_URL,
  AI_MODEL: process.env.AI_MODEL,
  AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
  AI_MAX_OUTPUT_TOKENS: process.env.AI_MAX_OUTPUT_TOKENS,
  AI_AUDIT_ENABLED: process.env.AI_AUDIT_ENABLED,
  AI_EXTRA_HEADERS_JSON: process.env.AI_EXTRA_HEADERS_JSON,
  AI_RATE_LIMIT_WINDOW_MS: process.env.AI_RATE_LIMIT_WINDOW_MS,
  AI_ADMIN_RATE_LIMIT_PER_WINDOW:
    process.env.AI_ADMIN_RATE_LIMIT_PER_WINDOW,
  AI_MEMBER_RATE_LIMIT_PER_WINDOW:
    process.env.AI_MEMBER_RATE_LIMIT_PER_WINDOW
};
const originalNotificationEnv = {
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  FCM_SERVICE_ACCOUNT_JSON: process.env.FCM_SERVICE_ACCOUNT_JSON,
  MEMBER_AUTH_RATE_LIMIT_WINDOW_MS:
    process.env.MEMBER_AUTH_RATE_LIMIT_WINDOW_MS,
  MEMBER_AUTH_RATE_LIMIT_PER_WINDOW:
    process.env.MEMBER_AUTH_RATE_LIMIT_PER_WINDOW,
  NOTIFICATION_RETRY_SCHEDULER_ENABLED:
    process.env.NOTIFICATION_RETRY_SCHEDULER_ENABLED,
  NOTIFICATION_RETRY_SCHEDULER_INTERVAL_MS:
    process.env.NOTIFICATION_RETRY_SCHEDULER_INTERVAL_MS,
  NOTIFICATION_RETRY_SCHEDULER_BATCH_SIZE:
    process.env.NOTIFICATION_RETRY_SCHEDULER_BATCH_SIZE
};
const originalStripeEnv = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_API_BASE_URL: process.env.STRIPE_API_BASE_URL,
  GIVING_CHECKOUT_SUCCESS_URL: process.env.GIVING_CHECKOUT_SUCCESS_URL,
  GIVING_CHECKOUT_CANCEL_URL: process.env.GIVING_CHECKOUT_CANCEL_URL
};
const originalDebugMemberEnv = {
  DEBUG_MEMBER_AUTH_BYPASS: process.env.DEBUG_MEMBER_AUTH_BYPASS,
  DEBUG_MEMBER_ACCESS_TOKEN: process.env.DEBUG_MEMBER_ACCESS_TOKEN,
  DEBUG_MEMBER_EMAIL: process.env.DEBUG_MEMBER_EMAIL,
  DEBUG_MEMBER_DISPLAY_NAME: process.env.DEBUG_MEMBER_DISPLAY_NAME
};
const originalSecurityEnv = {
  auth_secret: process.env.auth_secret,
  app_user_auth_secret: process.env.app_user_auth_secret,
  DEV_ADMIN_PASSWORD: process.env.DEV_ADMIN_PASSWORD,
  BOOTSTRAP_DEV_ADMIN: process.env.BOOTSTRAP_DEV_ADMIN
};

describe("loadConfig", () => {
  afterEach(() => {
    restoreEnv("DATABASE_URL", originalDatabaseUrl);
    restoreEnv("NODE_ENV", originalNodeEnv);
    restoreEnv("USE_MOCK_DATA", originalUseMockData);
    restoreEnv("TRUST_PROXY", originalTrustProxy);
    for (const [key, value] of Object.entries(originalAiEnv)) {
      restoreEnv(key, value);
    }
    for (const [key, value] of Object.entries(originalNotificationEnv)) {
      restoreEnv(key, value);
    }
    for (const [key, value] of Object.entries(originalStripeEnv)) {
      restoreEnv(key, value);
    }
    for (const [key, value] of Object.entries(originalDebugMemberEnv)) {
      restoreEnv(key, value);
    }
    for (const [key, value] of Object.entries(originalSecurityEnv)) {
      restoreEnv(key, value);
    }
  });

  it("uses Postgres mode by default when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgres://user@localhost:5432/mbc";
    delete process.env.USE_MOCK_DATA;

    expect(loadConfig().useMockData).toBe(false);
  });

  it("uses mock mode by default when DATABASE_URL is absent", () => {
    delete process.env.DATABASE_URL;
    delete process.env.USE_MOCK_DATA;

    expect(loadConfig().useMockData).toBe(true);
  });

  it("honors explicit USE_MOCK_DATA", () => {
    process.env.DATABASE_URL = "postgres://user@localhost:5432/mbc";
    process.env.USE_MOCK_DATA = "true";

    expect(loadConfig().useMockData).toBe(true);
  });

  it("trusts only configured reverse proxies in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://user@localhost:5432/mbc";
    process.env.auth_secret = "prod-admin-secret-minimum-32-characters";
    process.env.app_user_auth_secret =
      "prod-member-secret-minimum-32-characters";
    delete process.env.TRUST_PROXY;

    expect(loadConfig().trustProxy).toEqual(["127.0.0.1"]);

    process.env.TRUST_PROXY = "127.0.0.1, 172.16.0.0/12";
    expect(loadConfig().trustProxy).toEqual([
      "127.0.0.1",
      "172.16.0.0/12"
    ]);
  });

  it("parses AI provider configuration from environment variables", () => {
    process.env.AI_PROVIDER = "openai_compatible";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "https://relay.example.com/v1";
    process.env.AI_MODEL = "church-model";
    process.env.AI_TIMEOUT_MS = "45000";
    process.env.AI_MAX_OUTPUT_TOKENS = "900";
    process.env.AI_AUDIT_ENABLED = "false";
    process.env.AI_RATE_LIMIT_WINDOW_MS = "30000";
    process.env.AI_ADMIN_RATE_LIMIT_PER_WINDOW = "9";
    process.env.AI_MEMBER_RATE_LIMIT_PER_WINDOW = "3";
    process.env.AI_EXTRA_HEADERS_JSON = JSON.stringify({
      "x-relay-tenant": "mbc",
      ignoredNumber: 1
    });

    expect(loadConfig()).toMatchObject({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "church-model",
      aiTimeoutMs: 45000,
      aiMaxOutputTokens: 900,
      aiAuditEnabled: false,
      aiRateLimitWindowMs: 30000,
      aiAdminRateLimitPerWindow: 9,
      aiMemberRateLimitPerWindow: 3,
      aiExtraHeaders: {
        "x-relay-tenant": "mbc"
      }
    });
  });

  it("parses notification retry scheduler configuration", () => {
    process.env.NOTIFICATION_RETRY_SCHEDULER_ENABLED = "true";
    process.env.NOTIFICATION_RETRY_SCHEDULER_INTERVAL_MS = "45000";
    process.env.NOTIFICATION_RETRY_SCHEDULER_BATCH_SIZE = "8";

    expect(loadConfig()).toMatchObject({
      notificationRetrySchedulerEnabled: true,
      notificationRetrySchedulerIntervalMs: 45000,
      notificationRetrySchedulerBatchSize: 8
    });
  });

  it("uses a dedicated Firebase credential or falls back to FCM", () => {
    process.env.FCM_SERVICE_ACCOUNT_JSON = "fcm-json";
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    expect(loadConfig().firebaseServiceAccountJson).toBe("fcm-json");

    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "auth-json";
    expect(loadConfig().firebaseServiceAccountJson).toBe("auth-json");
  });

  it("parses member authentication rate limits", () => {
    process.env.MEMBER_AUTH_RATE_LIMIT_WINDOW_MS = "45000";
    process.env.MEMBER_AUTH_RATE_LIMIT_PER_WINDOW = "7";

    expect(loadConfig()).toMatchObject({
      memberAuthRateLimitWindowMs: 45000,
      memberAuthRateLimitPerWindow: 7
    });
  });

  it("parses Stripe giving configuration", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_local";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_local";
    process.env.STRIPE_API_BASE_URL = "https://stripe.test";
    process.env.GIVING_CHECKOUT_SUCCESS_URL = "mbcwalkwith://giving/success";
    process.env.GIVING_CHECKOUT_CANCEL_URL = "mbcwalkwith://giving/cancel";

    expect(loadConfig()).toMatchObject({
      stripeSecretKey: "sk_test_local",
      stripeWebhookSecret: "whsec_local",
      stripeApiBaseUrl: "https://stripe.test",
      givingCheckoutSuccessUrl: "mbcwalkwith://giving/success",
      givingCheckoutCancelUrl: "mbcwalkwith://giving/cancel"
    });
  });

  it("keeps debug member auth bypass out of production", () => {
    process.env.NODE_ENV = "development";
    delete process.env.DEBUG_MEMBER_AUTH_BYPASS;
    delete process.env.DEBUG_MEMBER_ACCESS_TOKEN;

    expect(loadConfig()).toMatchObject({
      debugMemberAuthBypass: true,
      debugMemberAccessToken: "mbc-debug-member-access",
      debugMemberEmail: "debug.member@mbc.local",
      debugMemberDisplayName: "Debug Member"
    });

    process.env.DEBUG_MEMBER_AUTH_BYPASS = "false";
    expect(loadConfig().debugMemberAuthBypass).toBe(false);

    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://user@localhost:5432/mbc";
    process.env.auth_secret = "prod-admin-secret-minimum-32-characters";
    process.env.app_user_auth_secret =
      "prod-member-secret-minimum-32-characters";
    process.env.DEBUG_MEMBER_AUTH_BYPASS = "true";
    process.env.DEBUG_MEMBER_ACCESS_TOKEN = "prod-debug-token";
    expect(loadConfig()).toMatchObject({
      debugMemberAuthBypass: false,
      debugMemberAccessToken: "prod-debug-token"
    });
  });

  it("rejects development auth secrets in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://user@localhost:5432/mbc";
    process.env.auth_secret = "dev-only-change-me-minimum-32-characters";
    process.env.app_user_auth_secret =
      "dev-only-change-me-minimum-32-characters";

    expect(() => loadConfig()).toThrow(/auth_secret/);
  });

  it("requires separate production auth secrets", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://user@localhost:5432/mbc";
    process.env.auth_secret = "prod-admin-secret-minimum-32-characters";
    process.env.app_user_auth_secret =
      "prod-admin-secret-minimum-32-characters";

    expect(() => loadConfig()).toThrow(/separate production secrets/);
  });

  it("requires Postgres mode in production", () => {
    process.env.NODE_ENV = "production";
    process.env.auth_secret = "prod-admin-secret-minimum-32-characters";
    process.env.app_user_auth_secret =
      "prod-member-secret-minimum-32-characters";
    delete process.env.DATABASE_URL;
    delete process.env.USE_MOCK_DATA;

    expect(() => loadConfig()).toThrow(/DATABASE_URL/);

    process.env.DATABASE_URL = "postgres://user@localhost:5432/mbc";
    process.env.USE_MOCK_DATA = "true";
    expect(() => loadConfig()).toThrow(/USE_MOCK_DATA/);
  });

  it("requires a rotated admin password before production bootstrap", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://user@localhost:5432/mbc";
    process.env.auth_secret = "prod-admin-secret-minimum-32-characters";
    process.env.app_user_auth_secret =
      "prod-member-secret-minimum-32-characters";
    process.env.BOOTSTRAP_DEV_ADMIN = "true";
    process.env.DEV_ADMIN_PASSWORD = "password123";

    expect(() => loadConfig()).toThrow(/DEV_ADMIN_PASSWORD/);
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}
