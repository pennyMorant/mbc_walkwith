# Core

状态：全系统契约层入口

`docs/core/` 定义 MBC WalkWith 的共享契约和接入规则。Core 不实现具体业务功能，也不拥有 feature 规则。Core 的职责是让 App、管理 Web、后端、本地处理工具、SDK、domain 和 capability 用同一套 contract 工作。

## 1. Core Owns Contracts

Core 拥有：

- feature 接入契约。
- capability 契约。
- source of truth 声明格式。
- lifecycle 契约。
- error model 契约。
- permission 和 audit 契约。
- logic chain 验证格式。

Core 不拥有：

- 活动报名规则。
- 奉献付款规则。
- 年度证明金额规则。
- 讲道发布审核规则。
- 圣经 TTS 播放实现。
- 管理 Web 页面状态。
- App 页面交互细节。

这些规则分别属于 `docs/features/`、`docs/domains/`、`docs/surfaces/` 和 `docs/capabilities/`。

## 2. Dependency Direction

允许：

```text
feature implementation -> core contract
domain rule -> core contract
surface -> feature contract
capability adapter -> capability contract
composition root -> concrete implementation
```

禁止：

```text
core -> concrete feature
core -> App screen
core -> Admin Web page
core -> Stripe SDK
core -> Postgres table
core -> object storage provider
```

Core 可以描述 contract 的形状，但不能知道具体 feature 的私有实现。

## 3. Required Core Files

- [contracts.md](contracts.md)：所有核心 contract 类型。
- [feature_integration.md](feature_integration.md)：feature 如何接入 core。
- [logic_chain.md](logic_chain.md)：主链路和失败链路验证标准。
- [error_model.md](error_model.md)：结构化错误模型。
- [lifecycle.md](lifecycle.md)：可恢复生命周期规则。
- [ai_contract.md](ai_contract.md)：AI task、provider、审计和错误共享契约。

## 4. Core Quality Rule

一个 feature 接入系统前，必须先声明：

- feature id。
- feature owner。
- source of truth。
- state model。
- surfaces。
- backend service owner。
- domains used。
- capabilities used。
- permissions。
- audit events。
- lifecycle owner。
- error categories。
- verification chain。

如果声明不完整，说明 feature 边界还不清楚。
