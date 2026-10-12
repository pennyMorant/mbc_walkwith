# AI Contract

状态：AI 共享能力核心契约

## 1. Purpose

AI 是后端拥有的共享 capability，不属于某一个页面、某一个 feature 或某一个前端 SDK。App 和管理 Web 只能通过后端 API 使用 AI，不允许保存 provider key、base URL、模型名或中转站鉴权信息。

## 2. Core Contract

稳定概念：

- `AiProviderId`：`disabled`、`openai`、`gemini`、`openai_compatible`。
- `AdminAiTask`：后台内容草稿类任务。
- `MemberAiTask`：会友学习辅助类任务。
- `AiTaskInput`：title、body、reference、question、audience、context。
- `AiDraftResponse`：markdown、provider、model、usage、latency、safetyNotice。
- `AiStatusResponse`：enabled、provider、model、auditEnabled、支持任务列表。

契约源头：

- `packages/api_contracts/src/ai.ts`

## 3. Ownership

- Core owns：AI task contract、provider id contract、错误契约、审计契约。
- Capability owns：provider adapter、timeout、provider error mapping。
- Feature owns：任务场景、prompt 目标、业务权限、审计摘要。
- Surface owns：按钮、loading、empty/error、结果预览和用户确认。

## 4. Access Rule

后台 AI：

- 必须通过 `ai:use` 权限。
- 面向讲道、生活内容、通知草稿等后台生产力场景。
- 生成结果必须由管理员审核后才能进入正式内容。
- `sermon_summary` 和 `sermon_outline` 只能归属 `sermon`；
  `life_post_draft` 只能归属 `life_post`；`notification_draft` 只能归属
  `notification` 或触发通知草稿的 `life_post`。尚未保存的新对象可以没有
  resource id，但不能伪装成其他 feature 的资源。

会友 AI：

- 必须通过 member auth。
- 仅用于查经辅助、讲道问答等学习场景。
- 不替代牧养判断、神学最终解释、医疗、法律或财务建议。
- `bible_study_help` 必须绑定 `bible_passage` 和稳定 verse id；
  `sermon_qa` 必须绑定 `sermon` 和稳定 sermon id。客户端不能把会友 AI
  请求归因到其他资源类型。

## 5. Error Contract

稳定错误：

- `ai_provider_disabled`
- `ai_provider_misconfigured`
- `ai_provider_request_failed`
- `ai_provider_timeout`
- `ai_provider_network_failed`
- `ai_provider_response_invalid`
- `ai_rate_limited`
- `ai_token_quota_exceeded`
- `ai_task_input_required`

Provider 错误属于 capability 或 external；任务输入错误属于 feature；认证和权限错误属于 surface。
限流错误属于 route surface，按 actor 分桶，不能由 App 或 Admin Web 自己决定。
Provider adapter 必须在运行时验证返回文本和 usage 类型，不能依赖 TypeScript
类型断言接受外部 JSON。

## 6. Audit Contract

AI 审计必须记录：

- actor。
- task。
- resourceType/resourceId。
- provider/model。
- usage。
- latency。
- 输入摘要。

管理端只记录输入、输出和总 Token；日/月 Token 限额在调用前按实际输入长度、
预期 Provider 调用次数和任务策略最大输出保守预留 Token 进行判断。AI 契约不包含
模型价格、费用估算或货币预算字段。

每一次实际发起的 provider 调用都必须留痕：成功记录 `*.generate`，失败记录
`*.failed`。身份、权限、输入、限流或 Token 限额在发起调用前拒绝时，不得伪造
provider 失败记录。失败记录只保存结构化错误码、错误类别、来源层与是否可重试，
不能保存上游错误正文。

长内容按段落拆分时，每一个分块都是独立的 provider 调用，必须各自记录 Provider、
模型、Token、耗时、字段和分块序号；不得只记录一条合计审计来掩盖实际调用次数。

调用前顺序固定为：身份/权限与输入校验、Feature 业务校验、Token 配额、限流、
Provider 调用。Token 配额拒绝不得消耗限流名额。

AI 审计默认不记录：

- 原始 provider key。
- 原始完整 prompt。
- AI 输出全文。
- 个人隐私、奉献明细、支付争议细节等高敏信息。

## 7. Integration Rule

新增 AI feature 时必须：

1. 在 `packages/api_contracts/src/ai.ts` 增加 task。
2. 在后端 `AiService` 增加 task prompt 和温度策略。
3. 在 route 层增加权限、认证和审计摘要。
4. 在对应 `docs/features/*.md` 声明 source of truth、surface、capability 和验证链。
5. 更新 `docs/api.md` 与 `docs/sdk/ai.md`。

## Related Docs

- [feature_integration.md](feature_integration.md)
- [error_model.md](error_model.md)
- [logic_chain.md](logic_chain.md)
- [../capabilities/ai_provider.md](../capabilities/ai_provider.md)
- [../features/ai_content_assist.md](../features/ai_content_assist.md)
- [../features/ai_bible_study.md](../features/ai_bible_study.md)
