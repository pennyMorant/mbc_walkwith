# Architecture Integration Audit

状态：阶段执行收口记录
更新日期：2026-06-21

本文档记录 MBC WalkWith 继续接入新架构体系的剩余工作。它不是新的架构规则，
而是把现有代码和 `docs/architecture.md`、`docs/core/`、`docs/features/`、
`docs/domains/`、`docs/surfaces/`、`docs/capabilities/` 的要求逐项对齐。

## 1. Current Baseline

已经完成：

- 架构文档入口已按 App 与后端 + 管理 Web 分离：
  - `docs/architecture/app.md`
  - `docs/architecture/backend_web.md`
- Core 文档已拆分：
  - `docs/core/README.md`
  - `docs/core/contracts.md`
  - `docs/core/error_model.md`
  - `docs/core/feature_integration.md`
  - `docs/core/lifecycle.md`
  - `docs/core/logic_chain.md`
- 第一批完整 feature 文档已存在：
  - `docs/features/sermon_publishing.md`
  - `docs/features/event_registration.md`
  - `docs/features/giving_flow.md`
  - `docs/features/annual_statement.md`
  - `docs/features/bible_tts.md`
- 共享 domain、surface、capability、SDK 文档已建立。
- 后端 `reply.notFound` 旧写法已清零。
- 后端 `AppError` 和统一 error handler 已承接 core error contract。
- App 端 `ApiError` 已能承接结构化错误字段。
- Admin Web `ApiRequestError` 已能承接结构化错误字段。
- 讲道详情、生活详情的 stale cache 已按后端权威 miss 清理。
- 讲道发布 readiness 已在后端发布路径守住。

当前已验证过的主检查：

- `bun run typecheck`
- `bun --filter @mbc/backend test`
- `flutter analyze`
- `flutter test`
- `git diff --check`

## 2. 2026-06-21 Execution Closure

本轮按“小阶段核查 + 提交”的方式推进，已完成以下架构接入闭环：

- Core/API 错误契约继续统一，后端、App、Admin Web 均优先承接结构化错误。
- 讲道、生活、活动报名、奉献、年度证明、Bible TTS 等主链路测试和边界测试已补齐第一批。
- App 端已按 surface + repository + capability/helper 收口 Bible TTS、PDF 分享、缓存 miss、奉献和年度证明链路。
- Admin Web 已拆分大页面，页面只做工作台编排，状态和动作进入 composable 或 feature 组件。
- 未引用的 `apps/admin_web/src/features/placeholder/PlaceholderPage.vue` 已删除。
- SDK 文档已按功能分类，入口为 `docs/sdk.md`，功能细节位于 `docs/sdk/*.md`。

Admin Web 当前体量结果：

- `SettingsPage.vue`：533 行。
- `GivingPage.vue`：192 行。
- `JobsPage.vue`：309 行。
- `BibleKnowledgePage.vue`：490 行。
- `LifePostsPage.vue`：559 行，仍需在下一轮拆分编辑区或发布通知区。
- `SermonsPage.vue`：284 行。
- `core/i18n/i18n.ts` 是集中翻译表，允许超过页面/组件硬线，但需要按语言和功能区保持有序。

本轮新增或强化的后台组件边界：

- Jobs：page controller、pipeline readiness card、queue card。
- Giving：page controller、summary cards、reconciliation card、transactions card。
- Bible Knowledge：entity list card。
- Settings：page header、filters card。
- Sermons 和 Life Posts：controller、library、preview、actions、registrations、pipeline/audio/workflow 等组件和 composable。

## 3. Architecture Completion Target

最终接入完成时，代码应满足：

- 每个完整 feature 都能说明 owner、source of truth、state model、surface、
  backend service、domain、capability、permission、audit、lifecycle、error、
  verification chain。
- App surface 只表达 UI 状态和触发 intent，不直接拥有远端错误策略、
  支付、存储、TTS、音频播放或 PDF 分享业务规则。
- Admin Web surface 只表达管理工作台状态，不直接拥有后端业务规则、
  支付 provider、对象存储、任务执行或权限最终判断。
- 后端 route 只负责 surface contract、输入校验和调用 service。
- Service 拥有 feature 业务规则。
- Repository 拥有持久化读写，不拥有业务流程。
- Capability adapter 只封装外部副作用，不隐藏业务规则。
- SDK/API client 层统一处理 transport、auth refresh、error parsing 和
  typed DTO。
- 文档描述当前真实系统，不保留已经废弃的旧架构说法。

## 4. Execution Source Checklist

### Stage 2: Core Contract Unification

目标：把后端、App、Admin Web 的错误和核心返回继续收敛到 core contract。

后端剩余项：

- 业务性 `Object.assign(new Error(...), { statusCode })` 继续改成 `appError`。
- 认证和权限错误改为稳定 code：
  - admin auth required。
  - admin permission required。
  - member auth required。
  - login failed / refresh failed。
- 上传和输入类错误改为稳定 code：
  - sermon audio upload body invalid。
  - life image body invalid。
  - image unsupported / empty / too large。
  - media source invalid / missing。
- repository 内部写入失败保持 500，但需要区分：
  - repository write failed。
  - configuration missing。
  - external provider failed。
- `return null` 作为 repository/service 查询 miss 可以保留；
  route 或 service 边界必须翻译成结构化错误。

Admin Web 剩余项：

- 页面内本地校验可以继续抛普通 `Error`，但 API 错误展示必须优先使用
  `ApiRequestError.code/category/nextAction`。
- 敏感操作的错误反馈需要统一：
  - publish readiness。
  - payment/giving export。
  - annual statement generation。
  - member/admin user mutation。
  - job diagnostics/cancel。

App 剩余项：

- repository 应统一判断 `ApiError.code`，避免页面猜 message。
- `not_found`、`permission_denied`、`validation_failed`、`state_conflict`、
  `configuration_missing`、`capability_failed` 应有稳定映射策略。
- mock/offline 数据只能由 repository 或明确 data source 提供，UI 不直接使用。

验收：

- 后端业务性 `Object.assign(new Error` 数量减少，并有对应测试。
- API 错误 code 在 App/Admin Web 至少有一批真实调用使用。
- `bun run typecheck`
- `bun --filter @mbc/backend test`
- 必要时 `flutter analyze` / `flutter test`

### Stage 3: Feature Chain Integration

目标：逐个 feature 建立主链路和失败链路测试，确保文档不是空话。

优先级 1：讲道发布

- 后台创建/导入讲道。
- 上传音频或导入音频。
- 转录、大纲、经文引用任务。
- readiness 检查。
- 发布权限。
- App 公开可见。
- App 详情不保留 stale cache。
- 音频缺失显示稳定错误状态。

优先级 2：活动报名

- 后台发布活动型 life post。
- App 读取活动详情。
- 会友报名。
- 重复报名、截止时间、容量、取消路径。
- 后台查看报名。
- 会员身份和 group visibility。

优先级 3：奉献付款

- App 创建 checkout session。
- Stripe webhook 是最终 source of truth。
- provider event 幂等。
- fee/net/refund/dispute/payout 对账。
- App 历史读取。
- Admin Web 财务查看和导出权限。

优先级 4：年度证明

- 后台生成 statement。
- PDF + CSV 导出。
- App 下载/分享 PDF。
- 临时文件清理。
- statement miss / permission denied / export failed。

优先级 5：圣经 TTS

- 本地无版权经文。
- 章节/节选择。
- TTS controller lifecycle。
- pause/resume/stop/dispose。
- App 生命周期不产生重复播放 owner。

验收：

- 每个 feature 至少一条主链路测试。
- 每个高风险 feature 至少一条失败链路测试。
- 相关 `docs/features/*.md` 更新为真实完成状态。

### Stage 4: Mobile App Architecture Cleanup

目标：让 App 端严格成为 surface + repository + capability/helper 的结构。

剩余项：

- Giving repository 目前仍包含 mock checkout、mock statement、mock CSV；
  需要确认它只在 `USE_MOCK_REMOTE_DATA=true` 下启用，并在 SDK 文档写清楚。
- Prayer repository 当前偏 mock/local，需要确认是否进入真实 API 链路。
- Study repository 仍含学习辅助 mock explanation，需要把未来 AI/资料能力边界写清。
- Bible TTS controller 是 TTS capability owner；页面不能重复拥有播放 lifecycle。
- PDF 分享属于 annual statement helper/capability，页面只触发 intent。
- sermon/life cache 已做 stale miss 清理，但应补充同层 sibling cache 策略说明。

验收：

- App UI 不直接 import shared mock data。
- App repository 对 API 错误 code 的处理集中。
- `flutter analyze`
- `flutter test`

### Stage 5: Admin Web Architecture Cleanup

目标：让后台像一个统一工作台，而不是多个页面各自处理。

本轮处理和仍需关注：

- 已删除未引用的 `features/placeholder/PlaceholderPage.vue`。
- 已将主要超线页面拆为 page + composable + feature components。
- 页面内 selected item 为空的本地错误已统一走
  `apps/admin_web/src/core/actions/action_guard.ts`。
- 所有 API 错误展示统一优先显示结构化 code/message/nextAction。
- 发布类功能使用统一 readiness/checklist 反馈。
- 敏感操作统一确认、审计感知、成功/失败反馈：
  - sermon publish。
  - life publish/archive/delete。
  - prayer moderation。
  - giving statement/export。
  - member/admin mutation。
  - job diagnostics/cancel。
- 路由守卫已读取 route meta permission；无权限访问时会跳转到第一个可访问后台路由，
  后端权限仍是最终 source of truth。

验收：

- `bun --filter @mbc/admin-web typecheck`
- 必要时 `bun run build:admin`
- 后台敏感页面错误展示统一。

### Stage 6: SDK, Docs, And Verification Closure

目标：让 shared contracts、SDK 文档、API 文档和代码一致。

本轮已完成：

- 新增 `packages/api_contracts/src/route-registry.ts`，登记后端 route、
  shared contract、SDK 文档和 App/Admin client 入口。
- 新增 `bun run check:contracts`，静态核查 route registry 是否覆盖所有后端
  route literal，以及登记的 contract/doc/client 文件是否存在。
- `docs/api.md` 已从旧的 mock-first / future-backend 表述改为 active
  contract，并把 `/v1/health`、provider callback、当前会友端路由边界写准。
- `docs/sdk.md` 和 `docs/agent-workflow/sdk_workflow.md` 已加入 route registry
  更新和 `check:contracts` 验证要求。
- Admin Web `core/api/*` 的主要 list/filter 类型已改为从
  `packages/api_contracts` query type 派生，仅保留 UI 下拉框的空字符串
  "all" 哨兵。
- 通知投递列表 query 和 retry-due request 已从 admin route 本地 schema
  移入 `packages/api_contracts/src/push.ts`，后端 route 和 Admin Web helper
  共用 shared contract。
- 新增 `bun run check:sdk-boundaries`，静态防止 mobile presentation 直接导入
  Dio/ApiClient/mock data source，也防止 Admin Web feature surface 直接使用
  `fetch` 或 raw `ApiClient`。
- 根级 `bun run check` 已接入 `typecheck`、`check:contracts`、
  `check:sdk-boundaries` 和 backend tests，作为 TypeScript/backend 侧默认
  架构验证入口。Flutter/Dart 改动仍需单独跑 `flutter analyze` / `flutter test`。
- `docs/surfaces/mobile_app.md` 和 `docs/surfaces/admin_web.md` 已补真实 route
  map；`docs/surfaces/backend_api.md` 已移除旧规划 route，改为引用
  `packages/api_contracts/src/route-registry.ts`。
- 新增 `bun run check:surfaces` 并接入根级 `bun run check`，用于防止 App/Admin
  route 文档和 backend route registry 引用再次漂移。
- 新增 `docs/capabilities/capability_matrix.md`，登记 AI、Stripe、对象存储、
  FCM、notification retry、PDF、TTS、本地 sermon studio、导出和 QR 规划的
  owner 文件与配置边界。
- 新增 `bun run check:capabilities` 并接入根级 `bun run check`，用于检查
  capability 文档链接、必要章节和矩阵 owner 文件路径。

剩余项：

- route registry 只保证覆盖和文件存在；后续仍需逐 feature 深查 payload
  字段与实际 response mapper 是否完全一致。
- `docs/sdk/*.md` 对 App/Admin Web 的真实调用补齐。
- 最终验证矩阵写入 `docs/testing.md` 或本审计文档收口章节。

验收：

- 根 `bun run typecheck`
- 后端全量测试
- App analyze/test
- Admin Web typecheck/build
- `git diff --check`
- `git status --short`

## 5. Historical First Execution Order

从下一阶段开始，按以下小批次提交：

1. Admin/member auth errors 结构化。
2. Media input errors 结构化。
3. Life image upload errors 结构化。
4. App repository API error mapping 第一批。
5. Admin Web API error display helper 第一批。
6. Sermon feature chain 测试增强。
7. Event registration feature chain 测试增强。
8. Giving + annual statement feature chain 测试增强。
9. Mobile App mock/source of truth 清理。
10. Admin Web placeholder/action guard/permission fallback 清理。
11. SDK/API/docs 最终对齐。

每个小批次完成标准：

- 只改当前 owner 范围。
- 更新相关文档。
- 跑最小有效验证。
- `git diff --check`。
- `git status --short`。
- 提交后继续下一批次。

## 6. Open Risks

- 真实 Stripe webhook、payout、refund、dispute 需要环境变量和 provider 事件样本，
  单元测试只能覆盖 contract 和幂等逻辑。
- 真实推送通知需要 Firebase 配置，当前可用 noop/in-memory/provider contract 验证。
- 真实 iOS/Android TTS 生命周期仍需要设备级 QA；单元测试只能覆盖 controller intent。
- 真实对象存储需要 S3 或兼容服务配置；本地测试覆盖 local driver 和 capability 错误。
- 真实生产转录在本地工作站完成；发布前必须按
  `docs/local_sermon_processing.md` 核查 package 质量。
