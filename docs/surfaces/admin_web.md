# Admin Web Surface

状态：管理 Web 表达层边界

## Purpose

管理 Web 是教会同工和管理员的工作台，负责内容、活动、签到、小组、课程、服事排班、讲道、代祷、关怀、奉献、专项基金、年度证明、通知、任务、统计和审计的操作表达。三阶段已增加新人跟进、成长路径、读经计划和讲道讨论包的第一版管理入口，但页面仍只提交 intent，最终状态由后端 service 决定。

## Can Do

- 登录和显示管理员会话。
- 展示列表、详情、统计和任务状态。
- 提交创建、编辑、发布、下架、导出、重试等 intent。
- 上传文件到后端授权路径。
- 展示后端返回的错误、证据和下一步。

## Must Not Do

- 直接连接 Postgres。
- 直接调用 Stripe secret API。
- 直接访问对象存储私有桶。
- 直接调用 AI、通知、转录或外部 provider。
- 自己判断最终财务、报名、发布或审核状态。
- 自己判断小组成员、课程报名、服事排班、关怀隐私或通知投递最终状态。
- 只靠隐藏按钮实现权限。

## Required Pattern

```text
page/dialog/table
-> feature API helper
-> shared admin API client
-> backend admin API
-> backend service
```

## Current Route Map

真实路由定义在 `apps/admin_web/src/router.ts`。每个受保护页面必须声明
`AdminPermission`，菜单隐藏不能替代 route guard 和后端权限判断。

| Route | Page | Permission | API helper |
| --- | --- | --- | --- |
| `/login` | `LoginPage` | `auth-layout` | `core/api/auth.ts` |
| `/access-denied` | `AccessDeniedPage` | authenticated fallback | none |
| `/` | `DashboardPage` | `dashboard:read` | `core/api/dashboard.ts` |
| `/sermons` | `SermonsPage` | `sermons:read` | `core/api/sermons.ts` |
| `/sermon-discussion-guides` | `SermonDiscussionGuidesPage` | `sermon_guides:read` | `core/api/sermon_discussion_guides.ts` |
| `/bible-knowledge` | `BibleKnowledgePage` | `bible_knowledge:read` | `core/api/bible_knowledge.ts` |
| `/bible-notes` | `BibleNotesPage` | `bible_notes:read` | `core/api/bible_verse_notes.ts` |
| `/reading-plans` | `ReadingPlansPage` | `reading_plans:read` | `core/api/reading_plans.ts` |
| `/discipleship` | `DiscipleshipPage` | `discipleship:read` | `core/api/discipleship.ts` |
| `/life-posts` | `LifePostsPage` | `life_posts:read` | `core/api/life_posts.ts` |
| `/prayer` | `PrayerPage` | `prayer:read` | `core/api/prayer_requests.ts` |
| `/giving` | `GivingPage` | `giving:read` | `core/api/giving.ts` |
| `/groups` | `GroupsPage` | `groups:read` | `core/api/groups.ts` |
| `/courses` | `CoursesPage` | `courses:read` | `core/api/courses.ts` |
| `/serving` | `ServingPage` | `serving:read` | `core/api/serving.ts` |
| `/members` | `MembersPage` | `users:read` | `core/api/members.ts` |
| `/newcomers` | `NewcomersPage` | `newcomers:read` | `core/api/newcomers.ts` |
| `/care` | `CarePage` | `care:read` | `core/api/care.ts` |
| `/users` | `UsersPage` | `users:read` | `core/api/admin_users.ts` |
| `/ai` | `AiManagementPage` | `ai:read` | `core/api/ai.ts` |
| `/audit` | `AuditLogsPage` | `audit:read` | `core/api/audit_logs.ts` |
| `/jobs` | `JobsPage` | `jobs:read` | `core/api/jobs.ts` |
| `/media` | `MediaPage` | `media:read` | `core/api/media.ts` |
| `/notifications` | `NotificationsPage` | `notifications:read` | `core/api/notifications.ts` |
| `/settings` | `SettingsPage` | `settings:read` | `core/api/settings.ts` |

Bible Notes moderation keeps filter drafts separate from applied query values,
preserves already loaded notes when a background refresh fails, and targets
hide/restore commands by the selected note's backend-owned id. The Admin Web
does not infer authorship, restore deleted notes, or duplicate moderation rules.

Care management keeps search controls as drafts until they are explicitly
applied. The page owns assignee and follow-up queries, mutation permissions, and
selection context guards; its drawer is presentation-only. Assignee loading,
follow-up history loading, request updates, and new follow-up commands expose
independent recovery states so one failure cannot hide unrelated care data or
write a late result into a newly selected request.

Life posts 的活动报名卡片负责现场签到二维码的生成、轮换和打印；二维码凭证走
`life_posts.ts` API helper，报名名单和导出需要 `life_posts:update`，最终签到状态仍以后端
`event_registrations` 为准。名单使用后端 `total/limit/offset` 分页；只有
`life_posts:read` 的只读账号不发起隐私名单请求。操作区必须表达 loading、empty、error、
确认和成功状态，CSV 直接下载为文件。

Surface rule:

- Route pages are loaded with dynamic imports so authentication, the shell,
  and the active workspace do not pull every Feature into the initial bundle.
  Stable framework, Vuetify, and content-tool dependencies use separate vendor
  chunks; route permissions and backend authorization remain unchanged.
- `router.beforeEach` enforces authentication and redirects users without page
  permission to the first allowed admin route. Authenticated accounts with no
  readable workspace land on `/access-denied` instead of an aborted navigation;
  the backend remains authoritative for every protected request.
- Admin Web can be deployed at `/` on its own domain or at `/admin/` on a
  one-IP test server. `VITE_ADMIN_BASE_PATH` is the single frontend source of
  truth for the router history base and Vite asset base.
- Feature pages call `core/api/*` helpers and may only keep local form, drawer,
  selection, snackbar, and table state.
- Standard feature headers use the shared Core page-header layout for title,
  subtitle, and responsive action placement. The owning Feature still supplies
  localized copy, permission checks, loading state, and action handlers.
- Repeated summary metrics use the shared responsive metric grid. Features must
  supply already calculated and localized labels, values, icons, and semantic
  tones; the shared component does not query data or derive business meaning.
- Admin Web UI supports English, Spanish, Simplified Chinese, and Traditional
  Chinese. First load follows the browser/system locale; a manual locale choice
  is persisted in local storage.
- The shell groups permission-filtered routes into Dashboard, Content, Ministry,
  Giving, People, and System workspaces. Its command search uses the same shared
  navigation registry and the role-filtered `/v1/admin/search` projection, so hidden
  routes or unauthorized resources cannot reappear through search. Desktop keeps
  search in the app bar; compact layouts reuse the same component and query inside
  the navigation drawer instead of maintaining a second mobile search flow.
- Feature detail and editor drawers use the shared responsive drawer shell. Each
  feature may choose its desktop width, while the shell caps the surface at the
  mobile viewport width and retains Vuetify's temporary-drawer behavior.
- People workspaces render member, newcomer, and care result arrays as desktop
  tables and compact mobile records. Both projections emit the same page-owned
  detail intent and share Core loading, error, retry, and empty presentation.
  Their pages retain query retry, selection, permission, and mutation ownership.
  Member filters keep draft input separate from the applied query snapshot;
  member detail failures remain retryable in the drawer, and late responses from
  a previously selected or closed member cannot replace the current editor.
- System workspaces apply the same rule to notification deliveries, admin users,
  and audit logs. Operational commands and sensitive detail remain page-owned;
  responsive result components only present records and emit detail intents.
- Admin user creation and editing use presentation-only forms while the page owns
  permissions, API commands, canonical session refresh, and stale-response guards.
  Password confirmation is UI validation only; the backend remains authoritative
  for roles and account status. Resetting the current account password ends the
  current browser session, while changing its role reloads permissions from the
  backend before the shell continues.
- Notification delivery filters keep editable drafts separate from applied query
  snapshots and use the backend cursor through an infinite query. The page owns
  retry/cancel commands, command context, permission checks, and recovery feedback;
  filter and detail components only render state and emit intents. Background
  refresh failures preserve already loaded delivery records.
- Audit log filters follow the same draft/applied boundary and consume the
  backend `createdAt + id` cursor through an infinite query. The results and
  detail drawer are presentation-only; background refresh failures preserve
  already loaded audit records and the page never reconstructs audit history.
- System result projections use the shared Admin data-state presentation for
  loading, error, retry, and empty feedback. The shared component owns no query,
  permission, or transport state; each page connects retry to its own query.
- Bible note and sermon discussion response moderation preserve the same
  responsive and query-state rule. Their pages keep filters, moderation
  permissions, retries, and mutation feedback separate from list errors.
- The Life post editor delegates details, publish readiness, and notification
  fields to presentation-only components. `LifePostsPage` and its controller
  retain permission checks, translation requests, AI application, and all
  create, update, review, publish, archive, and delete mutations.
- Settings uses presentation-only group and editor components. The page retains
  query ownership, permissions, value parsing, locale side effects, and the
  canonical update mutation for both ordinary and public-landing settings.
  Editable filters remain separate from the applied query snapshot, and a
  background refresh failure preserves already loaded settings. Editor results
  are accepted only for the active setting context; editor parsing and update
  errors remain scoped to the editor drawer.
- Reading Plans keeps filters, plan results, and base fields in focused
  presentation components. The page remains the owner of queries, mutations,
  permission checks, content locks, day rules, and assignment eligibility.
- Bible Knowledge delegates entity fields and section editing to a
  presentation-only editor. The page retains CRUD, permissions, section
  normalization, verse-alias JSON parsing, and canonical request payloads.
- Sermon Discussion Guides delegates filters and guide results to presentation
  components. The page retains revision-safe guide mutations, status rules,
  localization, response queries, and moderation commands.
- Shared Admin date helpers format API timestamps with the active interface
  locale and preserve invalid source values for diagnosis. Desktop and mobile
  projections must not render raw ISO timestamps or browser-default dates.
  Mobile projections never widen content visibility or duplicate moderation state;
  they invoke the same page-owned detail or hide command used by desktop views.
- Admin authentication changes clear the shared query cache before another session
  can render role-scoped results. Search and recent-content links identify a record
  with `?open=<resourceId>`; the destination Feature owns detail loading and errors.
- Admin login keeps local email validation, password visibility, pending state, and
  safe internal redirects in the auth surface. Password changes use the dedicated
  auth dialog, require matching confirmation, clear transient state whenever it is
  closed, and return to login after the Backend accepts the change.
- The public `app.defaultLocale` setting can be `system`, `en`, `es`,
  `zh-Hans`, or `zh-Hant`. `system` means client surfaces should follow the
  device or browser locale.

## Feature Connections

- AI content assist：讲道、生活内容和发布通知编辑器只提交受控 draft intent；
  AI 管理工作台以响应式摘要和使用记录展示 token 用量，时间遵循后台当前语言，
  不展示完整 prompt、正文或 API Key，也不在 UI 内计算费用。
  Provider 编辑器只允许对已持久化记录执行连接测试；切换记录会清除旧测试结果，
  保存后仍以 Backend 返回的 Provider 为准。
  管理数据加载使用共享可重试状态；Provider、策略、预算和连接测试错误保持为
  操作级反馈，不会以零指标或空面板掩盖查询失败。
  模型策略以每项 capability 的响应式卡片编辑，Token 限额独立呈现；组件只发出
  保存 intent，权限、mutation、缓存失效和最终校验仍由页面及 Backend 持有。
  可编辑结果必须由管理员明确应用或丢弃，切换对象、task、locale 或源内容后旧结果
  失效。正式保存、审核和发布仍归原 feature，Admin Web 不直连 provider。
- Sermon publishing：创建草稿、上传、审核、发布，并查看或重试后端拥有的音频对象清理任务；管理 Web 不读取私有对象路径，也不把重试结果当成本地讲道状态。
- Sermon discovery：通过后端 facets 复用已发布讲员、系列和主题目录；可按主题精确筛选讲道，并在新建或编辑讲道时维护主题。页面不保存第二份主题目录。
- Bible knowledge：Content 工作区维护人物、地点和读经辅助资料，不编辑本地圣经
  正文。目录筛选只有在管理员明确应用后才请求；查询失败不显示为空目录，已有结果
  刷新失败时保留数据并可局部重试。更新和删除始终使用已选实体自身的 locale 与
  translation key，不能使用尚未应用的筛选草稿定位记录。
- Church life publishing：创建生活内容、审核、发布、下架和归档。内容目录筛选使用
  草稿和已应用查询快照；应用、清除和重试是三个独立 intent。首次查询失败显示可恢复
  状态，已有目录刷新失败时保留 canonical 列表，且不与编辑、发布、媒体或报名命令
  错误合并。
- Event registration：创建活动、查看名单、报名管理和导出。
- Event attendance：扫码签到、手动补签、出席状态、缺席和导出。
- Group ministry：Groups 页面左侧选择/编辑小组，右侧工作台按申请、成员、材料和
  出席分区；页面经 `groups.ts` 与 `group_activity.ts` helper 提交 intent，并在
  mutation 后刷新 canonical 小组和子资源。左侧目录使用共享查询状态表达，页面
  保留筛选、重试和选择 owner；筛选草稿只有在明确应用后才成为查询快照，刷新失败
  保留已有列表和选择，子资源与 mutation 错误不会替换目录状态。
- Group ministry v2：Admin 已接入成员状态、材料分配和出席记录；小组长 App
  工作台、关怀提醒和小组通知仍归 group ministry feature 后续阶段。
- Course learning：Courses 页面维护课程、课次、报名名单和学习进度；mutation 后必须
  刷新 canonical 课程及子资源。左侧课程目录使用共享 loading、empty、error 和 retry
  表达，页面保留查询 owner；筛选草稿与已应用快照分离，刷新失败保留已有列表和选择。
  资料和逐课次出勤后续接入。
- Serving schedule：Serving 页面通过 canonical member picker 维护团队、岗位和排班，
  并在同一工作区查看、筛选和写入可用时间与到岗状态；页面不提交成员姓名/邮箱
  快照，也不自己决定冲突和签到时间。
- Serving schedule v2：完整换班替补状态机、缺口摘要、导出和提醒 dedupe 继续归
  Serving 页面，不新增独立 feature；这些链路接入前不显示假的本地操作。团队岗位、
  排班、可用时间和到岗使用独立可恢复查询状态，区域失败不渲染成空表；命令错误与
  查询错误分开反馈。
- Newcomer follow-up：People 工作区管理新朋友队列、负责人、跟进记录、邀请和转会员 intent；列表使用显式应用的筛选快照，列表和详情刷新失败均保留最后一次成功数据并在各自上下文恢复。
- Discipleship journey：People/Ministry 工作区维护路径模板、阶段、任务引用、分配和
  进度审查。路径目录查询使用可重试状态，目录失败不显示成空结果；阶段、任务、分配
  查询和操作错误保留在当前工作区反馈。
- Reading plan：Content/Ministry 工作区维护读经计划和每日经文引用，不编辑圣经正文。
  计划目录、日程和个人分配使用独立可重试查询状态；查询失败不显示为空结果，保存
  与分配命令错误继续由页面单独反馈。
- Sermon discussion guide：Content/Ministry 工作区维护讨论包、人工审核，并可用现有
  目标 ID 分配；后端校验目标存在。当前尚无目标选择器和本 feature 专用 AI 草稿
  action。页面只审核明确共享给小组的回应，私密回应不进入 Admin surface；页面按
  canonical status 提示允许迁移并锁定 published/archived 内容，但 Backend service
  仍拥有 transition 规则。讨论包目录与回应列表分别呈现 loading、empty、error、
  retry，查询失败不冒充空结果，也不与保存或隐藏回应的命令错误合并。
- Prayer moderation：待审核、批准、隐藏、归档和隐私可见性。
- Prayer moderation workspace：列表、摘要和审核抽屉只通过
  `prayer_requests.ts` helper 提交 intent；普通保存只修改 visibility、group
  scope 和审核备注，状态由 Approve/Hide/Archive 明确动作改变。Approve 原子提交
  当前审核表单和通知 intent，删除敏感内容前必须二次确认。列表筛选草稿只有明确
  应用后才成为查询快照，刷新失败保留已有敏感内容。审核命令互斥并携带发起时的
  request id；延迟结果不能重新打开、覆盖或关闭管理员后来选择的记录。
- Giving flow：查看交易、费用、退款、争议、payout、对账。交易、年度证明、
  Provider 事件、基金和对账筛选先保留为可编辑草稿，只有管理员明确应用后才成为
  后端查询快照；交易导出必须使用当前已应用快照，不能读取尚未应用的输入值。
  首次查询失败使用可重试错误状态，已有财务记录刷新失败时保留记录并局部提示；
  下载、导出、生成和保存等命令错误不得替换对应查询结果。
- Giving funds：维护奉献用途、专项基金、目标和统计。
- Annual statement：生成、重生成、下载、导出、审计。
- Member profile：会员资料、角色、状态、设备 token 和导出。
- Pastoral care：Care 页面展示关怀队列，提交负责人、状态、隐私等级、下一步、内部备注和跟进记录 intent；最终权限、状态和审计以后端为准。
- Notification delivery：通知任务、失败重试、取消和审计。
- System diagnostics：任务管线、统计和任务队列使用独立可恢复查询状态；首次失败不显示
  虚假的零统计或空队列，已有快照刷新失败时保留旧数据并显示错误。筛选草稿只有在管理员
  明确应用后才成为查询条件，查询重试与后台任务重试是两个不同 intent。
- Ministry analytics：Dashboard 展示后端按角色过滤的今日待办、精确聚合指标、
  最近更新内容、任务健康、fresh/stale 快照和 drill-down；Admin 只负责本地化和
  格式化，不自行推算指标或跨 Feature 合并列表。最近更新在桌面使用表格，在窄屏
  使用同一数据源的紧凑信息行，二者必须打开同一条 Feature 深链。首次查询失败使用
  可重试状态；已有快照时刷新失败仍保留上次数据并显示告警，不能退化为空看板。
  趋势和统计导出尚未接入。
- Public landing settings：Settings 页面维护官网身份、导航、新朋友入口、
  固定日程、公开人员介绍、聚会地图链接、联系方式、社交媒体和 App 下载入口；
  近期活动由 Life 中已发布的公开活动动态投影，不在 Settings 重复维护。公开官网只
  读取后端聚合后的 `/v1/public/landing?locale=...`。简体中文保留基础 key，例如
  `publicLanding.contact`；其他语言使用 locale key，例如
  `publicLanding.es.contact` 和 `publicLanding.zh-Hant.contact`。
  固定日程、公开人员和活动区文案使用结构化表单；其他低频配置保留高级 JSON
  编辑器。两种编辑方式都通过同一 Settings API 保存，并由后端契约最终校验。
  重复展示项统一编辑 `sort` 优先级，默认 `0`，数值越大越靠前；固定日程和人员
  直接显示数值字段，其他高级配置在受契约校验的 JSON 编辑器中维护。
- Media management：Media 页面使用 `media:read` 展示统一图片库和对象清理任务；
  `media:manage` 可上传、编辑无障碍/版权/焦点元数据，并撤销或恢复发布授权。页面不显示
  storage key，不直连 R2，也不在引用关系尚未规范化时提供物理删除。筛选草稿与已应用
  查询分离，页面 controller 统一持有上传、编辑、usage 查询和清理重试；卡片只表达 UI
  意图。首次加载、刷新和命令错误分别呈现，刷新失败保留已有投影，过期命令结果不得影响
  后来打开的图片上下文。桌面表格与移动端紧凑列表消费同一安全投影。

## Verification

- Provider secrets 不进入前端 bundle。
- 所有高风险动作经后端权限判断。
- 高风险动作有审计。
- 页面刷新 canonical state，不用本地状态假装成功。
