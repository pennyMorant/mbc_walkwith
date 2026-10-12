# AI SDK

状态：App 和管理 Web AI API client 规则，第一版前端接入已落地

## Scope

AI SDK 只封装 MBC WalkWith 后端 API，不封装 OpenAI、Gemini 或第三方中转站 SDK。

## Contracts

共享契约位于：

- `packages/api_contracts/src/ai.ts`

主要 DTO：

- `AdminAiDraftRequest`
- `MemberAiStudyRequest`
- `AiDraftResponse`
- `AiStatusResponse`

## Admin Web SDK

后台 API helper 应提供：

- `getAdminAiStatus()`
- `createAdminAiDraft(request)`

当前实现：

- `apps/admin_web/src/core/api/ai.ts`
- 讲道编辑页生成摘要和大纲草稿。
- 生活内容编辑页生成正文草稿。
- 生活内容发布通知区域生成通知草稿。

规则：

- 自动使用 admin bearer token。
- 遇到 `ai_provider_disabled` 或 `ai_provider_misconfigured` 时显示配置类错误。
- 生成结果只作为编辑器草稿，不直接发布。
- Admin task 与 resource type 由共享 discriminated contract 绑定：sermon task
  只接受 sermon，life post task 只接受 life post，notification task 只接受
  notification 或触发它的 life post。
- Admin AI request builder 直接复用 `aiTaskInputLimits`，统一整理 title、body、
  reference、audience、question 和 context；超长正文/context 使用有标记且不破坏
  UTF-16 surrogate pair 的节选。
- SDK 必须验证 response task 与 request task 一致；Panel 用 task、locale、input、
  resource 组成 request identity，源内容变化后不得应用旧响应。
- Admin API helper 接受共享 `AdminAiDraftRequest` discriminated union。源内容变化时
  旧请求结果立即失效，但生成入口在该请求 settle 前仍保持禁用，避免重复 provider
  调用。

## App SDK

App repository 应提供：

- `createMemberAiStudy(request)`

当前实现：

- `apps/mobile/lib/core/ai/member_ai_study_response.dart`
- `apps/mobile/lib/core/ai/ai_locale.dart`
- `apps/mobile/lib/core/ai/ai_request_contract.dart`
- `apps/mobile/lib/features/study/data/ai_study_repository.dart`
- 圣经阅读页经文 AI 查经 sheet 通过 `/member/ai/study` 调用后端。
- `apps/mobile/lib/features/sermons/data/sermon_ai_repository.dart`
- 讲道详情页讲道问答 sheet 通过 `/member/ai/study` 的 `sermon_qa` 调用后端。

规则：

- 自动使用 member bearer token。
- 不保存 provider 配置。
- 不把 AI 输出写成本地圣经文本 source of truth。
- 页面 dispose 后不能把过期响应写回当前 UI state。
- `bible_study_help` 必须发送 `bible_passage` 和稳定 verse id；
  `sermon_qa` 必须发送 `sermon` 和稳定 sermon id。SDK 不允许调用者自由伪造
  其他 resourceType。
- 两类 member task 都必须发送非空问题，`bible_study_help` 还必须发送非空
  reference；共享 API contract 在 transport 边界执行该校验。
- 响应必须严格验证 `data` envelope、预期 task、provider、非空 Markdown、
  safetyNotice、usage 和 latency；畸形响应抛出 `FormatException`，不能补空字符串、
  `disabled` 或 `unknown` 默认值。
- App title/reference 上限为 200 字符、问题上限为 1000 字符、正文上限为
  12000 字符、每个 context value 上限为 3000 字符、resource id 上限为 120
  字符；locale 只接受 `zh-Hans`、`zh-Hant`、`en`、`es`。这些约束与共享 API
  contract 对齐。Repository 负责校验身份字段并生成有截断标记的受控上下文，
  UI 不直接裁剪业务 payload。
- 打开 Study/Sermon AI sheet 不自动调用后端；请求必须来自用户明确操作。
- 用户修改问题、退出登录或切换 member actor 后，旧结果和旧在途响应必须失效。
- 后端返回 Markdown 通过共享 `AppMarkdownBody` 呈现，不当作普通纯文本。

## Error Handling

前端必须识别：

- `ai_provider_disabled`
- `ai_provider_misconfigured`
- `ai_provider_request_failed`
- `ai_provider_timeout`
- `ai_provider_network_failed`
- `ai_provider_response_invalid`
- `ai_task_input_required`
- `ai_rate_limited`

认证和权限错误继续走现有 auth/error SDK。

`ai_rate_limited` 会返回 `retry-after`、`x-ratelimit-limit`、
`x-ratelimit-remaining` 和 `x-ratelimit-reset` headers。前端应该提示用户稍后重试，不应在本地绕过或重放请求。

## Related Docs

- [../core/ai_contract.md](../core/ai_contract.md)
- [../capabilities/ai_provider.md](../capabilities/ai_provider.md)
- [../features/ai_content_assist.md](../features/ai_content_assist.md)
- [../features/ai_bible_study.md](../features/ai_bible_study.md)
