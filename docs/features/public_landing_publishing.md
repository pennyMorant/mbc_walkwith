# Public Landing Publishing

状态：第一版闭环

## 1. Feature Goal

让教会同工通过后端配置维护官网介绍、聚会日程、牧者与同工资料和公开入口，同时让官网自动展示已经由教会审核发布的近期活动。

## 2. Non-Goals

- 官网不成为讲道、报名、会员或奉献业务工作台。
- 官网不复制活动记录，也不决定活动发布、名额或报名状态。
- 源码默认值不承载部署方的真实地址、电话、人员或聚会时间。

## 3. Owners

- Feature owner：`public_landing` 后端聚合模块。
- 配置 owner：Settings service 的 `public_landing` category。
- 活动 owner：`church_life_publishing` 的 Life post service。
- Surface owner：Admin Settings 与 Public Web。

## 4. Source Of Truth

- 身份、导航、宗旨、聚会说明、固定日程、人员介绍、联系与 App 入口：`app_settings`。
- 近期活动：公开、已发布、尚未结束且 `type=event` 的 Life post。
- Public Web 不保存第二份内容或活动列表。

## 5. State Model

配置区块按 locale 独立保存并通过 schema 校验。日程或人员的目标语言列表为空时，保留目标语言区块文案并回退简体中文源列表。近期活动只有 Life feature 的草稿、审核、发布、下架和归档状态；Landing 只读取 `published + public` 投影。

## 6. Capability Contracts

- 不新增外部 capability。
- 图片 URL 只能来自管理员已经批准的公开资源。
- 内容多语言投影复用 content localization contract。

## 7. App Surface Boundary

移动 App 不读取 Landing 配置，也不依赖 Landing 的活动投影。

## 8. Admin Web Surface Boundary

Settings 页面为固定日程、人员介绍和近期活动区块提供结构化编辑器，其他高级 Landing 配置继续显示后端校验错误。活动继续在 Life 内容页面创建、审核和发布，不在 Settings 中重复录入。

## 9. Backend Service Boundary

`GET /v1/public/landing?locale=...` 聚合 locale 对应的 Landing 配置，并从 Life service 读取近期活动。聚合层只生成公开只读投影，不改变活动状态。

## 10. Side Effects

配置更新写入 `app_settings` 并进入既有 Settings 审计链。活动发布副作用仍归 Life feature。

## 11. Lifecycle And Recovery

- 缺少可选日程、人员或活动时，官网隐藏对应区块。
- 配置不符合 contract 时拒绝更新，不发布部分损坏数据。
- API 不可用时官网显示错误状态，不回退到前端硬编码业务内容。

## 12. Error Model

- 无效配置：`setting_value_invalid`。
- Landing 读取失败：Public Web 显示可恢复错误状态。
- 活动读取失败：整个聚合请求失败，避免显示来源不明的旧活动。

## 13. Main Logic Chain

```text
管理员维护 Landing 配置 / 发布活动
-> Settings 或 Life service 保存 canonical state
-> GET /v1/public/landing 按 locale 读取配置
-> 聚合公开、已发布、尚未结束的 event
-> 应用已有翻译投影
-> Public Web 渲染对应区块
```

## 14. Failure Chains

- 无效 JSON -> 后端 schema 拒绝 -> Admin 显示错误 -> 旧配置继续生效。
- 活动未公开或未发布 -> 不进入 Landing 响应。
- 活动结束或下架 -> 下一次请求不再返回。

## 15. Verification Checklist

- 四种 locale 均返回完整 Landing contract。
- Settings 可校验 schedule、people 和 events 配置。
- 只有公开、已发布、未结束的 event 被聚合。
- 活动按开始时间排序并受 `maxItems` 限制。
- 活动时间固定使用 `church.timezone`，不随访客设备时区改变。
- 日程和人员缺少目标语言条目时回退源语言条目。
- Public Web 在空数据时不显示空区块。
- 桌面和移动布局无溢出。

## 16. Related Docs

- [church_life_publishing.md](church_life_publishing.md)
- [../surfaces/public_web.md](../surfaces/public_web.md)
- [../surfaces/admin_web.md](../surfaces/admin_web.md)
- [../sdk/public_web.md](../sdk/public_web.md)
