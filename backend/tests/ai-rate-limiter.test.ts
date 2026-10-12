import { describe, expect, it } from "vitest";

import { AiRateLimiter } from "../src/modules/ai/ai-rate-limiter.js";

describe("AiRateLimiter", () => {
  it("prunes expired actor buckets during later checks", () => {
    const limiter = new AiRateLimiter({
      windowMs: 1000,
      adminLimit: 1,
      memberLimit: 1
    });

    expect(limiter.check("member", "member-a", 0).allowed).toBe(true);
    expect(limiter.bucketCountForTest()).toBe(1);

    expect(limiter.check("member", "member-b", 1001).allowed).toBe(true);

    expect(limiter.bucketCountForTest()).toBe(1);
  });

  it("keeps active buckets while pruning only expired buckets", () => {
    const limiter = new AiRateLimiter({
      windowMs: 1000,
      adminLimit: 2,
      memberLimit: 2
    });

    expect(limiter.check("member", "member-a", 500).allowed).toBe(true);
    expect(limiter.check("member", "member-b", 900).allowed).toBe(true);

    expect(limiter.check("member", "member-c", 1501).allowed).toBe(true);

    expect(limiter.bucketCountForTest()).toBe(2);
  });
});
