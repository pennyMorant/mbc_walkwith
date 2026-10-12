import { aiRateLimitExceeded } from "./ai-errors.js";

export type AiRateLimitScope = "admin" | "member";

export type AiRateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
};

type AiRateLimiterOptions = {
  windowMs: number;
  adminLimit: number;
  memberLimit: number;
};

type RateLimitBucket = {
  count: number;
  resetAtMs: number;
};

export class AiRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private lastPrunedAtMs = 0;

  constructor(private readonly options: AiRateLimiterOptions) {}

  check(
    scope: AiRateLimitScope,
    actorId: string,
    nowMs = Date.now()
  ): AiRateLimitDecision {
    const limit =
      scope === "admin" ? this.options.adminLimit : this.options.memberLimit;
    const windowMs = this.options.windowMs;

    if (limit <= 0 || windowMs <= 0) {
      return unlimitedDecision(nowMs, Math.max(windowMs, 0));
    }

    this.pruneExpiredBuckets(nowMs, windowMs);

    const key = `${scope}:${actorId}`;
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

  private currentBucket(
    key: string,
    nowMs: number,
    windowMs: number
  ): RateLimitBucket {
    const existing = this.buckets.get(key);
    if (existing && existing.resetAtMs > nowMs) {
      return existing;
    }

    const bucket = {
      count: 0,
      resetAtMs: nowMs + windowMs
    };
    this.buckets.set(key, bucket);
    return bucket;
  }

  private pruneExpiredBuckets(nowMs: number, windowMs: number) {
    if (nowMs - this.lastPrunedAtMs < windowMs) {
      return;
    }

    this.lastPrunedAtMs = nowMs;
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAtMs <= nowMs) {
        this.buckets.delete(key);
      }
    }
  }

  bucketCountForTest(): number {
    return this.buckets.size;
  }
}

export function enforceAiRateLimit(
  reply: { header(name: string, value: string): unknown },
  decision: AiRateLimitDecision,
  scope: AiRateLimitScope
) {
  if (decision.limit > 0) {
    reply.header("x-ratelimit-limit", String(decision.limit));
    reply.header("x-ratelimit-remaining", String(decision.remaining));
    reply.header("x-ratelimit-reset", decision.resetAt);
  }
  if (!decision.allowed) {
    reply.header("retry-after", String(decision.retryAfterSeconds));
    throw aiRateLimitExceeded({ scope, ...decision });
  }
}

function unlimitedDecision(nowMs: number, windowMs: number): AiRateLimitDecision {
  return {
    allowed: true,
    limit: 0,
    remaining: Number.MAX_SAFE_INTEGER,
    resetAt: new Date(nowMs + windowMs).toISOString(),
    retryAfterSeconds: 0
  };
}

function retryAfterSeconds(resetAtMs: number, nowMs: number): number {
  return Math.max(Math.ceil((resetAtMs - nowMs) / 1000), 1);
}
