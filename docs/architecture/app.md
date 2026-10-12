# App Architecture

状态：移动 App 端架构规则

本文档说明 MBC WalkWith App 端的责任边界。App 是会友体验入口，但不是所有业务真相的 owner。

阅读前先看：

- [../core/README.md](../core/README.md)
- [../core/contracts.md](../core/contracts.md)
- [../core/feature_integration.md](../core/feature_integration.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)

## 1. App Role

App 负责：

- 展示读经、讲道、生活、活动、代祷、奉献、年度证明和个人设置。
- 收集用户输入并发起 typed intent。
- 管理页面临时状态。
- 管理本地阅读体验。
- 管理圣经 TTS 和讲道播放的设备端生命周期。
- 缓存公开或低敏内容。
- 展示后端返回的可信状态和错误恢复动作。

App 不负责：

- 决定活动报名是否最终成功。
- 决定奉献支付是否最终成功。
- 计算 Stripe 手续费、净额、payout、争议。
- 生成年度证明的可信内容。
- 决定讲道、生活内容、代祷是否可见。
- 直接连接 Postgres、Stripe、对象存储私有桶、AI provider 或通知 provider。

## 2. App Layers

推荐方向：

```text
screen/widget
  -> controller/provider
  -> repository
  -> API client / local data source / platform service
  -> backend contract or device capability
```

职责：

- screen/widget：渲染状态、收集输入、展示 loading/empty/error。
- controller/provider：把 UI intent 转成 feature action，协调 repository。
- repository：App 端 feature 数据访问 owner，隐藏 remote/local/mock 来源。
- API client：HTTP transport、auth header、错误映射。
- local data source：本地缓存、偏好、离线数据。
- platform service：TTS、音频播放、系统分享、通知 token 等设备能力。

UI 不直接调用 HTTP client、secure storage、TTS engine、audio engine 或分享插件，除非这是极小的纯展示工具且没有业务状态。

## 3. App Source Of Truth

App 内可拥有的 source of truth：

- 阅读主题、字体、语言、圣经版本偏好。
- 最近阅读章节和本地阅读进度。
- 公共圣经文本的本地数据包或缓存。
- 圣经 TTS 当前状态：idle、loading、speaking、paused、error。
- 讲道播放器当前状态：playing、paused、position、speed、buffering。
- 公共讲道、公告、活动列表的缓存视图。
- 已下载 PDF 的临时文件句柄和分享状态。

后端拥有的 source of truth，App 只能读取或请求变更：

- 会员身份和权限。
- 活动报名、取消、候补、签到。
- 奉献交易、退款、争议、费用、payout、对账。
- 年度证明生成状态和下载授权。
- 讲道、生活内容、代祷的审核和发布状态。
- 通知订阅的服务端记录。

## 4. Study And Bible TTS

读经是 App 的核心体验。

架构规则：

- 无版权或已授权圣经文本可以作为本地阅读数据。
- App 可以本地搜索、跳转、朗读、记录阅读进度。
- TTS 是“读文字圣经”，不是播放音频圣经。
- TTS lifecycle 由 App TTS service/controller 拥有。
- UI 只显示朗读状态、控制播放、展示错误和恢复动作。
- 如果未来接入学习解释或 AI，App 只调用后端接口，不直接调用 AI provider。

TTS 链路：

```text
chapter/verse selection
-> speak intent
-> text lookup
-> TTS service lifecycle
-> speaking state update
-> UI controls and progress
-> stop/pause/recover/error feedback
```

## 5. Sermons

讲道模块展示教会管理员发布的音频、文案、大纲、经文引用和相关资源。

App 可以：

- 展示讲道列表和详情。
- 播放管理员上传或后端授权的音频。
- 保存本地播放进度。
- 按经文跳回读经。
- 缓存公开讲道元数据和文案。

App 不可以：

- 决定讲道是否发布。
- 直接上传或修改讲道资源。
- 直接访问私有对象存储。
- 使用转录、AI 或对象存储 provider 密钥。

播放 lifecycle owner 是 App player service/controller。资源可见性和签名下载 URL owner 是后端。

## 6. Life, Events, And Registration

生活模块包含公告、周报、活动和报名入口。

App 负责展示：

- 公开生活内容。
- 会友可见内容。
- 活动详情、报名状态、取消入口、签到信息。

后端负责判断：

- 内容可见性。
- 活动是否开放。
- 是否需要登录。
- 是否重复报名。
- 是否还有名额。
- 是否进入候补。
- 是否允许取消或签到。

报名链路：

```text
tap register
-> App sends registration intent
-> backend validates member/event/capacity/rules
-> backend writes registration state
-> App refreshes canonical event detail
-> UI shows confirmed/waitlisted/closed/error
```

## 7. Prayer

代祷默认高隐私。

App 可以：

- 提交代祷请求。
- 显示自己的请求。
- 显示后端允许当前会员看到的请求。
- 展示审核状态和可见性说明。

App 不可以：

- 自行扩大可见范围。
- 长期缓存私密代祷正文。
- 在本地判断小组或会友权限。

## 8. Giving And Annual Statements

奉献是高敏感度财务链路。

App 可以：

- 发起奉献意图。
- 打开 Stripe Checkout 或后端指定支付流程。
- 展示后端返回的交易历史。
- 请求年度证明。
- 下载、预览、分享后端授权的 PDF。

App 不可以：

- 处理原始卡号。
- 把支付成功页当成最终交易状态。
- 计算手续费或净额。
- 生成可信年度证明。
- 把年度证明长期放进普通缓存。

奉献链路：

```text
tap give
-> App creates checkout session through backend
-> Stripe handles payment
-> backend webhook confirms final state
-> App refreshes giving history
-> UI shows confirmed/pending/failed/refunded
```

PDF 分享链路：

```text
tap annual statement
-> App requests statement from backend
-> backend verifies member and statement status
-> backend returns signed download
-> App downloads temporary file
-> App invokes system share/open
-> temporary file is cleaned by app policy
```

## 9. App Error Model

App 错误要能区分：

- network。
- auth/session。
- permission。
- validation。
- server state conflict。
- payment pending/failure。
- media unavailable。
- TTS unsupported/interrupted。
- local cache/storage。

UI 文案应该来自结构化错误，而不是随手拼字符串。错误需要给出下一步：重试、登录、刷新、联系管理员、稍后查看、重新下载。

## 10. App Verification

涉及 App 改动时至少验证：

- `flutter analyze`
- 目标 `flutter test`
- 手动走通改动链路的 happy path 和 failure path

高风险 App 链路还要检查：

- UI 是否越权承担业务规则。
- repository/API client 边界是否被绕过。
- 敏感内容是否进入普通缓存。
- TTS/player 生命周期是否可停止、恢复、清理。
- PDF、音频、通知 token 是否有清楚的 owner。

## 11. Related Feature Docs

- [../features/bible_tts.md](../features/bible_tts.md)
- [../features/sermon_publishing.md](../features/sermon_publishing.md)
- [../features/event_registration.md](../features/event_registration.md)
- [../features/giving_flow.md](../features/giving_flow.md)
- [../features/annual_statement.md](../features/annual_statement.md)
