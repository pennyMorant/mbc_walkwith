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

内容类型是共享契约枚举：`weekly_bulletin`、`sunday`、`announcement`、
`event`、`fellowship`、`group`、`course`、`serving`、`prayer`、`care`、
`giving`。Admin 只能选择这些类型；App 必须按 `type` 映射展示区域，不能根据
标题或译文关键词猜测类型。

## Capability Contracts

- `object_storage` 用于图片和附件。
- `notification_delivery` 用于发布通知。
- `scheduled_notification` 用于定时发布或提醒。

## App Surface Boundary

The Life hero is a current-natural-week projection owned by the backend. The
App sends current week boundaries to the latest-bulletin endpoint and shows an
empty hero when that range has no bulletin. The `This week` tab keeps those
fixed boundaries; month selection is available only for category tabs.

Published presentation data is not discarded by the App: the weekly hero may
show the admin-managed cover image, detail renders non-empty `meta` as
supplemental Markdown, registration shows its deadline, and prayer cards show
the public projection's submitter name and creation date. Private author and
moderation fields remain outside the App contract.

The Mine surface provides explicit navigation to the notification inbox and,
for signed-in members, their event registrations. Notification unread counts
come from the notification inbox owner. Registration cards use the member Life
projection's `registrationSummary`; the App does not persist a second
registration truth.

Active group members may read assignments through
`GET /v1/member/groups/:groupId/materials`. Membership authorization belongs
to the backend; the App requests assignments only after the group projection
confirms active membership and renders the assignment title and due date inside
the group detail surface.

Life list reads use stable `limit` and `offset` pages. The App drains all pages
for selected-month feeds and member registration history, so a high-content
month cannot silently hide later records. Ordinary compact surfaces may still
request a bounded page deliberately.

The App preserves repository ordering when it projects posts into Life tabs;
category filtering must not replace backend-owned `sort` priority with a UI
timeline order. Weekly bulletin, weekly posts, monthly posts, and member support
sections keep independent loading, empty, and error states, so one failed
projection does not hide another successful section. Group, course, serving,
prayer, and care support data is loaded when its tab is first visited and then
kept alive by the provider cache for later tab switches.

App 展示 Life 首页、分类筛选、详情、报名/课程/小组等行动入口。App 不决定内容发布状态、可见性、展示权重或未读状态。展示权重不显示为 App chip；App 只展示本地化后的内容类型和用户状态。

## Admin Web Surface Boundary

后台负责创建、编辑、预览、设置展示优先级、提交审核、发布、下架、归档 intent，以及发布时是否推送到 App 的显式选择。既有内容的每个写 intent 都必须携带当前 `revision`；发布时内容快照、目标可见性和通知选择必须作为一个命令提交。

内容目录的搜索、可见性和状态输入是可编辑筛选草稿，只有管理员明确应用后才成为
后端查询快照。目录重试必须使用当前已应用快照，不能意外提交尚未应用的输入；已有
目录快照刷新失败时继续显示原数据和局部重试提示，不能把失败渲染成空目录。目录查询
错误与创建、更新、审核、发布、图片上传和报名命令错误分别呈现。

编辑器打开、切换内容、新建内容或关闭抽屉时必须进入新的 editor session。保存、审核、
发布、下架、归档和删除在触发时冻结 session、资源 ID、`revision` 与 payload；异步响应
只有仍归属当前 session 和当前资源时才可更新表单、关闭抽屉或显示命令反馈。旧响应仍可
触发 canonical 列表失效，但不得把管理员已经切换后的编辑器重新打开或覆盖。

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
- `life_image_upload_body_invalid`
- `life_image_type_unsupported`
- `life_image_empty`
- `life_image_too_large`

## Main Logic Chain

后台创建内容并设置展示优先级 -> 后端保存草稿、`sort` 和初始 `revision=0` -> 审核发布 intent 携带当前 revision、内容快照和通知选择 -> 后端原子校验并保存 published 与下一 revision -> 如果 `notifyApp` 为 true 则创建 `life_post_published` 通知任务 -> App Life 拉取后端已排序且不含 revision 的可见内容 -> 会友进入详情和相关行动。

Life 图片上传进入统一 Media service；`public_posts` 只保存 `image_media_id`，读取时批量解析当前已批准的公开 URL。媒体变为 pending、restricted 或 private 后，Life 投影立即停止返回图片 URL。
Life create/update/publish 在显式写入非空 `image_media_id` 前调用 Media reference validator；不存在、非图片、私有、待授权、受限或没有公开 URL 的资源以 `media_reference_invalid` 拒绝，不能把悬空引用写入 canonical content。
Life repository 同时实现 Feature-owned media usage provider，按 canonical
`image_media_id` 返回安全的内容 ID、标题和图片槽位；Media 模块不直接查询 Life 表。

会友打开详情 -> App 提交 mark-read intent -> 后端写入 `life_post_reads.read_at` -> member list/detail 返回 `isRead/readAt` -> App 以同一后端投影更新卡片已读样式、周报 Hero 和各分类未读 badge。

App 对周、月或分类列表的成功响应只增量写入离线内容缓存；只有完整、无筛选的 `loadAll` 快照可以替换缓存。会友专属的已读和报名状态保留在后端投影及按会话隔离的内存缓存中，不写入共享 SQLite 内容字段。读、报名和签到成功后，App 必须统一失效详情、列表和最新周报投影。

## Failure Chains

- 内容下架后 App 详情返回 not found 并清理缓存。
- 缺少或格式错误的 revision header 由 route contract 拒绝；旧 revision 返回 `life_post_state_changed`，Admin 必须刷新，不自动重放旧内容。
- 标题/正文不完整、CTA 只有标签或 URL、或 CTA 不是 HTTP(S) 时，发布返回 `life_post_publish_not_ready`，canonical 草稿保持不变。
- 没有 `life_posts:publish` 的内容编辑者不能修改、下架、归档或删除已发布内容。
- 只有 `life_posts:publish` 的审核者只能发布当前 revision 的 canonical 草稿；Admin 不显示可编辑内容控件，发布请求也不携带本地内容快照。
- 附件授权失败时只隐藏附件，不伪造内容成功。
- 无权限内容由后端过滤。
- 管理员更新内容后 `life_posts.updated_at` 变化；如果旧 `read_at` 早于新 `updated_at`，member route 返回未读。
- App 卡片与详情的 CTA 都通过共享 Life action 调用 Core 外链能力；平台返回失败或抛出
  异常时显示本地化可恢复提示，不能形成未处理 Future。

## Verification Checklist

- 草稿、发布、下架、归档状态可追踪。
- 展示权重只影响排序，不作为 App 端优先级标签显示。
- 内容类型由共享枚举驱动，Admin、API、数据库约束和 App DTO 保持一致。
- 多语言标题不会改变内容所属的 Life 分类。
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
