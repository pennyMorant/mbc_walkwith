# Error Model

状态：结构化错误契约

错误是产品和架构模型，不是临时字符串。错误必须帮助系统回答：发生了什么、谁拥有修复、能否恢复、下一步是什么。

## 1. Required Fields

重要错误应包含：

- `code`：稳定错误码。
- `category`：错误类别。
- `sourceLayer`：surface、feature、domain、capability、repository、external、unknown。
- `message`：用户或管理员可理解信息。
- `recoverable`：是否可恢复。
- `retryable`：是否可重试。
- `evidence`：诊断证据。
- `nextAction`：下一步动作。

API JSON 使用 camelCase 字段名。文档中讨论概念时可以写 source layer
或 next action，但接口、SDK 和测试必须保留 `sourceLayer` 与 `nextAction`。

Backend historical diagnostics can store `result.error` with the same shape.
It is not an active VPS processing lifecycle contract; current sermon
processing runs locally and uploads reviewed packages to the backend.

## 2. Categories

通用类别：

- `validation_error`
- `permission_denied`
- `authentication_required`
- `not_found`
- `state_conflict`
- `external_dependency_failed`
- `timeout`
- `retry_exhausted`
- `configuration_missing`
- `audit_required`

功能可扩展稳定子类，例如：

- `payment_pending`
- `webhook_duplicate`
- `event_capacity_full`
- `statement_not_ready`
- `tts_language_unavailable`
- `job_cancel_invalid_state`

## 3. Surface Rule

Surface 可以改写文案，但不能吞掉错误结构。UI 必须能从结构化错误得到：

- 是否显示重试。
- 是否要求登录。
- 是否提示联系管理员。
- 是否提示稍后查看。
- 是否刷新 canonical state。

## 4. Diagnostics Rule

高风险错误必须带诊断证据：

- request id。
- actor id。
- resource id。
- provider event id。
- job id。
- state before/after。
- timestamp。

敏感数据不能直接写进错误消息或普通日志。
