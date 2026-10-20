import type {
  AdminDashboardResponse,
  DashboardActionItem,
  DashboardHealthItem,
  DashboardMetric,
  DashboardRecentContent
} from "@mbc/api-contracts";
import type { LifePostSummary } from "../../life/life-post.repository.js";
import type { SermonSummary } from "../../sermons/sermon.repository.js";

const actionMetricDefinitions: Record<
  string,
  Pick<DashboardActionItem, "labelKey" | "summaryKey">
> = {
  review_queue: {
    labelKey: "dashboard.action.reviewSermons",
    summaryKey: "dashboard.action.reviewSermonsSummary"
  },
  life_review_queue: {
    labelKey: "dashboard.action.reviewLifePosts",
    summaryKey: "dashboard.action.reviewLifePostsSummary"
  },
  pending_prayers: {
    labelKey: "dashboard.action.reviewPrayers",
    summaryKey: "dashboard.action.reviewPrayersSummary"
  },
  failed_jobs: {
    labelKey: "dashboard.action.failedJobs",
    summaryKey: "dashboard.action.failedJobsSummary"
  }
};

export function buildDashboardActionItems(
  metrics: DashboardMetric[]
): DashboardActionItem[] {
  return metrics.flatMap((metric) => {
    const definition = actionMetricDefinitions[metric.id];
    if (!definition || metric.value === 0 || !metric.path) return [];
    return [
      {
        id: metric.id,
        ...definition,
        count: metric.value,
        tone: metric.tone,
        path: metric.path
      }
    ];
  });
}

export function buildDashboardHealthItems(
  jobs: AdminDashboardResponse["jobs"]
): DashboardHealthItem[] {
  if (!jobs) return [];
  return [
    {
      id: "active_jobs",
      labelKey: "dashboard.health.activeJobs",
      status: jobs.queued + jobs.running > 0 ? "warning" : "healthy",
      value: jobs.queued + jobs.running,
      path: "/jobs"
    },
    {
      id: "failed_jobs",
      labelKey: "dashboard.health.failedJobs",
      status: jobs.failed > 0 ? "error" : "healthy",
      value: jobs.failed,
      path: "/jobs"
    }
  ];
}

export function mergeRecentDashboardContent(
  sermons: SermonSummary[],
  lifePosts: LifePostSummary[],
  limit: number
): DashboardRecentContent[] {
  return [
    ...sermons.map((sermon) => ({
      id: sermon.id,
      resourceType: "sermon" as const,
      title: sermon.title,
      status: sermon.status,
      sourceLocale: sermon.sourceLocale,
      updatedAt: sermon.updatedAt,
      path: resourcePath("/sermons", sermon.id)
    })),
    ...lifePosts.map((post) => ({
      id: post.id,
      resourceType: "life_post" as const,
      title: post.title,
      status: post.status,
      sourceLocale: post.sourceLocale,
      updatedAt: post.updatedAt,
      path: resourcePath("/life-posts", post.id)
    }))
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

function resourcePath(basePath: string, resourceId: string) {
  return `${basePath}?open=${encodeURIComponent(resourceId)}`;
}
