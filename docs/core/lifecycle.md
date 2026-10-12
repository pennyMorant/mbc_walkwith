# Lifecycle

状态：可恢复生命周期契约

长任务和可恢复行为必须有唯一 lifecycle owner。UI 可以触发动作和展示状态，但不能拥有持久生命周期工作。

## 1. Lifecycle Actions

每个 lifecycle owner 至少定义：

- start。
- stop。
- pause。
- resume。
- retry。
- cancel。
- recover。
- dispose。
- timeout。
- stale cleanup。

## 2. Ownership Examples

- Bible TTS：App TTS service/controller。
- 讲道播放：App player service/controller。
- 讲道转录、大纲、经文引用：local sermon workstation。
- 年度证明生成：backend statement service。
- Stripe webhook：backend giving service。
- 通知投递：backend notification service。
- 活动报名状态：backend event service。

## 3. State Requirements

生命周期状态必须能表达：

- not started。
- running。
- paused。
- pending external event。
- succeeded。
- failed recoverable。
- failed terminal。
- canceled。
- stale。

状态必须由 owner 写入，surface 只能读取和展示。

## 4. Recovery Rule

恢复路径必须说明：

- 谁能重试。
- 重试是否幂等。
- timeout 后如何处理。
- stale job 如何清理。
- 用户或管理员看到什么。
- 是否写审计。

## 5. Backend Job Diagnostic Contract

Backend job records are diagnostic history. New sermon media processing runs on
the local workstation. Current backend code may list historical jobs, show
stats, update diagnostic status, and cancel queued/running historical jobs, but
it must not create or retry sermon processing jobs.

Historical job records may keep:

- `status`
- `errorMessage`
- `result`
- `jobId`
- `jobType`
- `resourceType`
- `resourceId`
- `attempt`
- `maxAttempts`

For sermon processing failures, the recovery path is to fix the local
workstation output and upload a reviewed local package, not to requeue backend
processing.

## 6. Backend Job Action Guards

Backend service 必须守住 job diagnostic action，不允许 surface 直接决定状态迁移：

- `cancel`：只能作用于 `queued` 或 `running` job；对已 `canceled` job 保持幂等返回。
- 对 `succeeded`、`failed`、`canceled` 等不合法状态执行动作时，返回结构化 `state_conflict` 错误。
