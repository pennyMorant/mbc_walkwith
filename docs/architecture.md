# MBC WalkWith Architecture

状态：架构入口

本文档是 MBC WalkWith 的架构入口。它只说明系统分层、阅读顺序和边界关系，不重复完整 API、数据库表或功能细节。

## 1. Document Map

架构文档分为六层：

```text
architecture/   系统原则和 App / 后端 Web 大边界
core/           全系统契约层，定义 feature 如何接入
features/       用户或管理员可完成的业务闭环
domains/        多个 feature 共享的业务模型和规则
surfaces/       App、管理 Web、Backend API 的表达层边界
capabilities/   外部能力、副作用和可替换 adapter 边界
```

入口文档：

- [architecture/app.md](architecture/app.md)：移动 App 端架构边界。
- [architecture/backend_web.md](architecture/backend_web.md)：后端与管理 Web 架构边界。
- [core/README.md](core/README.md)：core 的定位和依赖方向。
- [core/contracts.md](core/contracts.md)：全系统契约。
- [core/feature_integration.md](core/feature_integration.md)：feature 接入规则。
- [features/README.md](features/README.md)：feature 边界和目录。
- [domains/README.md](domains/README.md)：领域模型边界。
- [surfaces/README.md](surfaces/README.md)：surface 边界。
- [capabilities/README.md](capabilities/README.md)：外部能力边界。

相关基础文档：

- [product_vision_zh.md](product_vision_zh.md)：产品目标和最终形态。
- [development_guidelines.md](development_guidelines.md)：技术栈、目录、编码规范。
- [api.md](api.md)：接口契约。
- [database.md](database.md)：数据模型和迁移计划。
- [privacy_security.md](privacy_security.md)：隐私、安全和审计。
- [operations.md](operations.md)：部署和运维。
- [sdk.md](sdk.md)：SDK、DTO、repository 和 API client 规则。

## 2. Product Shape

MBC WalkWith 是教会生活陪伴平台，不是社交平台、内容流量平台，也不是电商或数字内购产品。

最终产品由两大工程面组成：

- 移动 App：会友每天使用的入口，包含读经、圣经 TTS、讲道、教会生活、活动报名、活动签到、小组、课程、服事、代祷、奉献、专项基金、年度证明、通知、成长路径、读经计划和个人设置；界面支持 English、Español、简体中文和繁體中文，默认跟随系统语言。
- 后端 + Web：后端提供可信 API；管理 Web 让教会同工维护内容、管理活动、小组、课程、服事排班、讲道资源、讲道讨论包、读经计划、新人跟进、成长路径、代祷审核、会员关怀、奉献基金、对账、年度证明、通知、任务和审计；公开 Web 作为对外 landing，展示教会宗旨、聚会信息、App 引导、地图和联系入口；Web 界面支持 English、Español、简体中文和繁體中文，默认跟随系统/浏览器语言。

系统要给会友的感觉是安静、清楚、可信、实用。系统要给管理员的感觉是可追踪、可审核、可恢复、可交接。

## 3. Architecture Thesis

MBC WalkWith 的架构不是文件夹命名，而是工作纪律：

```text
每个职责有明确 owner。
每个关键状态只有一个 source of truth。
每个副作用都经过边界。
每个能力都通过 contract 暴露。
每个本地处理或长任务都有明确 lifecycle owner。
每个失败都能说明原因、证据和下一步。
每条用户可见链路都能从入口追到最终状态。
```

如果一个改动让当前页面能用，但让职责、状态或副作用变得更含糊，这个改动就是架构倒退。

## 4. System Boundary

```text
Mobile App
  -> App surface
  -> feature contract
  -> app repository / API client / device capability
  -> Backend REST API

Admin Web
  -> Admin surface
  -> feature contract
  -> admin API client
  -> Backend admin API

Public Web
  -> Public surface
  -> published public API
  -> Backend public API

Backend API
  -> route surface
  -> feature service
  -> domain rule + capability contract
  -> repository / gateway
  -> Postgres / object storage / Stripe / notification provider
```

Core 只定义契约和接入规则，不拥有具体业务。Feature 实现业务闭环。Domain 承载共享业务规则。Capability 封装外部副作用。Surface 只表达状态和触发 intent。

## 5. Dependency Direction

允许方向：

```text
surface -> feature contract
feature -> core contract
feature -> domain rule
feature -> capability contract
capability adapter -> external system
repository -> storage
composition root -> concrete implementation
```

禁止方向：

```text
core -> concrete feature
domain -> UI
domain -> provider SDK
surface -> raw database
surface -> payment secret
surface -> object storage private bucket
capability -> hidden business rule
feature -> another feature private internals
```

## 6. High-Risk Domains

以下领域必须按 core contract 和 feature 链路验证：

- 奉献、Stripe、手续费、退款、争议、payout、年度证明。
- 活动报名、名额、重复报名、取消、签到。
- 小组、课程、服事排班、申请加入、出勤、提醒和可见性。
- 新人跟进、转会员、成长路径、任务引用、负责人和牧养进度。
- 读经计划、经文引用、本地 Bible 文本边界和跨设备进度。
- 讲道讨论包、AI 草稿、人工审核、个人回应和小组可见性。
- 讲道音频、文案、本地转录、大纲、经文引用和发布审核。
- 圣经文本版权、本地读经、TTS 播放生命周期。
- 代祷隐私和可见性。
- 会员关怀、探访记录、牧养备注、负责人和隐私等级。
- 会员身份、设备通知 token、通知偏好。
- 管理员角色、财务权限、审计日志。
- 部署脚本、环境变量、对象存储和本地处理包上传链路。

这些领域不能只做 UI happy path。必须验证失败路径、权限路径、重复提交、恢复和审计。

## 7. Completion Standard

一个架构敏感改动完成前，必须能回答：

- owner 在哪里。
- source of truth 在哪里。
- contract 是什么。
- side effect 被哪个 capability 包住。
- lifecycle owner 是谁。
- 错误如何分类和恢复。
- App / Admin Web / Backend API 哪些只是 surface。
- 主链路和失败链路如何验证。
- 相关 `docs/features`、`docs/domains`、`docs/surfaces`、`docs/capabilities` 是否同步。

文档必须描述当前真实系统，不保留已经废弃的旧架构说法。
