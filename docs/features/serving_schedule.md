# Serving Schedule

状态：App 与 Admin Web 的排班、可用性和到岗基础闭环已接入

## Feature Goal

让同工管理服事岗位和排班，让会友查看我的服事、确认、请假或申请换班。

第一版已落地团队、岗位、排班、会友确认和请假闭环；换班替补流程、通知 dedupe、导出在后续 notification / data_export 阶段继续接入。

三阶段 v2 继续在同一 feature 内深化服事可用性、换班替补、到岗确认、导出和成长路径引用。它不是新的 feature。当前代码阶段已接入会友可用性和到岗确认基础 API；完整换班替补撮合状态机后续再接。

## Non-Goals

- 不做员工考勤系统。
- 不把服事确认当作活动签到。
- 不让 App 直接修改排班。

## Owners

- Product owner：服事团队同工。
- Backend owner：serving schedule service。
- Surface owners：App Life/Mine，Admin Ministry。

## Source Of Truth

岗位、团队、排班、确认状态、请假、换班请求和通知状态以后端 serving repository 为准。第一版 source of truth 对应 `serving_teams`、`serving_roles`、`serving_assignments`。

v2 的可用性、换班请求、替补确认、到岗确认和导出状态仍归 serving schedule service。成长路径只引用服事任务或服事完成摘要，不复制排班数据。

排班写入时必须保证最终 `teamId` 与 `roleId` 属于同一团队；后台 UI 不能只改团队或岗位后让 repository 写出跨团队组合。
已被 assignment 引用的岗位不能迁移到其他团队；未被引用的岗位可以迁移。
后台创建排班只提交 canonical `userId`；姓名和邮箱快照由 serving service
从 member repository 派生，不能相信 Admin Web 提交的重复会员资料。

排班、可用时间和签到的 canonical write 由 repository decision contract
包裹。Postgres 对同一用户的排班或可用时间写入使用事务级锁，service
在锁内完成权限、状态和冲突判断，避免读取后再写入造成竞态。

## State Model

- assignment：`scheduled`、`confirmed`、`declined`、`swap_requested`、`covered`、`cancelled`
- role：`active`、`paused`、`archived`
- availability：`available`、`unavailable`、`preferred`
- check-in：`pending`、`checked_in`、`missed`

`scheduled`、`confirmed`、`swap_requested` 会占用成员时段；`declined`、
`covered`、`cancelled` 不占用。相同成员的占用时段不能重叠，相邻时段可以
连续安排。没有 `endsAt` 的 assignment 只占用其开始时刻。

## Capability Contracts

- `scheduled_notification` 用于服事提醒。
- `notification_delivery` 用于确认、请假和换班通知。
- `data_export` 用于排班导出。

## App Surface Boundary

App 展示我的服事、确认和请假入口。App 不决定最终排班。

当前 App 在 Life 服事列表和 Mine 资料 chip 提供入口；`/mine/serving`
分别展示排班与 canonical 可用性记录，`/mine/serving/:assignmentId` 展示
排班详情、确认、请假和到岗状态。未登录深链必须显示登录入口，不能把无会话
伪装成排班不存在。

v2 App 可以展示可用性、换班请求、替补确认和主日到岗状态。App 只提交 intent，最终排班、替补和到岗状态由后端确认。

成员签到只接受 `checked_in` intent，不能指定 `checkedInAt`、`missed` 或
`pending`。签到时间由服务器生成或保留已有 canonical 时间；管理员已标记
`missed` 后，成员不能自行覆盖，只能由后台更正。
App 通过 `/v1/me/serving-check-ins` 恢复当前成员自己的 canonical 到岗状态，
不能通过 query 指定或读取其他成员。

App 当前只呈现 `swap_requested` 和 `covered` 状态，不提供假的本地换班按钮；
完整换班替补 intent 要在后端状态机和 member API 接入后再开放。

## Admin Web Surface Boundary

后台维护团队、岗位、人员、排班、可用时间和到岗状态；通知和导出后续接入。

当前 Admin Web 通过 serving-scoped member directory 选择 canonical `userId`，
不允许管理员手填姓名和邮箱快照。团队/岗位、排班、可用时间和到岗状态分别由
独立工作区组件表达，所有 mutation 成功后刷新对应 canonical query。
创建 mutation 提交不可变 intent；请求期间用户后续编辑不能被迟到结果重置，
不同命令类型的成功和错误反馈相互隔离，但迟到结果仍刷新对应 canonical query。

到岗更正是否需要原因必须从完整签到目录判断，不能依赖当前表格筛选结果；否则
筛选隐藏既有记录时会把更正误判成首次登记。后台只提交状态和原因，签到时间仍由
后端 normalization 规则拥有。

当前后台可查看排班状态、请假、换班请求状态、可用性和到岗记录。缺口摘要、完整
换班替补状态机、主日服事表导出和通知 dedupe UI 仍是后续阶段，不得用本地按钮
伪造完成状态。

后台可以更正 `pending`、`checked_in`、`missed`；`checked_in` 必须有签到
时间，`pending` 和 `missed` 必须清空签到时间。更正既有状态或时间必须提交
原因，记录保存原因，审计只保存 `hasNote` 和操作者。

## Backend Service Boundary

后端负责排班冲突、权限、确认状态、通知 dedupe 和审计。

v2 后端还负责可用性规则、换班状态机、替补覆盖、到岗确认、成长路径引用摘要和导出权限。

## Side Effects

- 服事提醒通知。
- 换班和替补通知。
- 到岗提醒。
- 排班导出。
- 审计排班变更。

## Lifecycle And Recovery

排班发布后可修改，但必须保留变更审计。通知失败不改变排班状态，可重试。

换班请求可以取消、拒绝或由替补覆盖。到岗状态可更正，但必须保留操作者和原因。

## Error Model

- `serving_assignment_not_found`
- `serving_member_not_found`
- `serving_assignment_conflict`
- `serving_role_in_use`
- `serving_permission_denied`
- `serving_notification_failed`
- `serving_swap_not_available`
- `serving_check_in_invalid`
- `serving_check_in_reason_required`
- `serving_availability_conflict`
- `serving_time_range_invalid`

## Main Logic Chain

同工发布排班 -> 后端保存 assignment -> App Life / Mine 展示我的服事 -> 会友确认或请假 -> 后端更新 canonical state。

当前 App v2 链路：Mine 进入我的服事 -> 读取 assignment / availability ->
会友提交可用性或进入排班详情 -> 提交确认、请假或 checked_in intent ->
repository 刷新 canonical assignment / check-in 状态。

v2 链路：同工发布排班 -> 同工查看未确认和缺口 -> 会友提交换班或不可用 -> 后端校验替补和覆盖状态 -> 服事前发送提醒 -> 主日到岗确认 -> 成长路径读取服事参与摘要。

## Failure Chains

- 通知失败进入 retry，不回滚排班。
- 会友不在排班人员中不能确认。
- 已取消排班不能继续确认。
- 替补已覆盖后不能重复接受换班。
- 到岗确认只能作用于有效排班。
- 可用性冲突不自动删除既有排班，需要管理员处理。
- 同一成员的可用性记录不能重叠；相邻区间允许，结束时间必须晚于开始时间。

## Verification Checklist

- 排班、确认、请假、换班状态可追踪。
- 会友只能确认或请假自己的 assignment。
- 通知有 dedupe key，后续接入 notification job 时补验证。
- 后台修改排班有审计。
- App 状态来自后端刷新。
- v2 换班、替补、到岗和可用性都有权限和审计。
- v2 成长路径只引用服事摘要，不复制排班 source of truth。
- 内存和 Postgres repository 使用同一套时间与冲突规则。
- 同一用户的并发排班或可用时间写入在事务内串行判断。
- App 与 Admin 共享契约拒绝缺失字段、无效 ISO 时间、倒置时间范围，以及签到状态与 `checkedInAt` 不一致的后端投影，不能用客户端默认值掩盖数据错误。

## Related Docs

- [../domains/serving_schedule.md](../domains/serving_schedule.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [../capabilities/scheduled_notification.md](../capabilities/scheduled_notification.md)
- [discipleship_journey.md](discipleship_journey.md)
- [notification_delivery.md](notification_delivery.md)
