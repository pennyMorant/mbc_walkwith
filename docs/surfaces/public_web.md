# Public Web Surface

状态：第一版落地

`apps/public_web/` 是公开官网 landing surface。它服务访客、新朋友、会友和教会理事会的对外展示场景，不承载后台工作台，也不拥有业务 source of truth。

## 1. Surface Goal

公开官网要快速回答：

- 这是什么教会。
- 教会宗旨是什么。
- 本周什么时候、在哪里聚会。
- 新朋友如何开始。
- 公开入口、App 下载、地图和联系入口在哪里。
- 如何联系教会。

首页叙事中心：

```text
造就门徒，差派工人，领人归主
```

## 2. Ownership

Public Web owns:

- 公开 landing 页面布局。
- 首屏、导航、动效、响应式体验。
- 官网资源读取、loading 和错误展示。
- 访客行动入口，例如聚会、新朋友、App、地图和联系。

Public Web does not own:

- 讲道发布审核。
- 讲道列表、讲道详情、讲道播放和讲道文稿展示。
- 活动报名容量、截止、取消和签到规则。
- 奉献付款确认。
- 会员身份、代祷隐私、通知投递。
- 后台管理员权限。

## 3. Data Sources

第一版使用：

- `GET /v1/public/landing?locale=...` 读取官网身份、首屏、宗旨、聚会信息、教会入口、App 引导、联系信息和 CTA action。
- 同一聚合响应读取固定日程、公开人员介绍，并投影公开、已发布、尚未结束的近期活动。
- `public_landing` 分类下的 `app_settings` 是官网可变资源的后端 source of truth。
- 管理员通过管理 Web 的 Settings 页面维护官网导航、新朋友入口、地图链接、联系方式、社交媒体和 App 下载入口。
- 官网不调用 `GET /v1/sermons` 作为内容列表。
- 官网不直接调用 `GET /v1/life/posts`；Landing 后端聚合层只读取 canonical Life event 投影。
- 官网不展开 App 内业务模块清单，只保留公开介绍和入口。
- API 不可用时显示明确错误状态，不用本地硬编码内容冒充业务记录。

聚会时间、固定日程、人员介绍、地址、社媒、App 下载链接等资源保持 `GET /v1/public/landing?locale=...`
作为 public web 聚合入口，由后端从 settings 组合返回，不在 public Web
写死业务规则。

近期活动不是 Landing setting。活动仍由 Life feature 创建、审核和发布；聚合层只返回
`type=event`、`visibility=public`、`status=published` 且尚未结束的记录。

开源源码默认不包含真实聚会时间、地址、电话、地图、社交媒体、App 下载地址或
外部宣传图片。全新部署必须由管理员在 Settings 中填写；未配置时 API 返回空列表或
空字符串，Public Web 使用无外部图片的稳定布局，不伪造联系方式。

语言规则：

- 支持 English、Español、简体中文和繁體中文。
- 首次进入跟随浏览器/系统语言；用户手动选择后保存在浏览器本地。
- 简体中文使用基础 setting key，例如 `publicLanding.hero`。
- 其他语言使用 locale setting key，例如 `publicLanding.en.hero`、
  `publicLanding.es.hero` 和 `publicLanding.zh-Hant.hero`。
- Public Web 只负责选择 locale 和展示后端返回内容，不在前端维护另一份翻译资源真相。
- 浏览器标签页标题、描述和 favicon 跟随后端返回的 `identity.name`、`identity.mission`
  和 `identity.logoUrl`；`index.html` 只提供首屏加载前的默认值。

## 4. Routing And Deployment

开发入口：

```sh
bun run dev:public
```

构建入口：

```sh
bun run build:public
```

prebuilt 包包含：

```text
apps/public_web/dist
```

VPS 测试环境没有域名时，可以显式把 `public_origin` 配成同一个 IP host：

- `/` 服务 public landing。
- `/admin/` 服务 Admin Web，后台构建时必须传
  `VITE_ADMIN_BASE_PATH=/admin/`。
- `/v1` 代理 Backend API。

正式环境示例：

- `www.example.org` 服务 public landing。
- `control.example.org` 服务 Admin Web。
- `api.example.org` 或同站 `/v1` 服务 Backend API。

## 5. Motion Rules

Public Web 可以使用 JS 动画库，但动效必须服务信息路径。

第一版使用 `motion-v`：

- 首次进入播放 opening intro：光线、教会 logo、十字架、圣经意象和使命宣告。
- 使命三句话在 opening intro 中分别从左上、上方、右上进入，在中心汇聚后触发光圈和文字光扫，表达所有使命方向归向基督中心。
- opening intro 使用后端返回的 `identity.logoUrl`、`hero.imageUrl` 和
  `hero.mission`，不在前端硬编码教会资源。
- opening intro 必须作为 Hero 上方的透明覆盖层，Hero 背景在底层持续渲染；不能在动画结束时卸载一整张开场页再切换到 Hero。
- 同一浏览器会话只完整播放一次，避免访客反复进入时被动画打扰。
- 开场后的首屏沿用中心 logo、十字架、圣经意象和使命汇聚布局，避免开场动画与正式页面产生体验断层。
- 首屏宗旨视觉只展示三枚 pill，不重复展示完整宗旨文字；完整宗旨可作为语义文本保留给辅助技术。
- 主要 CTA、次要 CTA 和页脚行动使用 pill 或圆润胶囊形态；普通内容卡片不跟随变成胶囊。
- Landing 不依赖持久顶部 AppBar；首屏通过 Hero CTA 和快捷入口承接主要动作，避免导航与 Hero 行动重复。
- Hero 下方 body 区域延续深绿光场、玻璃材质、圆润入口和柔和高光；不能突然回到普通白底官网卡片风格。
- 首屏文字和快捷入口分层进入。
- 宗旨三段、聚会信息、教会入口、App 引导滚动进入。
- 按钮和卡片只做轻微 hover / press 反馈。
- 手机端减少复杂动效。

必须支持：

- `prefers-reduced-motion`。
- 不因动画阻塞首屏阅读。
- 不用动效表达业务状态，业务状态必须来自 API。

## 6. Related Docs

- [../product_vision_zh.md](../product_vision_zh.md)
- [../architecture.md](../architecture.md)
- [mobile_app.md](mobile_app.md)
- [admin_web.md](admin_web.md)
- [backend_api.md](backend_api.md)
- [../features/church_life_publishing.md](../features/church_life_publishing.md)
- [../features/event_registration.md](../features/event_registration.md)
