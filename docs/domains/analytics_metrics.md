# Analytics Metrics

状态：可信实时指标和进程内 stale snapshot 第一版已接入

## Purpose

定义后台数据看板的聚合指标口径、隐私边界和 stale snapshot 规则。

## Source Of Truth

指标来自各 feature 的 canonical repository。analytics snapshot 是派生缓存，可重建。

## Core Concepts

- `metric`：聚合指标。
- `snapshot`：一次指标计算结果。
- `stale_snapshot`：已经过期但可展示的最后成功结果。
- `drill_down`：跳转到源 feature 的受权限保护列表。

## Rules

- 看板默认展示聚合数据。
- 财务和关怀指标必须按权限过滤。
- 权限过滤必须发生在调用业务 service/repository 前，不能只在 Admin Web 隐藏卡片。
- 指标 count/summary 必须由 canonical repository 精确计算，不能使用受 limit 约束的列表长度。
- snapshot 失败时保留最后成功结果并标记 stale。
- 当前年度财务指标按 `church.timezone` 设置切分，不使用服务器或 UTC 日历年。
- `church.timezone` 写入时必须由后端验证为有效 IANA timezone，不能只依赖 Admin 下拉选项。
- 导出和 drill-down 必须审计。

当前 `MinistryAnalyticsService` 按管理员角色保存进程内最后成功快照。进程重启后若
第一次聚合失败，API 返回 `analytics_build_failed`。持久化定时快照和趋势尚未接入。

## Used By

- ministry analytics。
- giving funds。
- event attendance。
- course learning。
- serving schedule。
