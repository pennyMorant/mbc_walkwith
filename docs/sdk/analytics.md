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
- `actionItems[]`：从非零 canonical 指标生成的待处理入口。
- `recentContent[]`：按权限过滤的讲道和生活内容最近更新投影。
- `health[]`：任务健康状态及对应 drill-down。

Admin helper `apps/admin_web/src/core/api/dashboard.ts` 必须通过 shared schema 解析。
Admin 页面不能根据角色自行补造后端未返回的指标。

`GET /v1/admin/search` 使用 `adminSearchQuerySchema` 和
`adminSearchResponseSchema`。`apps/admin_web/src/core/api/admin_search.ts` 只提交查询词；
后端按角色决定是否查询 sermon、life post 和 member owner。前端可以把返回结果与
本地共享导航 registry 合并，但不能自行跨 Feature 请求并拼接业务数据。

当前年度财务指标由后端按 `church.timezone` 计算。Admin refetch transport 失败但
query cache 仍有成功数据时，应保留当前 snapshot 并显示错误，不能用 error 分支隐藏
已有指标。

当前 Dashboard 是实时聚合，后端按角色保留进程内最后成功快照。趋势、持久化定时
快照和统计导出尚未接入。

## Related Features

- [../features/ministry_analytics.md](../features/ministry_analytics.md)
- [../domains/analytics_metrics.md](../domains/analytics_metrics.md)
- [../capabilities/data_export.md](../capabilities/data_export.md)
