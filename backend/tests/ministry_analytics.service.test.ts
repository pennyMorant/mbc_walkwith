import type { AdminRole } from "@mbc/api-contracts";
import { describe, expect, it, vi } from "vitest";

import { MinistryAnalyticsService } from "../src/modules/admin/dashboard/ministry_analytics.service.js";

describe("MinistryAnalyticsService", () => {
  it("builds exact owner metrics without list-limit truncation", async () => {
    const dependencies = fakeDependencies();
    const service = new MinistryAnalyticsService(dependencies);

    const dashboard = await service.dashboard("owner");
    const values = Object.fromEntries(
      dashboard.metrics.map((metric) => [metric.id, metric.value])
    );

    expect(dashboard.snapshot.status).toBe("fresh");
    expect(values).toMatchObject({
      draft_sermons: 145,
      published_sermons: 213,
      review_queue: 37,
      life_posts: 168,
      event_registrants: 284,
      pending_prayers: 126,
      failed_jobs: 8,
      giving_year_total: 987654,
      giving_transaction_count: 132
    });
    expect(dashboard.jobs).toEqual({ queued: 11, running: 3, failed: 8 });
    expect(dependencies.giving.summarizeTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2026 })
    );
  });

  it("reads and returns only metrics allowed for a finance role", async () => {
    const dependencies = fakeDependencies();
    const service = new MinistryAnalyticsService(dependencies);

    const dashboard = await service.dashboard("finance");

    expect(dashboard.metrics.map((metric) => metric.id)).toEqual([
      "giving_year_total",
      "giving_transaction_count"
    ]);
    expect(dashboard.jobs).toBeNull();
    expect(dependencies.sermons.countByStatus).not.toHaveBeenCalled();
    expect(dependencies.lifePosts.countPosts).not.toHaveBeenCalled();
    expect(
      dependencies.lifePosts.summarizeEventParticipation
    ).not.toHaveBeenCalled();
    expect(dependencies.prayers.countAdminByStatus).not.toHaveBeenCalled();
    expect(dependencies.jobs.stats).not.toHaveBeenCalled();
    expect(dependencies.giving.summarizeTransactions).toHaveBeenCalledOnce();
    expect(dependencies.settings.getByKey).toHaveBeenCalledWith(
      "church.timezone"
    );
  });

  it("uses the church reporting timezone at a UTC year boundary", async () => {
    const dependencies = fakeDependencies({
      now: () => new Date("2027-01-01T02:00:00.000Z"),
      churchTimezone: "America/Los_Angeles"
    });
    const service = new MinistryAnalyticsService(dependencies);

    await service.dashboard("finance");

    expect(dependencies.giving.summarizeTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2026 })
    );
  });

  it("does not read reporting settings without giving permission", async () => {
    const dependencies = fakeDependencies();
    const service = new MinistryAnalyticsService(dependencies);

    const dashboard = await service.dashboard("admin");

    expect(
      dashboard.metrics.some((metric) => metric.id.startsWith("giving_"))
    ).toBe(false);
    expect(dependencies.settings.getByKey).not.toHaveBeenCalled();
    expect(dependencies.giving.summarizeTransactions).not.toHaveBeenCalled();
  });

  it("fails explicitly when the church reporting timezone is invalid", async () => {
    const service = new MinistryAnalyticsService(
      fakeDependencies({ churchTimezone: "Not/A_Timezone" })
    );

    await expect(service.dashboard("finance")).rejects.toMatchObject({
      code: "analytics_build_failed",
      category: "dependency_failure",
      sourceLayer: "feature",
      retryable: true
    });
  });

  it("returns the last successful role snapshot as stale after a failure", async () => {
    let fail = false;
    const onBuildFailure = vi.fn();
    const dependencies = fakeDependencies({
      countDraftSermons: async () => {
        if (fail) {
          throw new Error("sermon repository unavailable");
        }
        return 145;
      },
      now: sequenceClock(
        "2026-07-13T12:00:00.000Z",
        "2026-07-13T12:05:00.000Z"
      ),
      onBuildFailure
    });
    const service = new MinistryAnalyticsService(dependencies);
    const fresh = await service.dashboard("owner");

    fail = true;
    const stale = await service.dashboard("owner");

    expect(fresh.snapshot).toEqual({
      status: "fresh",
      generatedAt: "2026-07-13T12:00:00.000Z",
      attemptedAt: "2026-07-13T12:00:00.000Z",
      errorCode: null
    });
    expect(stale.snapshot).toEqual({
      status: "stale",
      generatedAt: "2026-07-13T12:00:00.000Z",
      attemptedAt: "2026-07-13T12:05:00.000Z",
      errorCode: "analytics_build_failed"
    });
    expect(stale.metrics).toEqual(fresh.metrics);
    expect(onBuildFailure).toHaveBeenCalledWith(expect.any(Error), {
      role: "owner",
      attemptedAt: "2026-07-13T12:05:00.000Z",
      hasSnapshot: true
    });
  });

  it("fails explicitly when no successful snapshot exists", async () => {
    const onBuildFailure = vi.fn();
    const dependencies = fakeDependencies({
      countDraftSermons: async () => {
        throw new Error("sermon repository unavailable");
      },
      onBuildFailure
    });
    const service = new MinistryAnalyticsService(dependencies);

    await expect(service.dashboard("owner")).rejects.toMatchObject({
      code: "analytics_build_failed",
      category: "dependency_failure",
      sourceLayer: "feature",
      statusCode: 503,
      recoverable: true,
      retryable: true,
      nextAction: "retry"
    });
    expect(onBuildFailure).toHaveBeenCalledWith(expect.any(Error), {
      role: "owner",
      attemptedAt: "2026-07-13T12:00:00.000Z",
      hasSnapshot: false
    });
  });
});

function fakeDependencies(options: {
  countDraftSermons?: () => Promise<number>;
  now?: () => Date;
  onBuildFailure?: (
    error: unknown,
    context: { role: AdminRole; attemptedAt: string; hasSnapshot: boolean }
  ) => void;
  churchTimezone?: string;
} = {}) {
  return {
    sermons: {
      countByStatus: vi.fn(async (status: string) => {
        if (status === "draft" && options.countDraftSermons) {
          return options.countDraftSermons();
        }
        return { draft: 145, published: 213, needs_review: 37 }[
          status as "draft" | "published" | "needs_review"
        ] ?? 0;
      })
    },
    lifePosts: {
      countPosts: vi.fn(async () => 168),
      summarizeEventParticipation: vi.fn(async () => ({
        registrationCount: 172,
        attendeeCount: 284,
        checkedInCount: 196
      }))
    },
    prayers: {
      countAdminByStatus: vi.fn(async () => 126)
    },
    jobs: {
      stats: vi.fn(async () => ({
        byStatus: {
          queued: 11,
          running: 3,
          succeeded: 91,
          failed: 8,
          canceled: 2
        },
        byType: {
          transcript_import: 0,
          outline_generation: 0,
          scripture_extraction: 0
        },
        retryableFailed: 5,
        exhaustedFailed: 3,
        recentFailures: [],
        recentRunning: [],
        recentSucceeded: []
      }))
    },
    giving: {
      summarizeTransactions: vi.fn(async () => ({
        year: 2026,
        totalAmountCents: 987654,
        totalFeeCents: 29000,
        totalNetAmountCents: 958654,
        refundedAmountCents: 0,
        disputedAmountCents: 0,
        transactionCount: 132,
        donorCount: 87,
        currency: "USD",
        byCategory: []
      }))
    },
    settings: {
      getByKey: vi.fn(async () => ({
        key: "church.timezone",
        category: "church",
        label: "Church timezone",
        description: "Default timezone for schedules and reporting.",
        value: options.churchTimezone ?? "America/Los_Angeles",
        updatedAt: "2026-05-01T18:00:00.000Z"
      }))
    },
    now: options.now ?? (() => new Date("2026-07-13T12:00:00.000Z")),
    onBuildFailure: options.onBuildFailure
  };
}

function sequenceClock(...values: string[]) {
  let index = 0;
  return () => new Date(values[Math.min(index++, values.length - 1)]!);
}
