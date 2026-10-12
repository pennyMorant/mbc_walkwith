# AI Provider

状态：AI provider 外部能力边界

## Purpose

封装 OpenAI、Gemini 和 OpenAI-compatible 第三方中转站 API，让后端 feature 可以用统一接口生成文本。

## Owner

Backend AI capability adapter。

## Providers

- `disabled`：默认状态，不调用外部 AI。
- `openai`：OpenAI chat completions 兼容接口。
- `gemini`：Gemini generateContent 接口。
- `openai_compatible`：第三方中转站或自建网关，使用 OpenAI-compatible chat completions。

## Environment Contract

```text
AI_PROVIDER=disabled | openai | gemini | openai_compatible
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=
AI_TIMEOUT_MS=30000
AI_MAX_OUTPUT_TOKENS=1200
AI_AUDIT_ENABLED=true
AI_EXTRA_HEADERS_JSON=
AI_RATE_LIMIT_WINDOW_MS=60000
AI_ADMIN_RATE_LIMIT_PER_WINDOW=20
AI_MEMBER_RATE_LIMIT_PER_WINDOW=10
```

规则：

- `disabled` 不需要 key。
- `openai` 可以省略 base URL。
- `gemini` 可以省略 base URL。
- `openai_compatible` 必须显式配置 base URL。
- provider key 只能存在后端环境变量或 VPS secret 配置，不进入 App、Admin Web、SDK 或日志。
- rate limit 是后端 route 边界，按 admin/member actor 分桶。
- 非正数 `AI_TIMEOUT_MS` 或 `AI_MAX_OUTPUT_TOKENS` 视为 provider
  misconfigured；status 不得报告 enabled，也不能等到调用时才超时或发送非法参数。

## Contract

输入：

- system prompt。
- user prompt。
- temperature。
- max output tokens。

输出：

- text。
- usage。
- latency。

## Rules

- Capability 不决定 AI 任务属于讲道、生活、通知或查经。
- Capability 不保存业务对象。
- Capability 不写数据库。
- Capability 不决定内容是否发布。
- Capability 只把 provider 错误映射成结构化错误。
- 超时、无效响应、provider 5xx 必须可恢复并可重试。
- Provider 原始错误 body 不得返回给客户端。
- Provider JSON 必须运行时验证：文本非空，usage token 为非负整数或缺省；
  类型错误、负数或畸形嵌套结构统一映射为
  `ai_provider_response_invalid`。

## Errors

- `ai_provider_disabled`
- `ai_provider_misconfigured`
- `ai_provider_request_failed`
- `ai_provider_timeout`
- `ai_provider_network_failed`
- `ai_provider_response_invalid`

## Used By

- [../features/ai_content_assist.md](../features/ai_content_assist.md)
- [../features/ai_bible_study.md](../features/ai_bible_study.md)
- [../features/content_localization.md](../features/content_localization.md)

## Runtime Management

管理员可以配置多个 provider、每项 capability 的主/备用模型、最大输出 Token、超时和日/月 Token 限额。每次任务解析自己的 capability policy；同一 provider 被多个 capability 复用时，也不得借用其他 capability 的超时或最大输出。连接测试不属于 capability，使用后端环境的默认超时与最大输出，只发送固定健康检查，不记录 key 或 provider 原始响应。只有可重试的 provider 失败才会使用备用 provider，并把实际执行的 provider/model 写入审计。

调用完成时审计记录输入、输出和总 Token；系统不计算或展示费用。启用限额时，调用前按当前请求的文本长度、翻译 chunk 数和策略最大输出保守预留 Token，避免长输入或多 chunk 请求穿透日/月配额。限额统计读取完整 AI 审计序列，管理页只显示最新 200 条记录。
