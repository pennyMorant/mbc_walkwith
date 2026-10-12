export type AppConfig = {
  nodeEnv: string;
  host: string;
  port: number;
  trustProxy: false | string[];
  publicApiBaseUrl: string;
  adminWebOrigin: string;
  useMockData: boolean;
  databaseUrl: string | undefined;
  mediaStorageDriver: "local" | "s3";
  mediaUploadDir: string | undefined;
  s3Endpoint: string | undefined;
  s3Region: string;
  s3Bucket: string | undefined;
  s3AccessKeyId: string | undefined;
  s3SecretAccessKey: string | undefined;
  s3ForcePathStyle: boolean;
  authSecret: string;
  appUserAuthSecret: string;
  debugMemberAuthBypass: boolean;
  debugMemberAccessToken: string;
  debugMemberEmail: string;
  debugMemberDisplayName: string;
  devAdminEmail: string;
  devAdminPassword: string;
  bootstrapDevAdmin: boolean;
  fcmServiceAccountJson: string | undefined;
  firebaseServiceAccountJson: string | undefined;
  memberAuthRateLimitWindowMs: number;
  memberAuthRateLimitPerWindow: number;
  fcmHttpTimeoutMs: number;
  notificationRetrySchedulerEnabled: boolean;
  notificationRetrySchedulerIntervalMs: number;
  notificationRetrySchedulerBatchSize: number;
  aiProvider: "disabled" | "openai" | "gemini" | "openai_compatible";
  aiApiKey: string | undefined;
  aiBaseUrl: string | undefined;
  aiModel: string | undefined;
  aiTimeoutMs: number;
  aiMaxOutputTokens: number;
  aiAuditEnabled: boolean;
  aiExtraHeaders: Record<string, string>;
  aiRateLimitWindowMs: number;
  aiAdminRateLimitPerWindow: number;
  aiMemberRateLimitPerWindow: number;
  stripeSecretKey: string | undefined;
  stripeWebhookSecret: string | undefined;
  stripeApiBaseUrl: string;
  givingCheckoutSuccessUrl: string;
  givingCheckoutCancelUrl: string;
  memberEmailProvider: "disabled" | "resend";
  memberEmailResendApiKey: string | undefined;
  memberEmailFrom: string | undefined;
  memberEmailReplyTo: string | undefined;
  memberEmailHttpTimeoutMs: number;
};

const devOnlySecret = "dev-only-change-me-minimum-32-characters";
const devOnlyAdminPassword = "password123";
const productionPlaceholderValues = new Set([
  "replace-with-production-secret",
  "replace-before-first-deploy"
]);

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const authSecret = process.env.auth_secret ?? devOnlySecret;
  const appUserAuthSecret =
    process.env.app_user_auth_secret ??
    process.env.auth_secret ??
    devOnlySecret;
  const devAdminPassword =
    process.env.DEV_ADMIN_PASSWORD ?? devOnlyAdminPassword;
  const bootstrapDevAdmin = boolFromEnv(
    "BOOTSTRAP_DEV_ADMIN",
    nodeEnv !== "production"
  );
  const config: AppConfig = {
    nodeEnv,
    host: process.env.HOST ?? "127.0.0.1",
    port: numberFromEnv("PORT", 3020),
    trustProxy: trustProxyFromEnv(nodeEnv),
    publicApiBaseUrl:
      process.env.PUBLIC_API_BASE_URL ?? "http://localhost:3020/v1",
    adminWebOrigin: process.env.ADMIN_WEB_ORIGIN ?? "http://localhost:5173",
    databaseUrl: process.env.DATABASE_URL,
    useMockData: boolFromEnv("USE_MOCK_DATA", !process.env.DATABASE_URL),
    mediaStorageDriver:
      process.env.MEDIA_STORAGE_DRIVER === "s3" ? "s3" : "local",
    mediaUploadDir: process.env.MEDIA_UPLOAD_DIR,
    s3Endpoint: process.env.S3_ENDPOINT,
    s3Region: process.env.S3_REGION ?? "us-east-1",
    s3Bucket: process.env.S3_BUCKET,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3ForcePathStyle: boolFromEnv("S3_FORCE_PATH_STYLE", true),
    authSecret,
    appUserAuthSecret,
    debugMemberAuthBypass:
      nodeEnv !== "production" &&
      boolFromEnv("DEBUG_MEMBER_AUTH_BYPASS", true),
    debugMemberAccessToken:
      blankToUndefined(process.env.DEBUG_MEMBER_ACCESS_TOKEN) ??
      "mbc-debug-member-access",
    debugMemberEmail:
      blankToUndefined(process.env.DEBUG_MEMBER_EMAIL) ??
      "debug.member@mbc.local",
    debugMemberDisplayName:
      blankToUndefined(process.env.DEBUG_MEMBER_DISPLAY_NAME) ??
      "Debug Member",
    devAdminEmail: process.env.DEV_ADMIN_EMAIL ?? "admin@mbc.local",
    devAdminPassword,
    bootstrapDevAdmin,
    fcmServiceAccountJson: process.env.FCM_SERVICE_ACCOUNT_JSON,
    firebaseServiceAccountJson:
      blankToUndefined(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ??
      blankToUndefined(process.env.FCM_SERVICE_ACCOUNT_JSON),
    memberAuthRateLimitWindowMs: numberFromEnv(
      "MEMBER_AUTH_RATE_LIMIT_WINDOW_MS",
      60000
    ),
    memberAuthRateLimitPerWindow: numberFromEnv(
      "MEMBER_AUTH_RATE_LIMIT_PER_WINDOW",
      10
    ),
    fcmHttpTimeoutMs: numberFromEnv("FCM_HTTP_TIMEOUT_MS", 10000),
    notificationRetrySchedulerEnabled: boolFromEnv(
      "NOTIFICATION_RETRY_SCHEDULER_ENABLED",
      false
    ),
    notificationRetrySchedulerIntervalMs: numberFromEnv(
      "NOTIFICATION_RETRY_SCHEDULER_INTERVAL_MS",
      60000
    ),
    notificationRetrySchedulerBatchSize: numberFromEnv(
      "NOTIFICATION_RETRY_SCHEDULER_BATCH_SIZE",
      20
    ),
    aiProvider: aiProviderFromEnv(),
    aiApiKey: blankToUndefined(process.env.AI_API_KEY),
    aiBaseUrl: blankToUndefined(process.env.AI_BASE_URL),
    aiModel: blankToUndefined(process.env.AI_MODEL),
    aiTimeoutMs: numberFromEnv("AI_TIMEOUT_MS", 30000),
    aiMaxOutputTokens: numberFromEnv("AI_MAX_OUTPUT_TOKENS", 1200),
    aiAuditEnabled: boolFromEnv("AI_AUDIT_ENABLED", true),
    aiExtraHeaders: jsonRecordFromEnv("AI_EXTRA_HEADERS_JSON"),
    aiRateLimitWindowMs: numberFromEnv("AI_RATE_LIMIT_WINDOW_MS", 60000),
    aiAdminRateLimitPerWindow: numberFromEnv(
      "AI_ADMIN_RATE_LIMIT_PER_WINDOW",
      20
    ),
    aiMemberRateLimitPerWindow: numberFromEnv(
      "AI_MEMBER_RATE_LIMIT_PER_WINDOW",
      10
    ),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeApiBaseUrl: process.env.STRIPE_API_BASE_URL ?? "https://api.stripe.com",
    givingCheckoutSuccessUrl:
      process.env.GIVING_CHECKOUT_SUCCESS_URL ??
      "mbcwalkwith://mine/giving?checkout=success",
    givingCheckoutCancelUrl:
      process.env.GIVING_CHECKOUT_CANCEL_URL ??
      "mbcwalkwith://mine/giving?checkout=cancel",
    memberEmailProvider:
      process.env.MEMBER_EMAIL_PROVIDER === "resend" ? "resend" : "disabled",
    memberEmailResendApiKey: blankToUndefined(process.env.RESEND_API_KEY),
    memberEmailFrom: blankToUndefined(process.env.MEMBER_EMAIL_FROM),
    memberEmailReplyTo: blankToUndefined(process.env.MEMBER_EMAIL_REPLY_TO),
    memberEmailHttpTimeoutMs: numberFromEnv("MEMBER_EMAIL_HTTP_TIMEOUT_MS", 10000)
  };
  validateProductionConfig(config);
  return config;
}

function trustProxyFromEnv(nodeEnv: string): false | string[] {
  if (nodeEnv !== "production") {
    return false;
  }

  const configured = process.env.TRUST_PROXY?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return configured?.length ? configured : ["127.0.0.1"];
}

function validateProductionConfig(config: AppConfig): void {
  if (config.nodeEnv !== "production") {
    return;
  }
  if (!config.databaseUrl || config.useMockData) {
    throw new Error(
      "DATABASE_URL must be set and USE_MOCK_DATA must be false in production."
    );
  }
  assertProductionSecret("auth_secret", config.authSecret);
  assertProductionSecret("app_user_auth_secret", config.appUserAuthSecret);
  if (config.authSecret === config.appUserAuthSecret) {
    throw new Error(
      "auth_secret and app_user_auth_secret must be separate production secrets."
    );
  }
  if (config.bootstrapDevAdmin) {
    assertProductionAdminPassword(config.devAdminPassword);
  }
}

function assertProductionSecret(key: string, value: string): void {
  if (
    value === devOnlySecret ||
    productionPlaceholderValues.has(value) ||
    value.trim().length < 32
  ) {
    throw new Error(`${key} must be a rotated production secret.`);
  }
}

function assertProductionAdminPassword(value: string): void {
  if (
    value === devOnlyAdminPassword ||
    productionPlaceholderValues.has(value) ||
    value.trim().length < 12
  ) {
    throw new Error(
      "DEV_ADMIN_PASSWORD must be rotated before bootstrapping production admin."
    );
  }
}

function aiProviderFromEnv(): AppConfig["aiProvider"] {
  const provider = process.env.AI_PROVIDER?.trim();
  if (
    provider === "openai" ||
    provider === "gemini" ||
    provider === "openai_compatible"
  ) {
    return provider;
  }
  return "disabled";
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function jsonRecordFromEnv(key: string): Record<string, string> {
  const value = process.env[key]?.trim();
  if (!value) {
    return {};
  }
  const parsed = JSON.parse(value) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}

function numberFromEnv(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolFromEnv(key: string, fallback: boolean): boolean {
  const value = process.env[key];
  if (!value) {
    return fallback;
  }
  return value === "true" || value === "1";
}
