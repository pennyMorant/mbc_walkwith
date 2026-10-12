# Mobile App Surface

状态：移动 App 表达层边界

## Purpose

移动 App 是会友日常入口，负责读经、TTS、讲道、生活、活动、签到、小组、课程、服事、代祷、奉献、专项基金、年度证明、通知和个人设置的体验表达。三阶段会继续承载新人跟进提交、成长路径、读经计划和讲道讨论包的体验，但这些最终状态仍以后端 feature service 为准。

## Can Own

- 页面临时交互状态。
- 本地阅读设置。
- TTS 当前播放状态。
- 讲道播放器当前状态。
- 公共内容缓存视图。
- PDF 临时打开和系统分享状态。

## Must Not Own

- 活动报名最终结果。
- 活动签到最终结果。
- 小组成员关系。
- 课程报名、资料授权和出勤。
- 服事排班最终状态。
- 奉献交易最终状态。
- 专项基金交易归属。
- 讲道发布状态。
- 年度证明可信内容。
- 代祷可见性。
- 关怀记录和牧养备注。
- 管理员权限。

## Required Pattern

```text
screen/widget
-> controller/provider
-> repository
-> API client / local data source / platform service
-> backend contract or device capability
```

## Current Route Map

真实路由定义在 `apps/mobile/lib/app/app_routes.dart` 和
`apps/mobile/lib/app/app_router.dart`。本表只记录 surface 入口和 owner，
不重复业务规则。

| Route | Name | Surface owner | Contract boundary |
| --- | --- | --- | --- |
| `/study` | `study` | `StudyTab` | Local Bible repository, reading settings, AI study repository |
| `/auth/login` | `memberLoginEmail` | `MemberLoginEmailPage` | Member session repository, registration settings, auth API |
| `/auth/password` | `memberLoginPassword` | `MemberLoginPasswordPage` | Member session repository, auth API |
| `/auth/register` | `memberRegister` | `MemberRegistrationPage` | Member session repository, registration settings, auth API |
| `/auth/verify-email` | `memberEmailVerification` | `MemberEmailVerificationPage` | Member session repository, email verification API |
| `/auth/password-recovery` | `memberPasswordRecovery` | `MemberPasswordRecoveryPage` | Member session repository, password recovery API |
| `/study/search` | `studySearch` | `BibleSearchPage` | Local Bible search data |
| `/study/book/:bookId/:chapter` | `studyReader` | `BibleReaderPage` | Local Bible text, TTS playback capability, study annotations |
| `/sermons` | `sermons` | `SermonsTab` | Sermons repository, monthly period selector, and public sermon API |
| `/sermons/:sermonId` | `sermonDetail` | `SermonDetailPage` | Sermons repository, native audio playback, sermon AI study API |
| `/life` | `life` | `LifeTab` | Life repository, newcomer repository, weekly/monthly period selector, and member/public life API |
| `/life/posts/:postId` | `lifePostDetail` | `LifePostDetailPage` | Life repository, event registration intents, member session |
| `/life/groups/:groupId` | `groupDetail` | `GroupDetailPage` | Group repository, optional member identity, apply/withdraw intent |
| `/life/courses/:courseId` | `courseDetail` | `CourseDetailPage` | Course repository, optional member identity, enrollment intent |
| `/life/check-in` | `lifeCheckInScan` | `EventCheckInScanPage` | Life repository, mobile scanner capability, member QR check-in API |
| `/life/notifications` | `notifications` | `NotificationCenterPage` | Notification inbox, system permission state, and device-token repositories |
| `/mine/giving` | `givingHistory` | `GivingHistoryPage` | Giving repository, checkout return state, member session |
| `/mine/giving/statements` | `annualStatements` | `AnnualStatementsPage` | Giving repository, PDF export/share capability |
| `/mine/profile` | `memberProfile` | `MemberProfilePage` | Member session repository, member profile API, preferences, and auth session actions |
| `/mine/groups` | `myGroups` | `MyGroupsPage` | Group repository, canonical active/leader memberships |
| `/mine/courses` | `myCourses` | `MyCoursesPage` | Course repository, canonical member enrollment history |
| `/mine/reading-plans` | `myReadingPlans` | `MyReadingPlansPage` | Reading-plan repository, current assignments, immutable attempt history, and lifecycle intents |
| `/mine/serving` | `myServing` | `MyServingPage` | Serving repository, canonical assignment and availability collections |
| `/mine/serving/:assignmentId` | `servingDetail` | `ServingAssignmentDetailPage` | Serving repository, confirm/leave/check-in intents and canonical check-in state |
| `/mine` | `mine` | `MineTab` | Member session repository, discipleship repository, preference card, system notification permission, giving entry, and About card |

Surface rule:

- route builders may parse path/query parameters and pass them to pages.
- pages may show loading/empty/error/success states.
- pages must not decide durable registration, giving, notification, or statement
  state. They submit intents and render backend/repository state.

## Feature Connections

- Locale：App UI 支持 English、Español、简体中文和繁體中文。首次安装默认跟随系统语言；用户在系统设置或 App 语言入口调整后，由 Flutter
  localization 选择最接近的 `en`、`es`、`zh-Hans` 或 `zh-Hant`。App 不把语言偏好复制成多个业务 source of truth。
- Bible text：界面语言和圣经译本文本是两个边界。当前圣经阅读使用本地 public-domain 或已授权文本；Spanish UI 可先使用现有英文/中文圣经文本，新增西语圣经译本必须先确认版权和数据来源。
- AI study：App 传递当前 UI locale 给后端 AI study endpoint，由后端 provider owner 生成对应语言的学习辅助内容；Study/Sermon 共用 Core AI response/locale/request contract，只有用户明确点击才请求，畸形响应显示可恢复错误，Markdown 由共享 renderer 呈现。
- Bible TTS：App TTS service 是 lifecycle owner。
- Sermon publishing：App 只读取已发布讲道。
- Sermon playback：讲道详情页只提交播放 intent；`SermonPlayerSession` 和 audio playback capability 负责 Android / iOS 原生媒体控制、后台播放、系统暂停和完成态进度保存。
- Sermon discovery：App 默认按选中月份浏览，可在该月份内搜索，并使用后端 published-only facets 按讲员、系列或主题精确筛选。筛选状态只属于页面 intent；网络失败时 repository 可从已缓存讲道派生建议并保持同样的离线筛选语义，内容可见性仍以后端为准。
- Sermon detail cache：后端返回 `sermon_not_found` 或 404 时必须清理本地缓存，不能继续展示旧讲道。
- Church life publishing：App 只展示当前身份可见且已发布生活内容。
- Church life periods：Life 的本周 tab 读取选中周，其他生活 tab 读取选中月；主日/周报 hero 自动读取最新可见周报，不跟随当前 tab 周期。
- Church life read state：App 只展示后端返回的 `isRead/readAt`，打开详情时提交 mark-read intent；本地缓存不是未读 source of truth。
- Event registration：App 提交 intent，后端返回 canonical state。
- Event attendance：App 展示签到码和状态，后端写最终出席状态。
- Group ministry：App Life 和详情展示公开/会员可见小组及申请状态，提交加入或撤回 intent；App Mine 只从 `/v1/me/groups` 展示 active/leader membership，后端写成员关系。
- Group ministry v2：小组长工作台只能管理自己负责的小组；出席、关怀提醒和材料使用状态以后端为准。
- Course learning：App Life 对访客展示公开课程目录和详情，对会员展示 canonical 报名状态并提交报名 intent；App Mine 从 `/me/courses` 展示当前及历史课程，不能从公开目录推算。资料授权以后端为准。
- Serving schedule：App Life 和 Mine 展示我的服事并提交确认或请假 intent，后端写排班状态。
- Serving schedule v2：App Mine 展示 canonical 可用性并提交新增可用时间，详情页提交到岗 intent；`swap_requested` / `covered` 当前只展示。换班和替补 action 在后端 member contract 完成前不创建占位 UI，App 始终不决定最终排班。
- Newcomer follow-up：App 或公开入口可提交新朋友资料，未登录时使用 external user id；内部跟进记录不返回普通 App。
- Discipleship journey：App 展示自己的成长路径、阶段和下一步，任务跳转到原 feature，不复制课程、小组、服事或讲道数据。
- Reading plan：App 按后端计划引用读取本地 Bible 正文，TTS 仍走本地系统 TTS capability，跨设备进度以后端为准；Mine 分开显示进行中 assignment 与不可变 attempt 历史，暂停、恢复、结束和重新开始只提交后端 intent；plan/day/assignment/progress 契约畸形时 Study、详情和 Mine 显示可重试错误，不能伪装为空数据或未加入并开放操作。
- Sermon discussion guide：App 只展示 public projection 的已发布讨论包，不接收 Admin-only `generatedMetadata`；个人回应默认私密，畸形 payload 显示可重试错误而不是静默隐藏。
- Prayer moderation：App 默认按私密提交代祷，只展示后端允许的代祷。
- Life detail cache：后端返回 404、`event_not_found` 或 `life_post_not_found` 时必须清理本地缓存，不能继续展示旧活动或旧生活内容。
- Event QR check-in：App Life 提供现场二维码扫描入口，扫码后只提交 code 给后端，签到结果以后端返回的 `registrationSummary` 为准。
- Giving flow：App 打开 checkout，后端 webhook 确认最终交易。
- Giving funds：App 只展示 active fund，交易归属以后端创建 checkout 时记录为准。
- Annual statement：App 下载、预览、分享后端授权 PDF。
- Member profile：App Mine 可以展示资料、偏好、系统通知权限、奉献/年度证明入口、关于信息和教会生活状态聚合；角色、权限、成员关系、课程、服事和关怀状态以后端为准。
- Pastoral care：App Life 在会友登录后提交关怀请求和查看自己的公开状态，不展示内部跟进备注或 follow-up 记录，不把关怀数据写入普通长期缓存。
- Notification delivery：App 只展示系统通知权限、通知中心和设备 token 注册状态，不自建通知类别开关，也不决定后台通知任务。

## Verification

- UI 没有直接调用 provider secret。
- UI 没有直接写业务最终状态。
- 敏感数据没有进入普通长期缓存。
- 错误展示来自 structured error。
