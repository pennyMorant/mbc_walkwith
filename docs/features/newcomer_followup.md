# Newcomer Follow-up

状态：三阶段第一版已接入，后端基础闭环、Admin Web 第一版和 App Life 提交入口已接入

## Feature Goal

让新朋友从第一次留下资料开始，能被教会同工有序跟进、邀请、关怀，并在合适时进入会员资料、成长路径、小组、课程或关怀系统。

## Non-Goals

- 不替代会员资料。
- 不替代长期牧养关怀。
- 不做营销 CRM 或群发骚扰。
- 不公开新人名单给无权限用户。
- 不把游客自动变成正式会友。

## Owners

- Product owner：新朋友接待和牧养团队。
- Backend owner：newcomer follow-up service。
- Surface owners：Public Web new friend entry，App Life/Mine，Admin People。
- Source of truth owner：backend newcomer follow-up repository。

## Source Of Truth

新朋友资料、状态、来源、负责人、联系记录、下一步动作、转会员记录和进入成长路径记录以后端 newcomer follow-up repository 为准。

公开提交响应使用独立的最小 projection，只返回提交 ID、显示名、初始状态和创建时间；联系方式、兴趣、external user id、负责人、会员关联和转接状态只保留在后端/Admin contract，不进入 App submission DTO。

会员账号和资料归 `member_profile`；关怀请求和内部牧养备注归 `pastoral_care`；成长路径归 `discipleship_journey`。

## State Model

Newcomer profile：

- `new`
- `assigned`
- `contacted`
- `visited`
- `invited_to_group`
- `invited_to_course`
- `in_discipleship`
- `converted_to_member`
- `paused`
- `closed`

Follow-up item：

- `planned`
- `completed`
- `missed`
- `cancelled`

Conversion：

- `none`
- `linked_existing_member`
- `created_member`
- `declined`

## Capability Contracts

- `notification_delivery` 用于新朋友提交提醒、负责人提醒和下一次联系提醒。
- `scheduled_notification` 用于跟进到期提醒。
- `data_export` 用于授权的新朋友名单导出。
- `audit_log` 用于负责人、状态、隐私和转会员操作。

## App Surface Boundary

App 可以：

- 让未登录访客或已登录会友提交新朋友资料。
- 使用 external user id 绑定未登录提交。
- 展示自己提交的基础状态，例如“已收到”“同工将联系你”。
- 登录后请求把自己的新人记录关联到会员账号。

App 不可以：

- 查看其他新朋友资料。
- 查看内部跟进备注。
- 自己改负责人或转会员状态。

## Admin Web Surface Boundary

Admin Web 可以：

- 查看新朋友队列。
- 分配跟进负责人。
- 添加联系记录和下一次联系时间。
- 标记状态。
- 邀请加入小组、课程或成长路径。
- 将新朋友链接到已有会员或创建会员候选。

Admin Web 不直接决定小组成员关系、课程报名最终状态或成长路径任务完成状态。

当前代码第一版已接入 `/newcomers` 后台页面，支持列表筛选、详情抽屉、状态更新、负责人/下次跟进、转会员状态和跟进记录创建。邀请小组、课程或成长路径的受控 intent 后续接入对应 feature 后再开放。

## Backend Service Boundary

后端负责：

- 新朋友资料校验和去重提示。
- external user id 与会员账号关联。
- 状态流转。
- 负责人权限。
- 跟进记录和隐私控制。
- 校验跟进记录时间语义：非 completed 状态必须有 plannedAt，且不能携带 completedAt。
- 转接到 member、group、course、discipleship 或 care 的受控 intent。
- 审计。

## Side Effects

- 新朋友提交后通知负责同工。
- 跟进到期提醒。
- 转会员或关联会员审计。
- 授权导出。

## Lifecycle And Recovery

新朋友记录可以从 `new` 进入 `assigned`，再进入联系、邀请、成长路径或转会员。关闭记录不删除历史跟进。误关联会员时需要管理员纠正并写审计。

## Error Model

- `newcomer_not_found`
- `newcomer_duplicate_candidate`
- `newcomer_assignment_required`
- `newcomer_transition_invalid`
- `newcomer_permission_denied`
- `newcomer_member_link_conflict`
- `newcomer_followup_invalid`

## Main Logic Chain

新朋友提交资料 -> 后端保存 newcomer profile -> 通知接待/牧养负责人 -> Admin 分配跟进人 -> 同工记录联系和下一步 -> 邀请参加小组、课程或活动 -> 分配成长路径 -> 合适时关联或创建会员 -> 原记录保留历史。

## Failure Chains

- 重复邮箱或电话只提示候选，不自动合并。
- 未登录提交必须有 external user id 或 contact method。
- 无权限同工不能查看或导出新朋友资料。
- 跟进通知失败不改变 newcomer 状态。
- 转会员失败时 newcomer 状态保持原值并提示可重试。

## Verification Checklist

- 新人、会员、关怀三类 source of truth 分开。
- 未登录 external user id 能绑定提交记录。
- 状态变更和负责人变更有审计。
- 内部跟进记录不返回给普通 App。
- 公开提交响应不返回联系方式、兴趣、external user id 或任何 Admin-only 字段。
- PATCH 只写入请求携带字段，不能用先读后整行回写覆盖并发更新。
- 转接小组、课程、成长路径只提交 intent，不直接写其他 feature 私有状态。

## Related Docs

- [../domains/newcomer_followup.md](../domains/newcomer_followup.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [../domains/privacy.md](../domains/privacy.md)
- [member_profile.md](member_profile.md)
- [pastoral_care.md](pastoral_care.md)
- [discipleship_journey.md](discipleship_journey.md)
- [group_ministry.md](group_ministry.md)
- [course_learning.md](course_learning.md)
- [notification_delivery.md](notification_delivery.md)
