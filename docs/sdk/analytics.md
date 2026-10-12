# Analytics SDK

状态：Admin Dashboard typed contract、角色过滤和 stale snapshot 第一版已接入

This document covers admin dashboard analytics, stale snapshots, exports, and drill-down boundaries.

## Admin Areas

- Dashboard summary cards.
- System health panels.
- Pending work queues.
- Aggregated ministry metrics.
- Export and drill-down intents.

## Rules

- Analytics SDK is admin-only.
- Snapshot freshness must be visible in DTOs.
- Drill-down requests must use feature-specific API helpers when showing underlying rows.
- Financial, care, and member metrics require backend permission filtering.

## Current Contract

`GET /v1/admin/dashboard` 使用 `adminDashboardResponseSchema`，返回：

- `snapshot.status`：`fresh` 或 `stale`。
- `snapshot.generatedAt`：当前展示指标最近一次成功生成时间。
- `snapshot.attemptedAt`：最近一次刷新尝试时间。
- `snapshot.errorCode`：fresh 为 `null`；stale 第一版为
  `analytics_build_failed`。
- `metrics[]`：稳定 `id`、本地化 `labelKey`、整数 `value`、tone、
  `count/currency` format、可选 currency 和受权限保护的 drill-down path。
- `jobs`：仅有 `jobs:read` 时返回，否则为 `null`。

Admin helper `apps/admin_web/src/core/api/dashboard.ts` 必须通过 shared schema 解析。
Admin 页面不能根据角色自行补造后端未返回的指标。

当前年度财务指标由后端按 `church.timezone` 计算。Admin refetch transport 失败但
query cache 仍有成功数据时，应保留当前 snapshot 并显示错误，不能用 error 分支隐藏
已有指标。

当前 Dashboard 是实时聚合，后端按角色保留进程内最后成功快照。趋势、持久化定时
快照和统计导出尚未接入。

## Related Features

- [../features/ministry_analytics.md](../features/ministry_analytics.md)
- [../domains/analytics_metrics.md](../domains/analytics_metrics.md)
- [../capabilities/data_export.md](../capabilities/data_export.md)
