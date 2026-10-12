import { memberAuthRateLimitExceeded } from "./member-auth-errors.js";

export type MemberAuthRateLimitAction =
  | "register"
  | "login"
  | "firebase"
  | "password_reset_request"
  | "password_reset_confirm"
  | "verify_code";

type MemberAuthRateLimiterOptions = {
  windowMs: number;
  limit: number;
};

type RateLimitBucket = {
  count: number;
  resetAtMs: number;
};

export type MemberAuthRateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
};

export class MemberAuthRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private lastPrunedAtMs = 0;

  constructor(private readonly options: MemberAuthRateLimiterOptions) {}

  check(
    action: MemberAuthRateLimitAction,
    clientKey: string,
    nowMs = Date.now()
  ): MemberAuthRateLimitDecision {
    const { limit, windowMs } = this.options;
    if (limit <= 0 || windowMs <= 0) {
      return unlimitedDecision(nowMs, Math.max(windowMs, 0));
    }

    this.pruneExpiredBuckets(nowMs, windowMs);
    const key = `${action}:${clientKey}`;
    const bucket = this.currentBucket(key, nowMs, windowMs);
    if (bucket.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: new Date(bucket.resetAtMs).toISOString(),
        retryAfterSeconds: retryAfterSeconds(bucket.resetAtMs, nowMs)
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - bucket.count, 0),
      resetAt: new Date(bucket.resetAtMs).toISOString(),
      retryAfterSeconds: 0
    };
  }

  private currentBucket(key: string, nowMs: number, windowMs: number) {
    const existing = this.buckets.get(key);
    if (existing && existing.resetAtMs > nowMs) return existing;

    const bucket = { count: 0, resetAtMs: nowMs + windowMs };
    this.buckets.set(key, bucket);
    return bucket;
  }

  private pruneExpiredBuckets(nowMs: number, windowMs: number) {
    if (nowMs - this.lastPrunedAtMs < windowMs) return;
    this.lastPrunedAtMs = nowMs;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAtMs <= nowMs) this.buckets.delete(key);
    }
  }
}

export function enforceMemberAuthRateLimit(
  reply: { header(name: string, value: string): unknown },
  decision: MemberAuthRateLimitDecision,
  action: MemberAuthRateLimitAction
) {
  if (decision.limit > 0) {
    reply.header("x-ratelimit-limit", String(decision.limit));
    reply.header("x-ratelimit-remaining", String(decision.remaining));
    reply.header("x-ratelimit-reset", decision.resetAt);
  }
  if (!decision.allowed) {
    reply.header("retry-after", String(decision.retryAfterSeconds));
    throw memberAuthRateLimitExceeded({ action, ...decision });
  }
}

function unlimitedDecision(
  nowMs: number,
  windowMs: number
): MemberAuthRateLimitDecision {
  return {
    allowed: true,
    limit: 0,
    remaining: Number.MAX_SAFE_INTEGER,
    resetAt: new Date(nowMs + windowMs).toISOString(),
    retryAfterSeconds: 0
  };
}

function retryAfterSeconds(resetAtMs: number, nowMs: number) {
  return Math.max(Math.ceil((resetAtMs - nowMs) / 1000), 1);
}
