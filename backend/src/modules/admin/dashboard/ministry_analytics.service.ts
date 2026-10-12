import type {
  AdminDashboardResponse,
  AdminRole,
  DashboardMetric
} from "@mbc/api-contracts";

import { appError } from "../../../shared/http/app-error.js";
import type { GivingService } from "../../giving/giving.service.js";
import type { JobService } from "../../jobs/job.service.js";
import type { LifePostService } from "../../life/life-post.service.js";
import type { PrayerService } from "../../prayer/prayer.service.js";
import type { SermonService } from "../../sermons/sermon.service.js";
import type { SettingsService } from "../../settings/settings.service.js";
import { roleHasPermission } from "../auth/admin-rbac.js";

type MinistryAnalyticsDependencies = {
  sermons: Pick<SermonService, "countByStatus">;
  lifePosts: Pick<
    LifePostService,
    "countPosts" | "summarizeEventParticipation"
  >;
  prayers: Pick<PrayerService, "countAdminByStatus">;
  jobs: Pick<JobService, "stats">;
  giving: Pick<GivingService, "summarizeTransactions">;
  settings: Pick<SettingsService, "getByKey">;
  now?: () => Date;
  onBuildFailure?: (
    error: unknown,
    context: { role: AdminRole; attemptedAt: string; hasSnapshot: boolean }
  ) => void;
};

export class MinistryAnalyticsService {
  private readonly snapshots = new Map<AdminRole, AdminDashboardResponse>();
  private readonly now: () => Date;

  constructor(private readonly dependencies: MinistryAnalyticsDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  async dashboard(role: AdminRole): Promise<AdminDashboardResponse> {
    const attemptedAt = this.now().toISOString();
    try {
      const response = await this.buildDashboard(role, attemptedAt);
      this.snapshots.set(role, response);
      return response;
    } catch (error) {
      const snapshot = this.snapshots.get(role);
      this.dependencies.onBuildFailure?.(error, {
        role,
        attemptedAt,
        hasSnapshot: Boolean(snapshot)
      });
      if (snapshot) {
        return {
          ...snapshot,
          snapshot: {
            status: "stale",
            generatedAt: snapshot.snapshot.generatedAt,
            attemptedAt,
            errorCode: "analytics_build_failed"
          }
        };
      }
      throw appError({
        code: "analytics_build_failed",
        category: "dependency_failure",
        sourceLayer: "feature",
        statusCode: 503,
        message: "Dashboard analytics could not be built.",
        recoverable: true,
        retryable: true,
        evidence: { attemptedAt },
        nextAction: "retry"
      });
    }
  }

  private async buildDashboard(
    role: AdminRole,
    generatedAt: string
  ): Promise<AdminDashboardResponse> {
    const [sermonMetrics, lifeMetrics, prayerMetrics, jobMetrics, givingMetrics] =
      await Promise.all([
        this.sermonMetrics(role),
        this.lifeMetrics(role),
        this.prayerMetrics(role),
        this.jobMetrics(role),
        this.givingMetrics(role, new Date(generatedAt))
      ]);

    return {
      snapshot: {
        status: "fresh",
        generatedAt,
        attemptedAt: generatedAt,
        errorCode: null
      },
      metrics: [
        ...sermonMetrics,
        ...lifeMetrics,
        ...prayerMetrics,
        ...givingMetrics,
        ...(jobMetrics
          ? [
              metric(
                "failed_jobs",
                "dashboard.metric.failedJobs",
                jobMetrics.failed,
                jobMetrics.failed > 0 ? "error" : "success",
                "/jobs"
              )
            ]
          : [])
      ],
      jobs: jobMetrics
    };
  }

  private async sermonMetrics(role: AdminRole): Promise<DashboardMetric[]> {
    if (!roleHasPermission(role, "sermons:read")) {
      return [];
    }
    const [draft, published, review] = await Promise.all([
      this.dependencies.sermons.countByStatus("draft"),
      this.dependencies.sermons.countByStatus("published"),
      this.dependencies.sermons.countByStatus("needs_review")
    ]);
    return [
      metric(
        "draft_sermons",
        "dashboard.metric.draftSermons",
        draft,
        "primary",
        "/sermons"
      ),
      metric(
        "published_sermons",
        "dashboard.metric.publishedSermons",
        published,
        "success",
        "/sermons"
      ),
      metric(
        "review_queue",
        "dashboard.metric.reviewQueue",
        review,
        "warning",
        "/sermons"
      )
    ];
  }

  private async lifeMetrics(role: AdminRole): Promise<DashboardMetric[]> {
    if (!roleHasPermission(role, "life_posts:read")) {
      return [];
    }
    const [posts, participation] = await Promise.all([
      this.dependencies.lifePosts.countPosts(),
      this.dependencies.lifePosts.summarizeEventParticipation()
    ]);
    return [
      metric(
        "life_posts",
        "dashboard.metric.lifePosts",
        posts,
        "secondary",
        "/life-posts"
      ),
      metric(
        "event_registrants",
        "dashboard.metric.eventRegistrants",
        participation.attendeeCount,
        "info",
        "/life-posts"
      )
    ];
  }

  private async prayerMetrics(role: AdminRole): Promise<DashboardMetric[]> {
    if (!roleHasPermission(role, "prayer:read")) {
      return [];
    }
    const pending = await this.dependencies.prayers.countAdminByStatus("pending");
    return [
      metric(
        "pending_prayers",
        "dashboard.metric.pendingPrayers",
        pending,
        pending > 0 ? "warning" : "success",
        "/prayer"
      )
    ];
  }

  private async jobMetrics(role: AdminRole) {
    if (!roleHasPermission(role, "jobs:read")) {
      return null;
    }
    const stats = await this.dependencies.jobs.stats();
    return {
      queued: stats.byStatus.queued,
      running: stats.byStatus.running,
      failed: stats.byStatus.failed
    };
  }

  private async givingMetrics(
    role: AdminRole,
    generatedAt: Date
  ): Promise<DashboardMetric[]> {
    if (!roleHasPermission(role, "giving:read")) {
      return [];
    }
    const timeZoneSetting = await this.dependencies.settings.getByKey(
      "church.timezone"
    );
    const year = reportingYear(generatedAt, timeZoneSetting?.value);
    const summary = await this.dependencies.giving.summarizeTransactions({
      year,
      status: "succeeded",
      limit: 1
    });
    return [
      metric(
        "giving_year_total",
        "dashboard.metric.givingYearTotal",
        summary.totalAmountCents,
        "success",
        "/giving",
        "currency",
        summary.currency
      ),
      metric(
        "giving_transaction_count",
        "dashboard.metric.givingTransactions",
        summary.transactionCount,
        "primary",
        "/giving"
      )
    ];
  }
}

function reportingYear(generatedAt: Date, timeZoneValue: unknown) {
  if (typeof timeZoneValue !== "string" || !timeZoneValue.trim()) {
    throw new Error("Church reporting timezone is not configured.");
  }
  const year = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timeZoneValue.trim(),
      year: "numeric"
    }).format(generatedAt)
  );
  if (!Number.isInteger(year)) {
    throw new Error("Church reporting timezone produced an invalid year.");
  }
  return year;
}

function metric(
  id: string,
  labelKey: string,
  value: number,
  tone: DashboardMetric["tone"],
  path: string,
  format: DashboardMetric["format"] = "count",
  currency: string | null = null
): DashboardMetric {
  return { id, labelKey, value, tone, format, currency, path };
}
