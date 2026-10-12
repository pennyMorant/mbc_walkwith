# Reading Plan

状态：个人计划、模板分配、进度和执行历史已接入；个人创建、提醒、批量受众分配、完成率导出和结构修订尚未接入

## Feature Goal

让每位用户拥有并执行自己的每日读经计划，使用本地经文、TTS 和个人进度稳定读经。后台维护的计划只作为可复用模板或推荐来源；用户加入后产生的个人 assignment 才是 App 中的计划实例，并可被成长路径、小组或课程引用。

## Non-Goals

- 不保存圣经正文。
- 不替代本地 Bible reader。
- 不替代公开经文心得 feature。
- 不把 AI 解释当作教会教义。
- 不要求用户登录才能读公开计划，但跨设备进度需要会员身份或受控 external user id。

## Owners

- Product owner：牧养和读经计划同工。
- Backend owner：reading plan service。
- Surface owners：App Study/Mine，Admin Content/Ministry。
- Source of truth owner：backend reading plan repository。

## Source Of Truth

计划模板和每日经文引用以后端 reading plan repository 为准。用户的个人计划实例、提醒偏好、完成状态和计划级进度以个人 assignment 为准；未加入的模板不能作为用户首页内容。

经文正文仍归 App 本地 Bible 数据；本地笔记和公开经文心得分别归 Study local store 与 `bible_verse_notes`。

## State Model

Plan：

- `draft`
- `published`
- `paused`
- `archived`

允许迁移：

```text
new -> draft
draft -> draft | published | archived
published -> published | paused | archived
paused -> paused | draft | published | archived
archived -> archived | draft
```

Assignment：

- `not_started`
- `active`
- `completed`
- `paused`
- `abandoned`

每次加入计划形成一个独立 attempt。同一用户和计划同时最多只有一个
`not_started`、`active` 或 `paused` assignment；`completed` 和 `abandoned`
是不可变历史，重新开始会创建 attempt number 递增的新 assignment。

Day progress：

- `available`
- `completed`
- `missed`

## Capability Contracts

- `tts_playback` 用于 App 本地经文朗读。
- `notification_delivery`、`scheduled_notification` 和 `data_export` 属于
  后续能力；当前 Reading Plan feature 未调用通知、定时任务或导出 provider。

## App Surface Boundary

App 可以：

- 在 Study 首页只展示当前用户 `not_started` 或 `active` 的个人 assignment。
- 没有进行中的个人 assignment 时，不渲染 Study 的 Reading Plan section，
  也不请求 published plan 模板，避免把教会模板误呈现为用户任务。
- assignment 或其对应 plan 请求/契约失败时，保留可重试错误状态，不能伪装成空任务。
- 展示今日读经。
- 在“我的 > 读经计划”分别展示进行中和历史记录，并读取历史详情。
- 对已完成或已放弃的计划发起重新开始，创建新的个人 assignment。
- 历史列表必须消费后端 `nextCursor`，不能只展示首屏记录；只有后端详情明确
  `canRestart` 时才显示重新开始操作。
- 根据后端经文引用从本地 Bible 数据读取正文。
- 调用 TTS 朗读本地经文。
- 提交个人计划的每日完成 intent。
- 从计划进入经文心得、AI 查经或讲道关联。

当前第一版不在 Study 首页展示未加入的公开模板。个人创建和独立的模板发现入口属于后续产品面，不得重新混入首页。

App 不可以：

- 从后端接收圣经正文作为 canonical text。
- 自己判断跨设备完成状态。
- 把本地临时进度当成后端 source of truth。
- 将畸形 plan、day、assignment、progress 或 envelope 静默转换为空列表、
  默认状态或未加入状态。

未登录和 external installation identity 的公开列表都只能返回 `public` 计划；
只有有效会员会话可以在列表中看到 `members` 计划。

## Admin Web Surface Boundary

Admin Web 可以：

- 创建计划、计划天数和经文范围。
- 发布、暂停、归档计划。
- 给具体 member 或 external user 创建个人分配。
- 查看个人分配和每日进度。

Admin Web 不编辑圣经正文。

后台分配只允许 `published` 计划；`members` 可见计划只能分配给会员身份，不能分配给 external user id。
`sourceType/sourceId` 当前只是个人分配的来源归因，不会自动展开小组、课程或
成长路径成员；批量受众分配仍待独立链路。
member assignment 必须引用真实存在的 member；external assignment 继续使用
App installation 的受控 external user id。

## Backend Service Boundary

后端负责：

- 计划和每日经文引用校验。
- 分配和进度状态机。
- 权限、可见性和审计。
- 给 App 返回 bookId、chapter、verse range 等引用，不返回经文正文。
- 强制新计划从 draft 开始；发布前必须具有连续的
  `1..durationDays` 日程。
- published/archived 内容和日程不可原地修改；日程只能在 draft/paused
  编辑，且 `dayNumber` 不得超过 durationDays。
- 首个 assignment 创建后锁定 days、durationDays、visibility 和 locale，避免
  已有进度分母、guest 权限或本地译本语义漂移；暂停后仍可修正标题和说明。
- 只有 published plan 且 assignment 非 paused/completed/abandoned 时可写每日进度。
- assignment 创建时保存计划标题和总天数快照；快照只服务历史展示，计划模板仍是当前内容唯一事实来源。
- 完成或放弃时写入 `endedAt`；历史查询按结束时间倒序分页。
- assignment 状态切换和进度写入必须在 repository 事务内重验当前状态，不能让
  并发暂停、放弃或完成请求覆盖不可变历史。

## Side Effects

- 当前：计划创建/更新、日程 upsert 和 Admin 个人分配审计。
- 规划：计划发布通知、每日提醒和完成率导出。

## Lifecycle And Recovery

计划草稿可编辑，配齐所有日程后才能发布。已发布计划必须先暂停才能编辑；
归档计划必须先恢复 draft。当前尚无带 correction evidence 的结构修订模型，
因此首个 assignment 后也不能覆盖日程或改变 duration/visibility/locale。

## Error Model

- `reading_plan_not_found`
- `reading_plan_day_not_found`
- `reading_plan_reference_invalid`
- `reading_plan_assignment_not_found`
- `reading_plan_assignment_closed`
- `reading_plan_transition_invalid`
- `reading_plan_permission_denied`
- `reading_plan_publish_incomplete`
- `reading_plan_day_out_of_range`
- `reading_plan_structure_locked`
- `reading_plan_progress_closed`
- `reading_plan_assignment_user_not_found`

## Main Logic Chain

管理员创建可复用 draft 模板 -> 配置完整每日经文引用 -> 后端校验后发布 ->
用户主动加入或 Admin 为具体用户分配 -> 后端创建个人 assignment attempt -> Study 只展示
该用户进行中的 assignment -> App 用本地 Bible 数据展示正文和 TTS -> 用户完成
当天 -> 后端记录个人 progress -> 完成后形成不可变历史 -> Mine 可查看历史或重新开始。

## Failure Chains

- 经文引用不在本地支持译本范围内时，App 展示引用错误状态并不上报完成。
- 未登录用户可阅读公开计划，但跨设备进度需要 external user id 或登录。
- 重复完成同一天必须幂等。
- 同一 plan/user 存在进行中 assignment 时，重复或并发 self-assign 返回同一个 canonical assignment。
- 完成或放弃后再次 self-assign 创建递增 attempt，不能复用或改写历史。
- Admin 不能为不存在的 member ID 创建 assignment。
- 缺少任一天或存在越界 dayNumber 时不能发布。
- published/archived 内容不能原地修改，必须按状态机退出锁定状态。
- 首个 assignment 后，影响进度和权限语义的计划结构不能修改。
- plan 暂停/归档或 assignment paused/abandoned 时拒绝进度写入。
- 计划归档后不再接受新分配，已有进度保留。
- App 收到畸形响应时进入可重试错误态；assignment 未加载成功前不得暴露
  开始计划、阅读当天或完成当天操作。

## Verification Checklist

- 后端不保存圣经正文。
- App 根据引用读取本地经文。
- 计划进度跨设备以后端为准。
- 新计划只能从 draft 开始，完整日程是发布前置条件。
- 日程范围和 published/archived 内容锁由 Backend 强制。
- assignment 后结构锁和 progress 可写状态由 Backend 强制。
- member target 存在性和 assignment 并发幂等由 Backend repository/service 强制。
- App DTO 和 envelope parser 拒绝缺失、错误类型、未知枚举和畸形嵌套项；
  Study、详情和 Mine sibling surface 不把解析失败当作空数据或未加入。
- 计划引用可作为 discipleship task reference，但当前不自动创建 Reading Plan assignment。
- 计划创建/更新、日程 upsert 和 Admin 个人分配有审计。

## Related Docs

- [../domains/reading_plan.md](../domains/reading_plan.md)
- [../domains/bible_content.md](../domains/bible_content.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [bible_tts.md](bible_tts.md)
- [bible_verse_notes.md](bible_verse_notes.md)
- [ai_bible_study.md](ai_bible_study.md)
- [discipleship_journey.md](discipleship_journey.md)
- [notification_delivery.md](notification_delivery.md)
