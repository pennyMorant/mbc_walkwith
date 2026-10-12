# Content Localization

状态：已接入 Life、讲道、讲道讨论包与发布通知；后台已提供四语状态、单语言重试、全语言顺序生成和人工覆盖确认。官网内容继续使用其既有的四语设置配置作为唯一事实来源。

## Goal

让管理员为已保存的教会内容维护英语、西语、简体中文和繁体中文版本。管理员可以手工填写翻译，也可以使用已配置的 AI provider 生成草稿；AI 结果仍属于待管理员复核的内容。

## Ownership And Source Of Truth

- 原文与 `revision` 属于 Life post、sermon 或 sermon discussion guide 本身。
- 翻译由发布型 Feature 专属拥有：`life_post_translations`、`sermon_translations`、`sermon_discussion_guide_translations`。
- 通知是投递快照，不是通用内容翻译资源；管理员自定义的通知语言副本随发布请求进入通知服务。官网由四语 `public_landing` settings 专属拥有，不接入通用内容翻译 API。
- 翻译协调服务不拥有原文。每条记录只保存该 Feature 内容的语言投影、源版本、来源、模型、token 使用量和生成时间。
- 原通用 `content_localizations` 表已移除，不保留开发期兼容路径。
- App、公开 API 和会友 API 只读取与当前原文 revision 一致的翻译；旧 revision 的翻译不会投影。

## Write And Read Chain

管理员在 Life、讲道或讲道讨论包编辑区打开翻译卡片 -> 后端确认资源存在 -> 管理员保存时携带 sourceVersion -> 后端确认当前 revision 和允许字段 -> 保存手工翻译，或在同时具备内容编辑与 `ai:use` 权限时调用 `content_translation` AI policy 生成并保存 AI 翻译 -> Life、讲道和讨论包读取 API 解析 `Accept-Language` -> 仅投影当前 revision 的有效翻译。翻译卡片展示四种语言的状态；全语言生成按目标语言顺序执行，长文失败后管理员可以只重试失败语言。

远程 AI 调用不依赖 VPS worker。翻译协调服务把长文本按 Markdown 段落切为最多 3000 字符的块，使用 `content_translation_chunks` 持久化每个块的输入、输出、状态、模型、token 和错误码。一次请求在当前 HTTP 生命周期内顺序执行；已完成块不会再次调用模型，失败块由管理员再次触发同一目标语言时恢复。该任务表只保存执行状态，不拥有任何发布内容。

Life 可翻译 `title`、`body`、`meta`、`ctaLabel`；讲道可翻译 `title`、`summary`、`transcriptText`；讲道讨论包可翻译 `title`、`summary`。讲员、经文引用、日期、URL、名额、金额、身份 ID、坐标、状态和 CTA 目标都是结构化事实，绝不交给 AI 改写。

发布通知按设备当前 locale 分组。推送任务保存每个语言组的标题、正文和目标设备快照，重试不重新翻译；成员通知中心使用该成员最近活跃设备的语言，并在没有设备时回退到源语言。内容源缺少当前 revision 的译文时，推送与通知中心原样使用源内容，不会混合改写结构化字段。

## API

- `GET /v1/admin/content-localizations/:resourceType/:resourceId`
- `PUT /v1/admin/content-localizations/:resourceType/:resourceId/:locale`
- `POST /v1/admin/content-localizations/:resourceType/:resourceId/:locale/auto-translate`

自动翻译与其他管理端 AI 调用共用 `ai:use` 权限、管理员 rate limit、Token 限额和审计边界。限额按日/月累计 Token 计算，并在调用前按当前文本长度、chunk 数和策略最大输出保守预留 Token；不保存、不计算也不展示费用。AI 翻译记录 provider、model、输入 Token、输出 Token、总 Token、耗时和生成时间；长文翻译的耗时只汇总本次请求实际调用的 chunk。手工翻译、AI 翻译、模型策略和 Token 限额变更都会留下审计摘要。

## Verification

- 非法资源返回 not found。
- 旧 sourceVersion 返回 conflict。
- 未允许字段返回 validation error。
- 资源更新后旧翻译不会继续公开。
- 请求 `Accept-Language` 匹配的语言时，Life 和讲道投影当前翻译；无匹配翻译时返回原文。
