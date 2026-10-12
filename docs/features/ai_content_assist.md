# AI Content Assist

状态：后台 AI provider、内容草稿 API、受控输入、可编辑预览、应用/丢弃和旧草稿失效链路已接入

## Feature Goal

让教会管理员在讲道、生活内容和通知发布前，用 AI 生成可编辑草稿，提高文字整理效率。

## Non-Goals

- 不自动发布内容。
- 不替代牧者、同工或管理员审核。
- 不把 AI 输出直接写入讲道、生活内容或通知 source of truth。
- 不允许管理 Web 直连 OpenAI、Gemini 或中转站。

## Owners

- Feature owner：Backend AI feature service。
- Surface owner：Admin Web content tools。
- Capability owner：AI provider adapter。
- Audit owner：Audit domain。

## Source Of Truth

AI 输出不是最终内容 source of truth。

最终 source of truth 仍然属于：

- 讲道：sermon repository。
- 生活内容：life post repository。
- 通知：notification job/service。

AI draft 只是临时草稿，管理员确认后才进入对应 feature 的正式保存链路。

## State Model

AI 草稿状态：

- `idle`
- `generating`
- `ready`
- `failed`
- `accepted_by_editor`
- `discarded`

后端第一版只返回单次 draft response，不持久化 draft 状态。

## Capability Contracts

使用：

- AI provider。
- Admin auth / permission。
- Audit log。

## App Surface Boundary

App 不提供后台内容辅助入口。

## Admin Web Surface Boundary

管理 Web 可以：

- 在讲道编辑页生成摘要或大纲草稿。
- 在生活内容编辑页生成公告草稿。
- 在通知编辑页生成短通知草稿。
- 展示安全提醒和可编辑结果。
- 明确应用或丢弃临时草稿；切换业务对象、task、locale 或源内容后，旧草稿
  立即失效，旧异步响应不能写回新编辑器。
- 使用共享 request limits 生成受控讲道正文和 context 节选，避免长文稿在
  客户端 schema 校验阶段失败。

管理 Web 不可以：

- 保存 provider key。
- 绕过 `ai:use` 权限。
- 把 AI 输出自动发布。
- 把 provider 错误改写成普通成功状态。

## Backend Service Boundary

后端负责：

- 校验 `ai:use` 权限。
- 校验 task 和 input。
- 绑定 task 与允许的 resource type，防止审计归属被前端伪造。
- 构造 church-safe prompt。
- 调用 AI provider adapter。
- 返回 markdown draft。
- 记录审计摘要。

## Side Effects

- 外部 AI provider 请求。
- 审计日志写入。

不产生：

- 内容自动发布。
- 讲道/生活/通知正式对象写入。
- 用户隐私或支付数据写入 provider。

## Lifecycle And Recovery

失败可恢复：

- provider 未配置：提示管理员配置。
- provider 超时或失败：允许重试。
- 输入为空：要求补充内容。
- 编辑对象或源内容变化：清空临时草稿并忽略旧响应。
- 源内容变化时，在途请求继续保持 pending，直到 settle 前不能再次生成；序号只用于
  拒绝旧结果，不能通过 reset 提前开放按钮并制造并发 provider 请求。

重复点击生成必须由前端按钮状态或后端 rate limit 逐步保护，不能制造多处 source of truth。

## Error Model

- `admin_auth_required`
- `admin_permission_denied`
- `ai_task_input_required`
- `ai_provider_disabled`
- `ai_provider_misconfigured`
- `ai_provider_request_failed`
- `ai_provider_timeout`
- `ai_provider_network_failed`
- `ai_provider_response_invalid`
- `ai_rate_limited`

## Main Logic Chain

```text
admin opens content editor
-> Admin Web requests AI status
-> admin clicks generate draft
-> Backend verifies ai:use
-> Backend validates task input
-> AiService builds task prompt
-> AI provider adapter calls configured provider
-> Backend returns markdown draft with safetyNotice
-> Admin reviews and edits
-> Existing feature save/publish flow owns final content
```

## Failure Chains

必须验证：

- 未登录后台用户。
- 缺少 `ai:use` 权限。
- task 与 resourceType 不匹配。
- provider disabled。
- provider misconfigured。
- 空输入。
- provider 返回空内容。
- provider 返回与请求不一致的 task。
- 30 分钟讲道文稿超过 request body 上限。
- 生成过程中切换讲道、生活内容、locale 或 task。
- AI 输出未被自动发布。

## Verification Checklist

- API route 使用 shared contract。
- 权限只认 `ai:use`。
- sermon、life post、notification 草稿只能写入对应业务资源的审计归属。
- 审计不保存完整 prompt/output。
- provider 调用失败也要写入脱敏 `ai.admin_draft.failed` 审计记录。
- provider key 不进入前端。
- 输出带 safety notice。
- English、Español、简体中文和繁體中文均有 AI 状态、错误和操作文案。
- 输入上限直接复用 TypeScript shared contract constants，不在各页面复制数字。
- 讲道、生活和通知的正式保存仍走原 feature。
- 重复生成请求会被后端按 admin actor 限流。

## Related Docs

- [../core/ai_contract.md](../core/ai_contract.md)
- [../capabilities/ai_provider.md](../capabilities/ai_provider.md)
- [sermon_publishing.md](sermon_publishing.md)
- [church_life_publishing.md](church_life_publishing.md)
- [notification_delivery.md](notification_delivery.md)
- [../sdk/ai.md](../sdk/ai.md)
