# MBC WalkWith Feature Completion Audit

状态：阶段性审计基线

最后核查日期：2026-07-03

> 2026-07-14 的 24 个 feature 深度代码链路核查、修复提交和最终验证证据见
> [audits/feature_chain_audit_2026_07_14.md](audits/feature_chain_audit_2026_07_14.md)。
> 本文保留为 2026-07-03 的阶段性产品完成度基线。

本文档记录当前所有 `docs/features/` 业务闭环的真实完成度。它不是产品愿景，也不是新需求清单；它用于回答“哪些 feature 已经可进入测试，哪些只是第一版闭环，哪些还需要继续精修”。

## 1. Rating Standard

| Rating | Meaning |
| --- | --- |
| A | 可上线测试。App/Admin/Backend 主链路清楚，核心测试存在，剩余主要是真实环境配置或内容验收。 |
| B | 第一版闭环。业务链路已经打通，但交互、失败路径、测试数据、真实 provider 或运营体验还需要继续精修。 |
| C | 骨架或局部闭环。核心 owner 和模块存在，但还不能按最终产品形态独立验收。 |
| D | 缺关键链路。暂未发现当前 feature 属于这一档。 |

## 2. Global Findings

- 当前 feature 文档共有 24 个业务闭环，不含 `README.md`。
- 后端模块、Admin Web feature 目录、App 主入口已经基本对齐 core/features 架构。
- 大多数 feature 已经达到 B：能跑第一版，但还不是全部精修完成。
- 高风险 feature 的真实环境验收仍是主要缺口：Stripe、FCM、对象存储、VPS smoke、真实 AI provider。
- App 端仍保留 development mock repository，用于离线开发；正式测试必须确认 `USE_MOCK_REMOTE_DATA=false` 且 API 指向测试服务器。
- `backend/src/modules/media/youtube/` 目录为空且未发现讲道 YouTube 导入链路；当前唯一 YouTube 字样是 public landing 的社交媒体链接，不属于讲道导入功能。
- `apps/mobile/lib/firebase_options.dart` 仍是 placeholder；正式 FCM 推送前必须由 `flutterfire configure` 生成真实配置。
- Admin Web 存在 `features/placeholder` 空目录；未发现实际 placeholder 页面文件，但后续可以清理空目录或保持未跟踪空目录不影响构建。

## 3. Feature Matrix

| Feature | Rating | Evidence | Remaining Work |
| --- | --- | --- | --- |
| `ai_bible_study` | B | 后端 AI routes/service/tests、App Study/Sermon AI repository 和错误提示已接入。 | 配置真实 OpenAI/Gemini/第三方中转 provider；完善来源提示、结果呈现、成本/审计面板和失败恢复。 |
| `ai_content_assist` | B | Admin AI 辅助组件、后端 provider 状态和内容草稿 API 已接入。 | 运营体验继续模块化：生活、通知、讲道、祷告等不同 task 的插入位置和人工审核提示。 |
| `annual_statement` | B+ | App 年度证明下载/分享、后端导出测试、Admin Giving 基础入口存在。 | 真实 Stripe 年度数据、PDF 样式、签名下载、财务审计和 VPS 测试数据完整验收。 |
| `bible_tts` | A- | App 本地经文 TTS controller/engine、测试和本地文本边界存在。 | 真机长时间播放、系统音频焦点、不同语言语音选择和 iOS SPM 插件警告后续验收。 |
| `bible_verse_notes` | B+ | App 经文心得、公开 API、Admin 审核、后端 route 测试存在。 | 公开心得列表体验、未登录 external user id 迁移、审核通知和滥用处理继续精修。 |
| `church_life_publishing` | B+ | 生活内容后端、Admin Markdown 编辑、App 信息流和通知发布链路存在。 | App 卡片密度、已读状态、测试数据、附件/图片策略和运营预览继续打磨。 |
| `course_learning` | B | 后端课程 routes/test、Admin Courses、App Life/Mine repository 存在。 | App 课程详情、课次/资料展示、报名/出勤状态、学习进度体验需要精修。 |
| `discipleship_journey` | B- | 后端 routes/test、Admin 第一版、App Mine 摘要 repository 存在。 | 先保持轻量“新人学习路径”，补 App 详情、任务引用、负责人跟进和状态文案。 |
| `event_attendance` | B+ | 二维码签到/self check、后端报名/签到测试、Admin 出席名单基础闭环存在。 | 管理员打印二维码体验、签到异常处理、导出字段和现场弱网体验继续验收。 |
| `event_registration` | B+ | App 报名/取消/状态、Admin 名单、后端 route 测试存在。 | 活动详情 UI、容量/截止/重复提交失败提示和测试服务器真实数据继续打磨。 |
| `giving_flow` | B | Stripe Checkout/webhook/provider、App 奉献入口、Admin Giving、后端测试存在。 | 真实 Stripe test mode 全链路、webhook 签名、退款/争议/payout 对账和审计必须完整跑通。 |
| `giving_funds` | B | 基金维护、交易归属、App active fund 和 Admin 基础管理存在。 | 基金目标展示、停用策略、会友端说明、财务统计和多基金测试数据继续精修。 |
| `group_ministry` | B | 后端 group v2 测试、Admin Groups、App Life/Mine group repository 存在。 | 小组详情、申请加入、成员可见性、小组长工作台和材料引用仍需产品化。 |
| `member_profile` | B+ | 注册/登录、后端设置控制邮箱验证、App 资料编辑、Admin Members 已接入。 | 真实邮箱发送、资料字段校验、角色/状态权限、设备 token 绑定和隐私审计继续验收。 |
| `ministry_analytics` | C+ | Admin Dashboard、后端 dashboard 模块、文档标记为部分落地。 | 需要定义正式指标口径、趋势、待处理聚合、导出和定时快照。 |
| `newcomer_followup` | B- | 后端 routes/test、Admin Newcomers、App Life 提交入口存在。 | App 提交体验、跟进记录、转会员、进入成长路径和通知提醒需要精修。 |
| `notification_delivery` | B | 后端 notification service/retry/inbox tests、Admin Notifications、App 通知中心存在。 | 真实 Firebase 配置、设备 token 真机验收、provider evidence、失败重试运营体验。 |
| `pastoral_care` | B | 后端 care routes/test、Admin Care、App 会友关怀请求 repository 存在。 | App 状态详情、负责人跟进、隐私等级展示、内部备注隔离和审计继续精修。 |
| `prayer_moderation` | B+ | App 提交/查看、Admin 审核、后端 prayer routes/test 和通知更新存在。 | 隐私说明、公开范围文案、审核通知、隐藏/归档恢复和滥用处理继续打磨。 |
| `reading_plan` | B- | 后端 routes/test、Admin Reading Plans、App Study/Mine repository 存在。 | App 计划详情、每日阅读流、提醒、完成进度同步和本地经文跳转体验。 |
| `sermon_discovery` | B+ | App 月份浏览/搜索、讲道 repository tests、Admin Sermons、后端推荐 API 存在。 | 搜索权重、相关讲道、系列/讲员筛选、播放状态视觉和测试数据继续精修。 |
| `sermon_discussion_guide` | B- | 后端 routes/test、Admin 管理、App 讲道详情读取/私密回应 repository 存在。 | App 呈现、个人回应编辑、与小组/课程/成长路径引用和审核体验继续精修。 |
| `sermon_publishing` | B | Admin 草稿、音频/文案、本地 package、后端 storage tests、App 播放闭环存在。 | 真实对象存储/VPS smoke、讲道内容版权规范、封面 metadata、长音频稳定性和发布审核体验。 |
| `serving_schedule` | B- | 后端 serving v2 测试、Admin Serving、App serving repository 存在。 | App 我的服事详情、可用性、换班替补、到岗、提醒 dedupe 和导出继续精修。 |

## 4. Priority Execution Order

### P0: Must Finish Before Public Test

1. `member_profile`：真实注册策略、邮箱验证开关、会友资料隐私。
2. `sermon_publishing` + `sermon_discovery`：真实讲道数据、音频、封面 metadata、App 播放稳定。
3. `church_life_publishing` + `event_registration` + `event_attendance`：周报、活动报名、二维码签到真实数据。
4. `giving_flow` + `annual_statement`：Stripe test mode、webhook、年度证明和对账。
5. `notification_delivery`：真实 Firebase 配置和真机 token 验收。

### P1: Should Finish For Church Staff Trial

1. `prayer_moderation`
2. `group_ministry`
3. `course_learning`
4. `serving_schedule`
5. `pastoral_care`
6. `newcomer_followup`

### P2: Keep Lightweight Until Core Flows Are Stable

1. `discipleship_journey`
2. `reading_plan`
3. `sermon_discussion_guide`
4. `ai_bible_study`
5. `ai_content_assist`
6. `ministry_analytics`

## 5. Next Concrete Stages

1. 清理旧链路和误导性残留：确认没有讲道 YouTube 导入、worker 转录、用户可见 placeholder、mock 误接测试 API。
2. 高风险链路验收：Stripe、FCM、对象存储、年度证明、权限和审计。
3. App 高频路径精修：Study、Sermons、Life、Mine 四个 tab。
4. Admin Web 运营路径精修：讲道、生活内容、活动、通知、奉献、会员。
5. VPS 测试数据：生成可演示的讲道、周报、活动、课程、小组、服事、祷告、奉献、经文心得数据。
6. Release 测试：构建 Android arm64 包、安装、指向测试 API，全链路手动验收。

## 6. Verification Baseline

最近已通过的基础验证：

- `flutter analyze`
- mobile targeted tests for l10n, accessibility, user-facing errors, Bible knowledge
- `bun --filter @mbc/admin-web typecheck`
- `bun run check:mobile-l10n`
- `bun run check:sdk-boundaries`

后续每完成一个 feature 精修阶段，至少需要补：

- 目标 backend route/service tests
- 目标 mobile repository/widget tests
- Admin Web `typecheck`
- `git diff --check`
- `git status --short`
