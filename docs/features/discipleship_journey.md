# Discipleship Journey

状态：三阶段第一版已接入，后端基础闭环、Admin Web 第一版和 App Mine 进度摘要已接入

## Feature Goal

把新人、会友、课程、小组、读经、讲道回应和服事串成一条可跟进的门徒成长路径，帮助教会围绕“造就门徒、差派工人、领人归主”做长期牧养。

`discipleship_journey` 是编排层 feature。它不复制其他 feature 的业务内容，只保存路径、阶段、任务引用、分配和进度。

## Non-Goals

- 不替代课程系统。
- 不替代小组、服事、关怀或新人跟进。
- 不保存圣经正文、讲道全文、课程资料或奉献数据。
- 不把属灵成长简化为游戏化积分或公开排名。
- 不让 App 自己决定任务是否完成。

## Owners

- Product owner：牧养团队和门训同工。
- Backend owner：discipleship journey service。
- Surface owners：App Mine/Life，Admin People/Ministry。
- Source of truth owner：backend discipleship journey repository。

## Source Of Truth

路径模板、阶段、任务引用、成员路径分配、任务进度、负责人和状态流转以后端 discipleship journey repository 为准。

App 和 Admin Web 展示的任务总数与已完成数以后端 assignment summary 为准：

- `taskTotalCount` 来自当前 journey 下的任务数量。
- `completedTaskCount` 来自该 assignment 的 canonical task progress。
- App 不使用本地 `progress.length` 推断总任务数。

成员读取使用独立 member projection，不返回 user/source 关联、负责人后台 ID
或 progress note。Admin assignment contract 仍保留这些牧养字段。

被引用内容的 source of truth 仍归原 feature：

- 读经内容归本地 Bible 数据和 `reading_plan`。
- 讲道内容归 `sermon_publishing` / `sermon_discovery`。
- 课程归 `course_learning`。
- 小组归 `group_ministry`。
- 服事归 `serving_schedule`。
- 新人状态归 `newcomer_followup`。
- 关怀记录归 `pastoral_care`。

## State Model

Journey template：

- `draft`
- `active`
- `paused`
- `archived`

Journey assignment：

- `not_started`
- `in_progress`
- `blocked`
- `completed`
- `paused`
- `cancelled`

Journey task：

- `locked`
- `available`
- `in_progress`
- `completed`
- `skipped`
- `needs_review`

Task reference type：

- `reading_plan`
- `sermon`
- `sermon_discussion_guide`
- `course`
- `group_application`
- `serving_assignment`
- `event_registration`
- `care_request`
- `manual_review`

## Capability Contracts

- `notification_delivery` 用于路径分配、卡住提醒和完成提醒。
- `scheduled_notification` 用于阶段性提醒。
- `data_export` 用于门训进度导出。
- `audit_log` 用于管理员分配、跳过、重置和完成确认。

## App Surface Boundary

App 可以：

- 展示“我的成长路径”。
- 展示当前阶段、下一步任务、后端汇总的完成状态和负责人提示。
- 跳转到被引用的读经、讲道、课程、小组、活动、服事或关怀入口。
- 提交用户可完成任务的 intent，例如“我已阅读”“我想联系同工”。

App 不可以：

- 自己判定后端任务完成。
- 复制课程、小组、服事或讲道内容。
- 显示其他成员的成长进度。
- 暴露牧养备注。

## Admin Web Surface Boundary

Admin Web 可以：

- 创建和维护成长路径模板。
- 回读、查看、配置阶段和任务引用。
- 给新人或会员分配路径。
- 指定负责人。
- 查看进度、卡点和待跟进项。
- 手动更新任务状态、备注、确认、跳过或标记待复核。

Admin Web 不拥有完成规则；所有状态迁移通过后端 service。

后台只能分配 `active` 成长路径；`draft`、`paused`、`archived` 只能维护模板或保留历史，不能创建新的 assignment。

## Backend Service Boundary

后端负责：

- 路径模板和任务引用校验。
- 按稳定顺序返回路径阶段和任务结构。
- 成员路径分配。
- 任务状态机。
- 任务从 `completed` 改为其他状态时清空默认 `completedAt`。
- `completedAt` 完全由后端根据任务状态设置或清空，客户端不能提交时间。
- 被引用资源的存在性和权限校验。
- 通过只读 reference directory 向原 feature repository 校验引用存在性；
  `group_application` 使用 `groupId:applicationId`，`event_registration`
  使用 `lifePostId:registrationId` 复合稳定引用。
- member assignment 必须引用真实会员且不带 sourceId；newcomer assignment
  必须携带真实 newcomer sourceId。
- 负责人和提醒规则。
- 审计和错误映射。

后端不得复制被引用 feature 的私有数据，只保存稳定引用和当前进度。

## Side Effects

- 路径分配通知。
- 卡住或逾期提醒。
- 管理员手动状态变更审计。
- 门训进度导出。

## Lifecycle And Recovery

路径模板可以从草稿发布，发布后可新增后续阶段，但修改已分配路径时必须保留版本或变更审计。

被引用资源下架或归档后，相关任务进入 `needs_review` 或 `blocked`，不自动删除成员进度。管理员可以替换任务引用、跳过任务或重新分配路径。

## Error Model

- `discipleship_journey_not_found`
- `discipleship_task_not_found`
- `discipleship_assignment_not_found`
- `discipleship_assignment_closed`
- `discipleship_reference_invalid`
- `discipleship_source_invalid`
- `discipleship_transition_invalid`
- `discipleship_permission_denied`
- `discipleship_task_blocked`

## Main Logic Chain

管理员创建路径模板 -> 配置阶段和任务引用 -> 发布路径 -> 给新人或会员分配路径 -> App 显示当前阶段和下一步 -> 用户完成被引用 feature 的动作 -> 后端更新 canonical progress -> 需要人工确认时进入待审核 -> 完成路径后推荐下一条路径、小组或服事。

## Failure Chains

- 被引用课程、讲道或小组不存在时，任务不能发布。
- 被引用资源下架后，已分配任务进入 `needs_review`，App 不展示失效入口。
- 用户无权限访问某任务资源时，后端返回 permission denied，不由 App 隐藏。
- 重复完成同一任务必须幂等。
- 管理员跳过任务必须写审计。
- 通知失败不改变任务状态，只进入通知重试链路。

## Verification Checklist

- 路径不复制其他 feature 的业务数据。
- 任务引用能追到原 feature owner。
- App 只展示自己的路径。
- Admin 手动状态变更有审计。
- 卡住、跳过、完成和资源失效都有稳定状态。
- 通知失败不影响路径 canonical state。

## Related Docs

- [../domains/discipleship_journey.md](../domains/discipleship_journey.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [../domains/privacy.md](../domains/privacy.md)
- [newcomer_followup.md](newcomer_followup.md)
- [reading_plan.md](reading_plan.md)
- [sermon_discussion_guide.md](sermon_discussion_guide.md)
- [group_ministry.md](group_ministry.md)
- [course_learning.md](course_learning.md)
- [serving_schedule.md](serving_schedule.md)
- [pastoral_care.md](pastoral_care.md)
- [notification_delivery.md](notification_delivery.md)
