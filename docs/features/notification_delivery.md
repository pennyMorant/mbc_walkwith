# Notification Delivery Feature

状态：三阶段已接入，通知 audience、访客 public push、周报、祷告更新和 Admin 单任务操作已落地

## Feature Goal

让 App 尊重系统通知权限，让访客接收公开通知，让后台按业务事件发送通知、记录投递状态并支持失败重试或取消。

当前已接入 push 设备 token、访客公开 token、会员通知偏好、通知 audience、讲道发布、生活发布、周报发布、祷告更新、dedupe key、投递状态、retry 查询入口、单任务 retry/cancel 和 provider evidence。App 只展示系统通知权限入口和通知中心，不再提供 App 内自定义类别开关；通知类别和关闭入口交给 Android/iOS 原生系统设置。App 通知中心支持登录后同步后端 inbox，未登录或后端失败时保留本地 FCM inbox 兜底。

## Non-Goals

- 不把通知当作业务状态 source of truth。
- 不在 push payload 放私密正文。
- 不绕过会员通知偏好。
- 不给访客创建服务端会员 inbox。

## Owners

- Product owner：运营/系统管理员。
- Backend owner：notification service；process-local scheduler。
- Surface owners：App Mine，Admin System。

## Source Of Truth

系统通知权限以 Android/iOS 原生系统设置为准。设备 token、通知 audience、通知 message、会友 inbox item、通知任务、投递状态、重试次数、provider evidence 和后台投递偏好键以后端 notification repository 为准。

## State Model

- preference：`enabled`、`disabled`
- job：`queued`、`sent`、`failed`、`retrying`、`cancelled`
- token：`active`、`expired`、`revoked`
- audience：`public`、`members`、`member_specific`

## Capability Contracts

- `notification_delivery` 用于 provider 投递。
- `scheduled_notification` 用于延迟和定时提醒。

## App Surface Boundary

App 展示系统通知权限、设备注册结果和通知中心。系统通知权限由独立的原生权限 adapter 查询和申请，不依赖 Firebase 初始化、FCM token 或会员登录。首次安装打开 App 时主动请求一次通知权限；之后 Mine 偏好里的通知权限 Switch 只反映系统权限，关闭动作跳转原生系统通知设置。Firebase 可用且系统权限允许时，App 才继续注册 FCM token；Firebase 不可用只关闭远程推送，不得禁用系统权限、本地通知或媒体播放通知。未登录 App 可以注册访客设备 token，但只能接收 `public` audience 的 push；登录会员注册会员 token，并通过会员 inbox API 同步服务端通知。App 不决定通知任务是否发送，也不自建通知类别开关。

登录会员清空通知中心时，App 必须调用后端原子归档全部接口，不能只遍历当前加载页。远端 mutation 或刷新失败时保留已同步的远端投影并呈现错误；只有尚未取得远端 inbox 时才使用本地 FCM inbox 兜底。

## Admin Web Surface Boundary

后台展示通知任务、audience、偏好键、失败原因、payload、provider evidence，并提供到期失败任务批量重试、单任务重试和 queued/retrying 任务取消。

## Backend Service Boundary

后端负责偏好、token、audience、任务创建、dedupe、投递、retry 查询入口、Admin 投递列表、手动重试到期任务、单任务 retry/cancel、进程内 retry scheduler 和 provider evidence。

后端通知中心 source of truth：

- `notification_messages`：业务通知 canonical message，`dedupeKey` 唯一，并记录 audience。
- `member_notification_items`：会友收件箱 item，`messageId + userId` 唯一。
- `notification_delivery_tasks.messageId`：投递任务可关联 canonical message，并记录 audience、preference key 和指定 recipient user IDs。
- delivery task 在首次创建时保存目标设备 ID 快照和待重试设备 ID；这些字段是后端内部状态，Admin/App 不得据此重建 audience。
- 每次实际发送前必须原子取得带过期时间的 delivery lease。业务事件、scheduler 和 Admin retry 不能同时投递同一任务。

Audience 规则：

- `public`：发送给公开访客设备和启用对应偏好的会员设备；只给符合偏好的会员创建 inbox item。
- `members`：只发送给启用对应偏好的 active member；创建会员 inbox item。
- `member_specific`：预留给指定会员通知；必须携带 recipient user IDs。

已接入的业务触发：

- `sermon_published`：audience 为 `public`，使用 `sermonPublished` 偏好，dedupe key 为 `sermon_published:{sermonId}`。
- `life_post_published`：仅在 Admin 发布请求显式 `notifyApp: true` 时触发，public 内容使用 `public`，members 内容使用 `members`，偏好键为 `lifePostPublished`，dedupe key 为 `life_post_published:{postId}`。
- `weekly_bulletin_published`：Life post 类型为 `weekly_bulletin` 或 `sunday` 时触发，public/members audience 跟随内容可见性，偏好键为 `weeklyBulletin`，dedupe key 为 `weekly_bulletin_published:{postId}`。
- `prayer_update_published`：Admin 审核祷告事项并显式 `notifyApp: true` 时触发，audience 为 `members`，偏好键为 `prayerUpdates`，payload 只能放通用标题、正文和路由，不放祷告正文。

## Side Effects

- 推送通知投递。
- provider token 更新。
- 失败重试。

## Lifecycle And Recovery

业务事件创建 delivery task 后立即投递并保存结果。失败进入 `retrying`，由 `NotificationService.retryDueDeliveries` 暴露到期重试入口；Admin 可手动重试单任务或到期任务，也可取消 queued/retrying 任务。轻量 scheduler 可按 env 配置定时调用。token invalid 时标记 revoked 并停止投递。

任务 lease 在进程崩溃后可过期恢复；持有有效 lease 的任务不能被另一 retry 或 cancel 抢占。部分设备成功时只保留失败设备 ID 进入下一次重试，已经成功的设备不得重复接收。批量 retry 必须隔离单任务 provider 异常并继续处理同批其他任务。任务列表使用 `createdAt + id` 复合游标，时间戳相同时也不能丢项。

未配置 push provider 时，有有效目标设备的任务必须记录 `notification_provider_unavailable` 并进入可见失败/重试状态，不能标记为已发送；没有目标设备的任务可以正常完成，因为没有待发送收件人。

## Error Model

- `notification_preference_disabled`
- `notification_token_missing`
- `notification_delivery_failed`
- `notification_payload_invalid`
- `notification_task_not_found`
- `notification_task_transition_not_allowed`

## Main Logic Chain

业务事件产生通知 intent -> 后端按 audience 和会员偏好创建 canonical message 与会友 inbox item -> 查询具备有效 token 的目标设备 -> 创建通知任务并关联 `messageId` -> 调用 provider -> 保存 delivery status 和 provider evidence -> 失败任务进入 retrying。

Life 发布通知失败不得回滚 Life post 的 published 状态；发布审计必须记录是否请求推送、投递结果或失败摘要。

## Failure Chains

- 偏好关闭时不创建投递任务。
- provider 失败进入 retrying，不改变原业务状态。
- payload 含私密正文时拒绝发送。
- 访客只接收 public push，不创建服务端 inbox item。
- 祷告通知只能携带通用文案，不携带祷告正文。
- 重复业务事件命中 dedupe key，不重复投递已完成任务。
- 并发重复业务事件只能原子创建一个任务并由一个 sender 取得 lease。
- 部分成功只能重试失败设备，不能再次发送给成功设备。
- 已取消的 dedupe task 不会被重复业务事件重新投递，只能通过新的业务 intent 或显式重建任务恢复。

## Verification Checklist

- 通知任务有 dedupe key。
- 偏好关闭后不发送。
- token 失效可恢复。
- provider 失败会记录 retry 状态和 evidence。
- delivery lease 可阻止并发业务触发、scheduler 和 Admin retry 重复发送，过期后可恢复。
- 部分成功、同时间戳分页和并发设备 token upsert 有回归测试。
- 群发和高风险通知有审计。

## Related Docs

- [member_profile.md](member_profile.md)
- [../domains/notification_preference.md](../domains/notification_preference.md)
- [../capabilities/notification_delivery.md](../capabilities/notification_delivery.md)
- [../capabilities/scheduled_notification.md](../capabilities/scheduled_notification.md)
