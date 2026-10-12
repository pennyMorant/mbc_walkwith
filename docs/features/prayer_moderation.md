# Prayer Moderation

状态：二阶段第一版已接入，App 提交/查看、Admin 审核/隐藏/归档和后端隐私边界基础闭环已接入

## Feature Goal

让会友提交代祷请求，让同工按隐私等级审核、展示、隐藏和归档代祷内容。

## Non-Goals

- 不做公开社交评论区。
- 不默认公开任何代祷内容。
- 不把私密代祷长期缓存到普通 App storage。

## Owners

- Product owner：牧养/代祷同工。
- Backend owner：prayer moderation service。
- Surface owners：App Life/Mine，Admin Ministry。

## Source Of Truth

代祷内容、提交人、可见性、审核状态、隐藏状态和归档状态以后端 prayer repository 为准。

## State Model

- `pending`
- `approved`
- `hidden`
- `archived`

## Capability Contracts

- `notification_delivery` 用于审核结果和更新提醒。

## App Surface Boundary

App 提交代祷、显示我的代祷和我可见的已审核代祷。App 不决定公开范围。

App 对后端代祷 DTO 使用严格映射，坏响应必须显式失败，不能退化为空列表、空 ID
或 1970 时间。我的代祷与共享代祷合并时按 `id` 去重；两次请求之间发生审核更新
时，以 `updatedAt` 最新记录为 canonical 显示版本。

## Admin Web Surface Boundary

后台展示待审核列表、敏感标记、审核动作、隐藏、归档和审计。

## Backend Service Boundary

后端负责默认私密、可见性、审核状态、身份权限、敏感数据保护和审计。

批准是一个原子 moderation intent：后台可以同时提交最终 `visibility`、
`groupId`、审核备注和 `notifyApp`。后端先在同一次 canonical 更新中写入最终
审核状态与范围，再根据更新后的记录判断通知 audience；不能先批准旧范围、再由
前端补写可见性。

Postgres 对同一代祷请求的 moderation 使用行锁事务，避免两名管理员的 partial
update 互相覆盖。状态、可见性、group scope 或审核备注任一变化，都必须更新
`moderatedAt` 和 `moderatedByAdminUserId`。

## Side Effects

- `public` 代祷通知可投递给公开受众，`members` 代祷通知只投递给会友。
- `private` 和 `group` 在没有解析出明确收件人前不得退化为全体会友广播。
- 审计审核动作。

## Lifecycle And Recovery

提交后状态为 `pending`，可见性默认私密。审核动作可改变状态但保留历史。归档不物理删除审计。
审计只记录状态、可见性、长度和存在性等必要元数据，不记录正文、审核备注、提交者姓名或管理员搜索原文。

## Error Model

- `prayer_request_not_found`
- `prayer_visibility_denied`
- `prayer_invalid_visibility`
- `prayer_moderation_required`

## Main Logic Chain

会友提交代祷 -> 后端保存 pending/private -> 同工审核 -> 后端更新状态和可见性 -> App 刷新我的代祷或可见列表。

## Failure Chains

- 无权限用户不能查看私密代祷。
- 审核失败不公开内容。
- 状态冲突返回当前 canonical state。
- 空 moderation intent 被 contract 拒绝，不得只改 `updatedAt` 制造假变更。

## Verification Checklist

- 默认可见性为私密。
- 公开或会友可见前必须审核。
- 私密内容不进入普通缓存。
- 审核、隐藏、归档都有审计。
- 审计和通知 payload 不包含祷告正文、审核备注、提交者姓名或搜索原文。
- 私密和小组代祷不会创建面向全体会友的通知任务。

## Related Docs

- [../domains/privacy.md](../domains/privacy.md)
- [../domains/content_visibility.md](../domains/content_visibility.md)
- [../domains/member_identity.md](../domains/member_identity.md)
