# Church Life Publishing

状态：二阶段第一版已接入，发布推送后端闭环已接入

## Feature Goal

让同工创建、审核、发布和归档公告、周报、生活内容，并让会友在 Life 中清楚查看。

## Non-Goals

- 不负责活动报名最终状态。
- 不负责小组、课程、服事排班的私有业务规则。
- 不把 Life 做成社交动态流。

## Owners

- Product owner：内容同工。
- Backend owner：life publishing service。
- Surface owners：App Life，Admin Content。

## Source Of Truth

生活内容、发布状态、可见性、展示权重、附件、行动按钮、聚合
`revision` 和会友已读状态以后端 life repository 为准。`revision` 只用于
Admin 写并发控制，不属于 App 公开投影。

## State Model

- `draft`
- `needs_review`
- `published`
- `archived`

Life posts do not use sermon/media processing states such as `processing` or
`failed`. Unpublish is an action that returns a post to `draft` and
`private` visibility rather than a separate canonical status.

## Capability Contracts

- `object_storage` 用于图片和附件。
- `notification_delivery` 用于发布通知。
- `scheduled_notification` 用于定时发布或提醒。

## App Surface Boundary

App 展示 Life 首页、分类筛选、详情、报名/课程/小组等行动入口。App 不决定内容发布状态、可见性、展示权重或未读状态。展示权重不显示为 App chip；App 只展示本地化后的内容类型和用户状态。

## Admin Web Surface Boundary

后台负责创建、编辑、预览、设置展示优先级、提交审核、发布、下架、归档 intent，以及发布时是否推送到 App 的显式选择。既有内容的每个写 intent 都必须携带当前 `revision`；发布时内容快照、目标可见性和通知选择必须作为一个命令提交。

## Backend Service Boundary

后端负责可见性、发布状态、展示权重排序、附件授权、行动按钮目标校验、发布完整性、会友已读状态和审计。repository 在同一原子写中锁定内容行、校验并递增 `revision`。发布接口可同时接收内容快照、`notifyApp` 和可选通知标题/正文；通知投递交给 notification delivery 能力处理。

## Side Effects

- 文件上传和签名访问。
- 发布通知，仅在管理员发布请求显式要求时触发。
- 审计内容状态变化。

## Lifecycle And Recovery

草稿可反复编辑。发布内容与状态由一个后端命令原子保存，发布校验或旧版本冲突不改变 canonical 状态。发布后的推送失败不回滚内容状态，只记录投递任务、provider evidence 和审计摘要。附件上传失败时内容保留草稿状态。

## Error Model

- `life_post_not_found`
- `life_post_schedule_invalid`
- `life_post_direct_publish_not_allowed`
- `life_post_publish_not_ready`
- `life_post_publish_permission_denied`
- `life_post_state_changed`
- `life_image_not_found`
- `life_image_upload_body_invalid`
- `life_image_type_unsupported`
- `life_image_empty`
- `life_image_too_large`

## Main Logic Chain

后台创建内容并设置展示优先级 -> 后端保存草稿、`display_weight` 和初始 `revision=0` -> 审核发布 intent 携带当前 revision、内容快照和通知选择 -> 后端原子校验并保存 published 与下一 revision -> 如果 `notifyApp` 为 true 则创建 `life_post_published` 通知任务 -> App Life 拉取后端已排序且不含 revision 的可见内容 -> 会友进入详情和相关行动。

会友打开详情 -> App 提交 mark-read intent -> 后端写入 `life_post_reads.read_at` -> member list/detail 返回 `isRead/readAt` -> App 以同一后端投影更新卡片已读样式、周报 Hero 和各分类未读 badge。

## Failure Chains

- 内容下架后 App 详情返回 not found 并清理缓存。
- 缺少或格式错误的 revision header 由 route contract 拒绝；旧 revision 返回 `life_post_state_changed`，Admin 必须刷新，不自动重放旧内容。
- 标题/正文不完整、CTA 只有标签或 URL、或 CTA 不是 HTTP(S) 时，发布返回 `life_post_publish_not_ready`，canonical 草稿保持不变。
- 没有 `life_posts:publish` 的内容编辑者不能修改、下架、归档或删除已发布内容。
- 只有 `life_posts:publish` 的审核者只能发布当前 revision 的 canonical 草稿；Admin 不显示可编辑内容控件，发布请求也不携带本地内容快照。
- 附件授权失败时只隐藏附件，不伪造内容成功。
- 无权限内容由后端过滤。
- 管理员更新内容后 `life_posts.updated_at` 变化；如果旧 `read_at` 早于新 `updated_at`，member route 返回未读。

## Verification Checklist

- 草稿、发布、下架、归档状态可追踪。
- 展示权重只影响排序，不作为 App 端优先级标签显示。
- App 只显示当前身份可见内容。
- 已读状态跨设备一致，且本地缓存不制造未读。
- 附件不暴露私有存储地址。
- 发布、下架和归档有审计。
- 所有既有内容写操作校验并递增 revision，活动报名/签到不会推进内容 revision。
- 发布内容与 published 状态只发生一次聚合写，公开/member 响应不泄露 revision。
- 发布时推送必须有显式请求、dedupe key 和投递结果审计。

## Related Docs

- [../domains/content_visibility.md](../domains/content_visibility.md)
- [../domains/media_asset.md](../domains/media_asset.md)
- [../capabilities/object_storage.md](../capabilities/object_storage.md)
- [../capabilities/notification_delivery.md](../capabilities/notification_delivery.md)
