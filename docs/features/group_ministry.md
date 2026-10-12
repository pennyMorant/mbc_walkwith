# Group Ministry

状态：二阶段 canonical 申请/成员管理链路已接入，三阶段 v2 Admin 管理工作台已接入

## Feature Goal

让同工维护小组/团契资料、申请、成员和可见性，让会友查看小组并申请加入。

三阶段 v2 在同一 feature 内深化“小组长工作台”：让小组长维护本小组出席、关怀提醒、小组通知和讲道/读经/课程材料使用状态。它不是新的 feature，也不替代 `discipleship_journey`、`reading_plan` 或 `sermon_discussion_guide`。

## Non-Goals

- 不做开放社交群聊。
- 不公开完整成员名单给无权限用户。
- 不让 App 决定小组成员关系。

## Owners

- Product owner：小组/团契同工。
- Backend owner：group ministry service。
- Surface owners：App Life/Mine，Admin Ministry。

## Source Of Truth

小组资料、成员关系、申请状态、带领人、可见性和归档状态以后端 group repository 为准。
批准申请后会原子更新 application 与 membership，并同步会员资料的
`fellowshipGroupId` 投影。`GET /v1/me/groups` 的 canonical membership 才是
Mine“我的小组”的读源；会员资料字段用于 Prayer 和现有成员筛选，不代替
membership source of truth。

v2 小组长工作台的出席、关怀提醒、小组通知和材料分配状态仍归 group ministry service 或其明确引用的 feature owner。小组不复制讲道讨论包、读经计划或课程资料，只保存分配引用和小组内使用状态。

## State Model

- group：`draft`、`active`、`paused`、`archived`
- application：`submitted`、`approved`、`declined`、`withdrawn`
- membership：`active`、`inactive`、`leader`
- attendance：`present`、`absent`、`excused`
- group task：`assigned`、`in_progress`、`completed`、`needs_follow_up`

## Capability Contracts

- `notification_delivery` 用于申请结果和小组提醒。
- `data_export` 用于成员名单导出。
- `scheduled_notification` 用于小组聚会和材料提醒。

## App Surface Boundary

App 展示公开/会员可见小组、详情、我的小组和申请状态。访客可读取
`public` 小组，提交申请和撤回申请必须登录。App 不展示超出权限的成员资料。
Life 页展示可见小组并提交/撤回加入申请；小组卡片进入公开详情，Mine 的
小组 chip 进入 `/mine/groups`，并只从 `/v1/me/groups` 读取 canonical
membership。访客打开 public 详情后，执行申请时进入登录流程。

v2 中，小组长可以在 App 或后续轻量 surface 中查看本小组任务、记录出席和提交关怀提醒。普通成员只能看到自己的小组、材料和允许范围内的通知。当前代码阶段已先接入 Admin 材料分配和出席记录基础 API；小组长 App 工作台需要成员 leader 管理链路补齐后再开放。

## Admin Web Surface Boundary

后台维护小组资料、带领人、成员、申请、可见性、归档和导出。
第一版提供小组创建/编辑、申请列表、批准/拒绝、canonical 成员列表，以及
`active`、`inactive`、`leader` 成员状态管理。

Groups 工作台按申请、成员、材料和出席分区；查询表达 loading、empty 和
error，mutation 成功后刷新 canonical 小组与受影响子资源。出席成员选择只来自
完整 active/leader membership 投影，不受成员 tab 的展示筛选影响。
材料和出席 command 表单按当前小组隔离；切换小组时重置。Admin controller
使用小组 id 与 operation id 识别迟到 mutation，旧结果只可刷新缓存，不能覆盖
当前 workspace 的反馈或表单。

v2 后台可查看小组活跃度、出席和材料分配；关怀提醒和小组通知仍属于后续
小组长工作台闭环。最终成员关系和可见性仍以后端为准。

## Backend Service Boundary

后端负责成员关系、申请流转、可见性、容量、权限和审计。提交和审批在
repository transaction 内锁定小组后完成判断；并发审批不能超过容量。

v2 后端还负责小组长权限、出席状态、小组内材料分配引用、关怀提醒 intent、通知 dedupe 和导出权限。
非手工材料引用必须先由对应 feature repository 确认存在；出席请求只提交
`memberUserId`，显示姓名由后端从 canonical member profile 派生。

## Side Effects

- 申请结果通知。
- 小组聚会提醒。
- 小组材料发布提醒。
- 成员名单导出。
- 审计成员变更。

## Lifecycle And Recovery

申请人可以撤回自己的 `submitted` 申请。批准申请时创建 membership。
`approved`、`declined`、`withdrawn` 都是终态；相同 intent 重试返回 canonical
结果。归档小组不删除历史成员和审计，也不能重新激活。小组容量不能降到
当前 active/leader 成员数以下。

出席和材料使用记录可更正，但必须保留审计。小组长变更后，旧组长不能继续访问小组长工作台。

## Error Model

- `group_not_found`
- `group_visibility_denied`
- `group_application_duplicate`
- `group_application_transition_invalid`
- `group_membership_required`
- `group_membership_not_found`
- `group_capacity_full`
- `group_capacity_below_member_count`
- `group_status_transition_invalid`
- `group_leader_permission_denied`
- `group_material_assignment_not_found`
- `group_material_reference_not_found`
- `group_attendance_invalid`

## Main Logic Chain

访客或会友查看可见小组 -> 会友提交申请 -> 后端事务记录 `submitted` ->
同工审核 -> 后端事务更新 application 和 membership -> 同步 member profile
投影 -> App Life/Mine 分别读取 visible groups 和 canonical `/me/groups`。

v2 链路：后台给小组分配讲道讨论包、读经计划或课程材料 -> 小组长查看本周材料 -> 小组长记录出席和关怀提醒 -> 后端更新小组状态或创建 pastoral care intent -> 成长路径读取小组参与摘要。

## Failure Chains

- 重复申请返回当前申请状态。
- 会员只能撤回自己的 `submitted` 申请，终态不能改写。
- 小组归档后不能继续申请。
- 并发审批由 group row lock 串行化，满员后返回 `group_capacity_full`。
- 无权限用户不能查看成员名单。
- 非小组长不能记录本小组出席。
- Admin 基础出席 API 只能写入 active/leader membership。
- 讲道讨论包或读经计划下架后，小组材料进入 `needs_follow_up`。

## Verification Checklist

- 小组可见性由后端判断。
- public 目录不泄露 members/group/private 小组。
- 申请、重复申请、撤回、批准、拒绝和成员状态变更都有审计；成员停用会同步
  清理匹配当前小组的 member profile 投影。
- App Mine 的我的小组来自 canonical membership。
- App 详情、Life 列表和 Mine 列表的 mutation 都会失效 visible/detail/Mine
  三个 provider，随后重读 canonical state。
- 重复提交、重复撤回和重复审批可辨识且保持幂等。
- group 状态和容量下调遵守 backend transition rule。
- 导出名单需要管理员权限。
- v2 小组长只能管理自己负责的小组。
- v2 小组材料只保存引用，不复制讲道、课程或读经计划内容。
- 非手工材料创建或换源时校验真实引用；状态更新不要求客户端复制来源内容。
- 出席记录不接受客户端提供成员姓名，并在写入时再次验证 active/leader membership。
- Admin 申请批准与成员状态变更会同时刷新 group、applications 和 memberships；
  材料和出席 mutation 刷新各自 canonical 子资源。

## Related Docs

- [../domains/ministry_group.md](../domains/ministry_group.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [../domains/content_visibility.md](../domains/content_visibility.md)
- [discipleship_journey.md](discipleship_journey.md)
- [reading_plan.md](reading_plan.md)
- [sermon_discussion_guide.md](sermon_discussion_guide.md)
- [pastoral_care.md](pastoral_care.md)
