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
| `/notifications` | `NotificationsPage` | `notifications:read` | `core/api/notifications.ts` |
| `/settings` | `SettingsPage` | `settings:read` | `core/api/settings.ts` |

Life posts 的活动报名卡片负责现场签到二维码的生成、轮换和打印；二维码凭证走
`life_posts.ts` API helper，报名名单和导出需要 `life_posts:update`，最终签到状态仍以后端
`event_registrations` 为准。名单使用后端 `total/limit/offset` 分页；只有
`life_posts:read` 的只读账号不发起隐私名单请求。操作区必须表达 loading、empty、error、
确认和成功状态，CSV 直接下载为文件。

Surface rule:

- `router.beforeEach` enforces authentication and redirects users without page
  permission to the first allowed admin route.
- Admin Web can be deployed at `/` on its own domain or at `/admin/` on a
  one-IP test server. `VITE_ADMIN_BASE_PATH` is the single frontend source of
  truth for the router history base and Vite asset base.
- Page-level permission fallback is still a UX polish area; backend permission
  checks remain authoritative.
- Feature pages call `core/api/*` helpers and may only keep local form, drawer,
  selection, snackbar, and table state.
- Admin Web UI supports English, Spanish, Simplified Chinese, and Traditional
  Chinese. First load follows the browser/system locale; a manual locale choice
  is persisted in local storage.
- The public `app.defaultLocale` setting can be `system`, `en`, `es`,
  `zh-Hans`, or `zh-Hant`. `system` means client surfaces should follow the
  device or browser locale.

## Feature Connections

- AI content assist：讲道、生活内容和发布通知编辑器只提交受控 draft intent；
  可编辑结果必须由管理员明确应用或丢弃，切换对象、task、locale 或源内容后旧结果
  失效。正式保存、审核和发布仍归原 feature，Admin Web 不直连 provider。
- Sermon publishing：创建草稿、上传、审核、发布，并查看或重试后端拥有的音频对象清理任务；管理 Web 不读取私有对象路径，也不把重试结果当成本地讲道状态。
- Sermon discovery：通过后端 facets 复用已发布讲员、系列和主题目录；可按主题精确筛选讲道，并在新建或编辑讲道时维护主题。页面不保存第二份主题目录。
- Church life publishing：创建生活内容、审核、发布、下架和归档。
- Event registration：创建活动、查看名单、报名管理和导出。
- Event attendance：扫码签到、手动补签、出席状态、缺席和导出。
- Group ministry：Groups 页面左侧选择/编辑小组，右侧工作台按申请、成员、材料和
  出席分区；页面经 `groups.ts` 与 `group_activity.ts` helper 提交 intent，并在
  mutation 后刷新 canonical 小组和子资源。
- Group ministry v2：Admin 已接入成员状态、材料分配和出席记录；小组长 App
  工作台、关怀提醒和小组通知仍归 group ministry feature 后续阶段。
- Course learning：Courses 页面维护课程、课次、报名名单和学习进度；mutation 后必须刷新 canonical 课程及子资源，查询需表达 loading、empty 和 error；资料和逐课次出勤后续接入。
- Serving schedule：Serving 页面通过 canonical member picker 维护团队、岗位和排班，
  并在同一工作区查看、筛选和写入可用时间与到岗状态；页面不提交成员姓名/邮箱
  快照，也不自己决定冲突和签到时间。
- Serving schedule v2：完整换班替补状态机、缺口摘要、导出和提醒 dedupe 继续归
  Serving 页面，不新增独立 feature；这些链路接入前不显示假的本地操作。
- Newcomer follow-up：People 工作区管理新朋友队列、负责人、跟进记录、邀请和转会员 intent。
- Discipleship journey：People/Ministry 工作区维护路径模板、阶段、任务引用、分配和进度审查。
- Reading plan：Content/Ministry 工作区维护读经计划和每日经文引用，不编辑圣经正文。
- Sermon discussion guide：Content/Ministry 工作区维护讨论包、人工审核，并可用现有目标 ID 分配；后端校验目标存在。当前尚无目标选择器和本 feature 专用 AI 草稿 action。页面只审核明确共享给小组的回应，私密回应不进入 Admin surface；页面按 canonical status 提示允许迁移并锁定 published/archived 内容，但 Backend service 仍拥有 transition 规则。
- Prayer moderation：待审核、批准、隐藏、归档和隐私可见性。
- Prayer moderation workspace：列表、摘要和审核抽屉只通过
  `prayer_requests.ts` helper 提交 intent；普通保存只修改 visibility、group
  scope 和审核备注，状态由 Approve/Hide/Archive 明确动作改变。Approve 原子提交
  当前审核表单和通知 intent，删除敏感内容前必须二次确认。
- Giving flow：查看交易、费用、退款、争议、payout、对账。
- Giving funds：维护奉献用途、专项基金、目标和统计。
- Annual statement：生成、重生成、下载、导出、审计。
- Member profile：会员资料、角色、状态、设备 token 和导出。
- Pastoral care：Care 页面展示关怀队列，提交负责人、状态、隐私等级、下一步、内部备注和跟进记录 intent；最终权限、状态和审计以后端为准。
- Notification delivery：通知任务、失败重试、取消和审计。
- Ministry analytics：Dashboard 展示后端按角色过滤的精确聚合指标、任务健康、
  fresh/stale 快照和 drill-down；Admin 只负责本地化和格式化，不自行推算指标。
  趋势和统计导出尚未接入。
- Public landing settings：Settings 页面维护官网身份、导航、新朋友入口、
  固定日程、公开人员介绍、聚会地图链接、联系方式、社交媒体和 App 下载入口；
  近期活动由 Life 中已发布的公开活动动态投影，不在 Settings 重复维护。公开官网只
  读取后端聚合后的 `/v1/public/landing?locale=...`。简体中文保留基础 key，例如
  `publicLanding.contact`；其他语言使用 locale key，例如
  `publicLanding.es.contact` 和 `publicLanding.zh-Hant.contact`。

## Verification

- Provider secrets 不进入前端 bundle。
- 所有高风险动作经后端权限判断。
- 高风险动作有审计。
- 页面刷新 canonical state，不用本地状态假装成功。
