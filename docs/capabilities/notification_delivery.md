# Notification Delivery

状态：通知投递能力边界，audience、访客 public push、retry/cancel 已接入

## Purpose

封装推送通知、未来 email 或短信通知的投递能力。

## Owner

Backend notification service/scheduler。

## Contract

输入：

- recipient。
- audience：`public`、`members`、`member_specific`。
- preference key。
- notification type。
- localized payload。
- delivery channel。
- dedupe key。
- optional recipient user IDs。

输出：

- delivery status。
- provider result/evidence。
- retry state。

## Rules

- 通知失败不应随意回滚业务 source of truth。
- 高风险通知需要 dedupe。
- 设备 token 可以属于会员或访客；访客 token 只能接收 `public` audience。
- 会员 token 必须受会员通知偏好约束。
- 私密内容不得直接放进 push payload。
- 群发通知必须有权限和审计。
- delivery task 必须记录 attempts、状态、下一次重试时间和 provider evidence。
- delivery task 必须保存初始目标设备快照、当前待重试设备集合和带过期时间的内部 lease；lease 不得暴露为客户端 source of truth。
- delivery task 必须记录 audience、preference key 和指定 recipient user IDs。
- 业务发布动作不得因为 push provider 失败而回滚；失败进入 retry 或审计摘要。
- Life 发布通知的偏好键是 `lifePostPublished`，任务类型是 `life_post_published`。
- 周报通知的偏好键是 `weeklyBulletin`，任务类型是 `weekly_bulletin_published`。
- 祷告更新通知的偏好键是 `prayerUpdates`，任务类型是 `prayer_update_published`，payload 不得包含祷告正文；`public` 走公开受众，`members` 走会友受众，未解析出明确收件人的 `private`/`group` 不得群发。
- 单任务 retry 只能用于 failed/retrying 任务；cancel 只能用于 queued/retrying 任务。
- 业务触发、scheduler 与 Admin retry 必须先原子 claim，同一 task 同时最多一个 provider 调用。
- provider 部分成功后只重试失败设备；批量 retry 中一个任务抛错不得阻断其他到期任务。

## Errors

- `notification_token_missing`
- `notification_provider_unavailable`
- `notification_delivery_failed`
- `notification_payload_invalid`
- `notification_task_not_found`
- `notification_task_transition_not_allowed`

## Used By

- event registration。
- event attendance。
- group ministry。
- serving schedule。
- course learning。
- sermon publishing。
- church life publishing。
- annual statement。
- prayer。
- member profile。
- pastoral care。
