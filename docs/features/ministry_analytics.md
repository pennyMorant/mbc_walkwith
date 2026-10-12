# Ministry Analytics

状态：可信实时聚合、角色过滤和 stale snapshot 恢复第一版已接入；趋势和导出待后续阶段

## Feature Goal

让管理员在 Dashboard 查看待处理事项、系统健康、内容状态、活动参与、奉献概览和聚合运营数据。

## Non-Goals

- 不展示普通用户个人敏感明细。
- 不替代财务对账 source of truth。
- 不把统计缓存作为业务最终状态。

## Owners

- Product owner：教会管理员。
- Backend owner：analytics service。
- Surface owners：Admin Dashboard。

## Source Of Truth

指标来自各 feature 的 canonical repository。analytics snapshot 是派生数据，可重算。

## State Model

- API snapshot：`fresh`、`stale`
- Admin query：`pending`、`success`、`error`
- alert：`open`、`acknowledged`、`resolved`

## Capability Contracts

- `data_export` 用于统计导出。

## App Surface Boundary

移动 App 不展示后台运营看板。

## Admin Web Surface Boundary

后台 Dashboard 第一版展示：

- 讲道草稿、发布和审核队列。
- 生活内容和未取消的活动报名人数。
- 代祷审核队列。
- 当前年度奉献金额和成功笔数。
- 任务健康。
- 按权限过滤的指标、运营关注点和事工工作区入口。
- fresh/stale 快照状态、最近成功时间和最近刷新尝试时间。

趋势和统计导出后续接入。

## Backend Service Boundary

`MinistryAnalyticsService` 负责：

- 从 sermon、life、prayer、jobs 和 giving service 读取精确聚合值。
- 在调用 repository 前按管理员角色权限过滤数据源。
- 按角色保存当前进程内最后一次成功快照。
- 刷新失败时返回同角色 stale snapshot；不存在成功快照时返回结构化失败。
- 聚合失败写结构化 warning 日志，但不记录祷告、奉献或个人明细。
- 奉献年度必须按 `church.timezone` 计算，不能按 VPS/UTC 日历年推算。

各 feature repository 拥有自己的精确 count/summary 查询。Route 只验证
`dashboard:read` 并把管理员角色交给 service。持久化定时快照、趋势和导出后续接入。

## Side Effects

- 实时统计快照生成。
- 当前进程内按角色保存最后成功快照。

统计导出和导出审计尚未接入。

## Lifecycle And Recovery

打开 Dashboard 或点击刷新会实时重建快照。刷新失败时保留同一角色最后一次成功
快照，并显示 stale、最近成功时间和最近尝试时间。进程重启后没有历史快照；此时
聚合失败必须返回 `analytics_build_failed`，不能伪造全零成功。

Admin Web 刷新请求失败但已有成功数据时，必须保留当前快照并同时显示错误，不能因 transport 错误把整张看板隐藏。

## Error Model

- `analytics_build_failed`
- `admin_permission_denied`

`analytics_export_failed` 留给后续统计导出阶段。

## Main Logic Chain

管理员打开 Dashboard -> 后端验证 `dashboard:read` -> analytics service 按角色过滤
可读数据源 -> canonical repository 执行不受列表 limit 影响的 count/summary -> service
生成 fresh snapshot -> Admin 按 locale 格式化指标 -> 管理员从有权限的指标或工作区入口
drill-down 到具体 feature 页面。

## Failure Chains

- 聚合失败且已有同角色快照时展示 stale 和最近刷新尝试。
- 聚合失败且没有成功快照时返回可重试的 `analytics_build_failed`。
- 缺少业务权限时不调用对应 service，也不返回该指标、任务面板或运营提示。
- finance 角色只读取和显示 giving 指标。

## Verification Checklist

- 指标为聚合数据，不泄露个人敏感内容。
- 指标使用精确 count/summary，不通过 `limit: 100` 列表长度推算。
- 财务指标与 giving source of truth 一致。
- stale 状态可见。
- route、service 和 repository owner 分离。
- Admin 四种语言都有指标和 stale 状态文案。
- 后续导出必须增加权限和审计后才能启用。

## Related Docs

- [../domains/analytics_metrics.md](../domains/analytics_metrics.md)
- [../domains/privacy.md](../domains/privacy.md)
- [../domains/giving_finance.md](../domains/giving_finance.md)
- [../capabilities/data_export.md](../capabilities/data_export.md)
