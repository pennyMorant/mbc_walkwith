# Sermon Discussion Guide

状态：公开讨论包第一版已闭环；scoped App 投递、成员授权、AI 草稿、发布通知和统计导出尚未接入

## Feature Goal

让讲道发布后，教会可以为小组、课程或个人预备讨论问题、生活应用、祷告方向和行动回应，使讲道从“听完”延伸到“讨论、操练和牧养跟进”。

## Non-Goals

- 不替代讲道发布。
- 不保存讲道音频或完整讲道 source of truth。
- 不让 AI 生成内容自动发布。
- 不做开放评论区或社交讨论流。
- 不公开个人回应，除非后续明确设计小组内可见规则。

## Owners

- Product owner：讲道内容同工、小组牧养同工。
- Backend owner：sermon discussion guide service。
- Surface owners：App Sermons/Life，Admin Content/Ministry。
- Source of truth owner：backend sermon discussion guide repository。

## Source Of Truth

讨论包标题、问题、应用、祷告方向、行动步骤、适用小组/课程/路径、发布状态和个人回应摘要以后端 sermon discussion guide repository 为准。

讲道本体、音频、文稿、大纲和经文引用仍归 sermon repository。

Admin 管理接口使用包含 `generatedMetadata` 的完整 guide contract。公开 App
读取接口使用独立 public projection，必须在 Backend service 边界剔除
`generatedMetadata`，并固定为 `published/public/null audienceId`；App 不解析、
缓存或展示内部生成提示、模型信息和审核辅助数据。

## State Model

Guide：

- `draft`
- `review`
- `published`
- `archived`

允许迁移：

```text
new -> draft | review
draft -> draft | review | archived
review -> draft | review | published | archived
published -> published | review | archived
archived -> archived | draft
```

只有 `review -> published` 可以首次发布。已发布内容如需修改，必须先退回 `review`；`archived` 只能先恢复到 `draft`。离开 `published` 时清空 `publishedAt`，重新发布时记录新的发布时间。

同一篇讲道可以有多个草稿或审核中的 public guide，但任一时刻只能有一个
`published + public` guide。发布另一个公开 guide 前，必须先把当前公开 guide
退回 review 或归档；scoped guide 不占用公开发布槽位。

Question：

- `observation`
- `interpretation`
- `application`
- `prayer`
- `action`

Response：

- `private`
- `shared_with_group`
- `hidden`
- `archived`

结构化内容约束：

- questions、action steps 和 prayer prompts 各最多 50 项。
- question id 在 questions 内唯一，action step id 在 action steps 内唯一。
- response 携带 `questionId` 时必须是非空 ID，并属于当前 guide。

## Capability Contracts

- 当前已接入 `audit_log`，用于发布、归档和隐藏允许审核的回应。
- `ai_provider` 草稿辅助、`notification_delivery` 发布通知和
  `data_export` 使用统计属于后续能力；当前 feature 不调用这些 provider。
- 后续接入 AI 时仍必须人工审核，不能让生成内容自动发布。

## App Surface Boundary

App 可以：

- 在讲道详情显示已发布讨论包。
- 让用户写个人回应。

App 不可以：

- 修改讨论包。
- 把个人回应默认公开。
- 显示未发布讨论包。
- 读取 `generatedMetadata` 等 Admin-only 字段。
- 复制讲道全文作为讨论包 source of truth。
- 凭 guide UUID 访问 group、course 或 discipleship audience 的材料。

当前 App 只有 public guide 读取和 private response 写入链路。scoped guide 的
成员身份解析、受众权限和读取 route 尚未实现，不能由客户端自行过滤代替。

## Admin Web Surface Boundary

Admin Web 可以：

- 为已发布或待发布讲道创建讨论包。
- 人工配置问题、行动步骤和适用对象。
- 审核发布、归档或隐藏明确共享给小组的不合适回应。
- 通过现有目标 ID 分配给小组、课程或成长路径；后端校验目标存在。

当前 Admin 尚未接入受众选择器或本 feature 专用 AI 草稿 action。普通回应列表和 hide action 都不能读取或修改 `private` 回应。

Admin 根据已保存状态显示可选迁移，并在 `published` 或 `archived` 未退出当前状态时锁定内容字段。这只是操作提示，Backend service 仍是 transition 和内容锁的唯一 owner。

## Backend Service Boundary

后端负责：

- 校验 sermon 引用。
- 保存讨论包结构和发布状态。
- 发布前校验人工审核。
- 控制个人回应可见性。
- 在公共读取 service 边界把完整 guide 投影成 public contract，禁止把
  `generatedMetadata` 下发给 App。
- 强制 Admin 回应查询只能读取 `shared_with_group`，不能由 query 参数扩大到 `private`。
- 审计高风险操作。
- 校验 audience 形状：`public` 不得携带 `audienceId`，group/course/discipleship 必须携带目标 ID。
- 通过只读 audience directory 在创建、目标变更和发布时校验 group、course、
  discipleship 实体真实存在；目标被删除后仍允许旧 guide 退回审核或归档，
  该校验不等同于 scoped 成员读取权限。
- 阻止新建时直接发布、跳过 review、原地修改 published 内容和从 archived 直接发布。
- 发布前要求至少存在一个问题、行动步骤或祷告方向，并确认关联讲道已发布。
- 在 service 层检查公开发布槽位，并由 Postgres partial unique index 处理并发竞态。
- shared contract 限制结构化集合大小和 ID 唯一性；Postgres repository 用完整
  guide schema 解析 JSON 字段，不丢弃损坏项目或回退成空集合。

## Side Effects

- 当前：讨论包发布/归档和回应隐藏审计。
- 规划：AI 草稿生成、小组长或成员通知、使用统计导出。

## Lifecycle And Recovery

讨论包从草稿进入审核，审核通过后发布。已发布内容修改前先退回审核；归档后可恢复为草稿重新整理。讲道下架时，讨论包不删除，但 App 不再通过公开讲道入口展示。

## Error Model

- `sermon_discussion_guide_not_found`
- `sermon_discussion_sermon_not_found`
- `sermon_discussion_sermon_not_published`
- `sermon_discussion_review_required`
- `sermon_discussion_audience_invalid`
- `sermon_discussion_audience_target_not_found`
- `sermon_discussion_visibility_denied`
- `sermon_discussion_response_invalid`
- `sermon_discussion_transition_invalid`
- `sermon_discussion_public_guide_conflict`

## Main Logic Chain

当前公开链路：讲道发布或进入审核 -> 管理员人工创建讨论包 -> 管理员编辑并进入 review -> 后端发布 public guide -> App 讲道详情读取 public projection -> 用户以会员或 external user 身份写 private response -> 后端保存回应且不向 Admin 普通列表暴露正文。

scoped 目标当前只完成 Admin 写入、目标存在性和生命周期校验；App 成员授权读取与 scoped 回应链路尚未接入。

## Failure Chains

- 引用不存在或未发布讲道时不能发布公开讨论包。
- scoped 目标不存在时创建或变更返回 404，不能保存悬空引用。
- 已存在公开发布讨论包时，第二个 public guide 发布返回 409；释放槽位后可发布。
- 重复问题/行动 ID、超过 50 项或损坏的持久化 JSON 不能进入正常读取链路。
- 未审核讨论包不返回给 App。
- 公共 payload 缺字段、类型错误或枚举漂移时，App 显示可重试错误，不能把
  malformed contract 静默当作“没有讨论包”。
- 用户回应为空、过长或含不允许内容时返回 validation error。
- 私密回应不得进入小组或后台普通列表。
- 私密回应 UUID 不能通过 Admin hide action 读取正文或改变状态。
- 非公开 audience guide 不能仅凭 UUID 从公开回应入口写入数据。
- 讲道下架或未发布时，公开讨论包入口统一返回 not found，不泄露后台状态。

## Verification Checklist

- 讨论包只引用 sermon，不复制 sermon source of truth。
- 新讨论包不能直接 published，draft 不能跳过 review。
- Published 内容必须先退回 review 才能修改；archived 只能恢复为 draft。
- Public/scoped audienceId 形状由 Backend 强制。
- scoped audience target 存在性由 Backend audience directory 强制。
- 空讨论包和未发布讲道不能进入 published。
- 每篇讲道最多一个 `published + public` guide，service 与数据库约束均守住该规则。
- 结构化集合有 50 项上限且 ID 唯一；Backend repository 与 App DTO 都严格解析。
- App 只显示 published guide。
- Public guide response 不包含 `generatedMetadata`，Admin guide response 保留该字段。
- App 对 public guide 和 response envelope 进行严格 DTO 解析，契约错误可见且可重试。
- 个人回应默认私密。
- 当前只校验小组、课程和成长路径引用存在；scoped App 读取和成员权限仍待实现。
- 发布、归档、隐藏回应有审计。

## Related Docs

- [../domains/sermon_discussion_guide.md](../domains/sermon_discussion_guide.md)
- [../domains/content_visibility.md](../domains/content_visibility.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [sermon_publishing.md](sermon_publishing.md)
- [sermon_discovery.md](sermon_discovery.md)
- [ai_content_assist.md](ai_content_assist.md)
- [group_ministry.md](group_ministry.md)
- [course_learning.md](course_learning.md)
- [discipleship_journey.md](discipleship_journey.md)
- [notification_delivery.md](notification_delivery.md)
