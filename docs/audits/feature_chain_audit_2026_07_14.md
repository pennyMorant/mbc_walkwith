# Feature Chain Audit 2026-07-14

状态：本轮深度代码链路核查完成

## 1. Scope

本轮按 `AGENTS.md` 对 `docs/features/` 下 24 个业务 feature 逐项执行：

1. 读取 feature、Core、domain、surface、capability 和 SDK 文档。
2. 从用户或管理员入口追踪到 controller/composable、repository/API、service、
   persistence 或平台 capability。
3. 审核 owner、权限、source of truth、并发、失败恢复和 sibling flow。
4. 在正确 owner 层修复真实问题。
5. 运行目标验证、差异审核并按阶段独立提交。

`docs/features/README.md` 是目录说明，不计入业务 feature 数量。

## 2. Coverage

| Feature | Primary owner chain audited | Primary evidence commit |
| --- | --- | --- |
| `ai_bible_study` | App AI sheet/repository -> member AI contract/route -> provider/audit | `e8a4a18` |
| `ai_content_assist` | Admin draft panel -> shared request contract -> AI route/provider -> existing publish owner | `ee0e6a2` |
| `annual_statement` | App download/share -> statement API/service -> giving data/audit | `a663289` |
| `bible_tts` | Reader UI/session -> TTS controller -> Android/iOS platform adapter | `7b351bf` |
| `bible_verse_notes` | Reader annotation -> local/private note + public insight API -> moderation | `26e4f23` |
| `church_life_publishing` | Admin editor/publish -> life service/repository -> App feed/notification intent | `2a158d4` |
| `course_learning` | Admin course workflow -> course service/repository -> App enrollment/progress | `9f52363` |
| `discipleship_journey` | Admin journey/assignment -> reference validation -> member projection | `379e35b` |
| `event_attendance` | Printed QR/self check -> attendance route/service -> registration ownership | `507bc12` |
| `event_registration` | App register/cancel -> atomic backend transaction -> Admin roster | `3b9fb68` |
| `giving_flow` | App checkout/recovery -> Stripe webhook -> ledger/reconciliation/audit | `04bb41e` |
| `giving_funds` | Admin fund lifecycle -> canonical allocation -> App active fund projection | `ea283d0` |
| `group_ministry` | App application/member view -> group service/repository -> Admin workflow | `4fcab09` |
| `member_profile` | Register/login/session -> profile/settings/device identity -> Admin member view | `5cb7cac` |
| `ministry_analytics` | Admin dashboard -> role-filtered aggregation -> canonical feature summaries | `1e1bc49` |
| `newcomer_followup` | App newcomer submission -> private follow-up service -> Admin workflow | `a1c6018` |
| `notification_delivery` | Publish intent -> job/claim/provider/retry -> remote App inbox/read state | `3522cd5`, `e59eee3` |
| `pastoral_care` | Member private request -> care service/repository -> restricted Admin follow-up | `6ffa75b` |
| `prayer_moderation` | Guest/member submission -> moderation transaction -> public/member projections | `c49d451` |
| `reading_plan` | Admin plan publish -> assignment/progress API -> App local Bible jump | `bfce686` |
| `sermon_discovery` | App month/search/facets -> sermon repository query -> playback selection | `d9e26d9` |
| `sermon_discussion_guide` | Admin guide publish -> audience rules -> App private response | `a94e4f9` |
| `sermon_publishing` | Admin draft/edit/audio -> aggregate revision/storage -> App sermon/player metadata | `6a246e0` |
| `serving_schedule` | Admin schedule/assignment -> canonical response -> App availability/check-in | `5333752` |

## 3. Cross-Feature Findings Closed

- 写操作补齐原子性、revision/identity 检查和 stale result 防护。
- App/Admin 不再使用受 limit 影响的列表长度或本地猜测充当 canonical 状态。
- member/admin 权限在 route/service action 边界执行，不只隐藏 UI。
- AI、TTS、通知、支付和对象存储保持 capability owner，不进入 feature UI。
- 讲道、生活、活动、奉献、会员和公开心得均保留单一 source of truth。
- 错误恢复不再用 mock、默认成功、旧字段兼容或 debug bypass 掩盖失败。

## 4. Final Verification

本轮最终基线：

- `bun run check`：类型、API contract coverage、mobile l10n、旧残留、SDK
  boundaries、surface docs、capability docs 全部通过。
- Backend：69 个测试文件、261 项测试通过。
- Flutter：`flutter analyze` 无问题；281 项测试通过。
- Admin Web：66 项测试通过。
- `git diff --check` 和每阶段 staged diff 审核通过。

8 项 PostgreSQL integration tests 因当前未提供测试数据库而按配置跳过。它们涉及
真实 PostgreSQL 并发/约束行为，仍需在部署测试阶段运行。

## 5. Remaining Runtime Acceptance

以下不是未接入 feature，而是真实外部环境验收：

- Stripe test mode、webhook、退款、争议和 payout 实账演练。
- Firebase/FCM 真机 token、权限、投递和失败证据。
- R2/VPS 长音频、图片、PDF 和签名下载。
- OpenAI、Gemini 或第三方中转 provider 的真实限流、超时和成本观察。
- Android/iOS 真机长时间 TTS、音频焦点和系统语言包。
- PostgreSQL integration tests 与 VPS smoke tests。

结论：24 个 feature 的代码主链路与关键 sibling flow 均已完成本轮深度核查；当前
剩余方向是外部 provider、真实数据库和设备环境验收，不是继续补 feature 骨架。
