# AI Bible Study

状态：后端 API、App SDK 契约和结果组件已接入；当前 App 入口暂时隐藏，外部来源引用策略仍待后续设计

## Feature Goal

让会友在 App 中围绕经文、讲道笔记或个人问题获得学习辅助，帮助理解经文、整理问题和形成反思。

## Non-Goals

- 不替代牧者辅导。
- 不给最终神学裁决。
- 不处理奉献、支付、年度证明、医疗、法律或财务建议。
- 不让 App 直连 OpenAI、Gemini 或中转站。
- 不上传整本圣经版权文本给 provider。

## Owners

- Feature owner：Backend AI feature service。
- Surface owner：App Bible / Sermon study surfaces。
- Capability owner：AI provider adapter。
- Domain owner：Bible content and sermon content domains。

## Source Of Truth

AI 回答不是圣经文本、讲道内容或用户资料的 source of truth。

Source of truth 仍然属于：

- 圣经文本：Bible content domain / local Bible data source。
- 讲道：sermon repository。
- 用户身份：member auth/profile。

## State Model

会友 AI 学习状态：

- `idle`
- `asking`
- `answered`
- `failed`
- `cleared`

后端第一版不持久化对话历史，只处理单次请求。

## Capability Contracts

使用：

- AI provider。
- Member auth。
- Audit log。
- Bible content context。
- Sermon context。

## App Surface Boundary

App 可以：

- 在产品重新启用该能力后显示受控入口；当前发布版本不展示读经、讲道或偏好设置中的 AI 操作。
- 在圣经阅读页提交经文引用和问题。
- 在讲道详情页提交讲道上下文问题。
- 展示 AI 学习辅助结果。
- 显示 pastoral safety notice。
- 仅在用户明确点击生成后发起请求；打开 sheet 本身不消耗 provider 配额。
- 按共享契约校验 locale、resource id，并限制 title、reference、问题、正文和
  context 长度；长讲道优先使用摘要、纲要、经文引用和受控文稿节选。

App 不可以：

- 保存 provider key。
- 自己拼接 provider API。
- 把 AI 回答保存为圣经注释 source of truth。
- 把敏感奉献、关怀或支付数据传给 AI。

## Admin Web Surface Boundary

管理 Web 不拥有会友 AI 查经体验。

未来如果需要配置提示词模板或开关，属于系统设置或 AI capability 配置，不属于会友端学习状态。

## Backend Service Boundary

后端负责：

- 校验 member token。
- 校验 task 和 input。
- 强制 `bible_study_help -> bible_passage`、`sermon_qa -> sermon` 的资源归属，
  且两者都必须携带稳定 resource id。
- `bible_study_help` 必须携带非空经文引用和问题，`sermon_qa` 必须携带非空问题；
  这些约束由共享请求契约强制，不能只依赖 App 按钮状态。
- 构造学习辅助 prompt。
- 调用 AI provider adapter。
- 返回 markdown answer 和与请求 locale 一致的 safetyNotice。
- 记录审计摘要。

## Side Effects

- 外部 AI provider 请求。
- 审计日志写入。

不产生：

- 圣经文本修改。
- 讲道内容修改。
- 会员资料修改。
- 支付或奉献状态变化。

## Lifecycle And Recovery

失败可恢复：

- 未登录：引导登录。
- provider 未配置：展示暂不可用。
- provider 失败：允许重试。
- 输入为空：提示补充经文或问题。

## Error Model

- `member_auth_required`
- `member_session_invalid`
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
member opens Bible reader or sermon detail
-> member asks a study question
-> App sends member AI study request to backend
-> Backend verifies member token
-> Backend validates input and task
-> AiService builds study-safe prompt
-> AI provider adapter calls configured provider
-> Backend returns markdown answer with safetyNotice
-> App displays answer without changing source content
```

## Failure Chains

必须验证：

- 未登录用户。
- 空问题和空上下文。
- provider disabled。
- provider 超时。
- provider 返回无效内容。
- task 与 resourceType 不匹配或缺少 resourceId。
- App 收到缺字段、错 task、未知 provider、空 Markdown 或畸形 usage 时进入
  可恢复错误态，不显示空答案或伪造默认 provider。
- 长讲道上下文超过 API 预算时由 repository 生成明确标记的节选，不让后端
  validation failure 伪装成 provider failure。
- App 离开页面时取消或忽略旧响应。
- 问题内容或当前 member actor 改变时，清除旧结果并忽略在途旧响应。

## Verification Checklist

- App 不直连 provider。
- 后端只接收必要上下文。
- 不上传高敏支付和关怀数据。
- AI 输出不是圣经或讲道 source of truth。
- safetyNotice 可见。
- Study 和 Sermon 使用同一个 Core response/locale/request contract，Markdown
  通过共享 renderer 呈现；两个 feature 不互相引用私有 domain model。
- task/resource 绑定由共享 contract 和后端 route 强制，审计资源不能由客户端
  伪装成 life post、notification 或其他业务对象。
- provider 调用失败也要写入脱敏 `ai.member_study.failed` 审计记录。
- 错误可恢复。
- 重复生成请求会被后端按 member actor 限流。

## Related Docs

- [../core/ai_contract.md](../core/ai_contract.md)
- [../capabilities/ai_provider.md](../capabilities/ai_provider.md)
- [bible_tts.md](bible_tts.md)
- [sermon_discovery.md](sermon_discovery.md)
- [../domains/bible_content.md](../domains/bible_content.md)
- [../sdk/ai.md](../sdk/ai.md)
