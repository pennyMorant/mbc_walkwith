# Sermon Discovery

状态：已完成当前闭环

## Feature Goal

让会友按月份、关键词、讲员、系列、主题和经文找到已发布讲道，并在讲道详情与本地圣经阅读之间自然跳转。

## Non-Goals

- 不处理讲道上传、转录、审核和发布；这些属于 `sermon_publishing`。
- 不让 App 搜索未发布讲道或 Admin 草稿。
- 不建立独立讲员、系列或主题目录作为第二份 source of truth。
- 当前不使用搜索索引、scheduler、worker 或重建任务。
- 不在 discovery feature 内拥有音频播放状态或播放进度规则。

## Owners

- Product owner：内容同工。
- Backend owner：`SermonService` 和 `SermonRepository` 的公开发现查询。
- App owner：Sermons surface、`SermonsRepository` 和本地 sermon cache。
- Admin Web owner：讲道列表筛选与讲道聚合元数据编辑。

## Source Of Truth

后端 canonical sermon repository 是讲道、讲员、系列、主题、文稿和经文引用的唯一可信来源。

- 公开列表和 facets 只从 `published` 讲道派生。
- 讲员和系列直接来自讲道聚合；主题来自属于该讲道聚合的 `sermon_topics`。
- App Drift 数据只是离线缓存，不决定讲道是否仍然公开。
- Admin 表单中的 topic options 只是编辑建议，不是持久化目录。
- 当前查询直接针对 canonical Postgres 数据执行，没有派生搜索索引。

## State Model

App 查询状态由以下部分组成：

- 当前月份范围。
- 可选关键词。
- 可选讲员、系列和主题精确筛选，每类最多一个。
- loading、data、empty、transport failure 或 contract failure。
- 本地缓存是否可用于网络失败后的只读降级。

Backend 不保存 discovery session state。每次请求根据 query contract 和当前 canonical data 计算结果。

## Contracts

公开 API：

- `GET /v1/sermons`：按日期倒序分页，支持 `query`、`speaker`、`series`、`topic`、`bookId`、`from` 和 `to`。
- `GET /v1/sermons/facets`：返回已发布讲道中的讲员、系列和主题去重列表。
- `GET /v1/sermons/recommendations`：根据 `bookId`、可选 chapter 和 verse 匹配经文相关讲道。
- `GET /v1/sermons/:sermonId`：返回仍然公开的讲道详情；草稿、下架或不存在统一表现为 not found。

查询和响应形状由 `packages/api_contracts/src/sermons.ts` 负责。App DTO、Admin API helper 和 Backend route 必须遵守同一 contract。

## Capability Contracts

当前 discovery 查询不调用外部 capability。经文引用的本地生成、讲道音频播放和 Admin 元数据审计分别由 `sermon_publishing`、播放 capability 和发布闭环拥有，不能被 discovery 查询吸收。

## App Surface Boundary

App 可以：

- 按月浏览讲道。
- 提交关键词和精确 facet 筛选 intent。
- 展示筛选数量、空态、失败态和分页结果。
- 从本地圣经上下文请求经文推荐，并从讲道引用返回本地 Bible reader。
- 在 transport/backend `ApiError` 时使用 Drift 缓存降级。

App 不可以：

- 自己判断未发布讲道是否可见。
- 把 malformed response 当作空列表或用旧缓存掩盖 contract drift。
- 用搜索或筛选结果覆盖无关月份缓存。
- 把本地 facets 或缓存升级为新的 canonical catalog。

成功的完整月份可以安全清理该月份已失效的缓存；分页、搜索和筛选结果不能执行月份级 reconciliation。详情返回 404 或 `sermon_not_found` 时，App 必须删除对应旧详情缓存。

## Admin Web Surface Boundary

Admin Web 可以：

- 按状态、关键词、讲员、系列和主题筛选讲道库。
- 只在管理员提交筛选 intent 时创建不可变查询快照；翻页 cursor 由查询
  lifecycle owner 管理，刷新或筛选切换不能混入旧页、重复页或未提交输入。
- 在讲道 create/update contract 中维护 series 和 topics。
- 使用 published facets 作为 topic 编辑建议。

Admin Web 不拥有独立搜索索引、索引状态、重建 intent 或持久化 topic catalog。讲道发布、下架和审核规则仍属于 `sermon_publishing`。

## Backend Service Boundary

Backend 负责：

- 强制公开列表、facets 和 recommendations 只返回已发布讲道。
- 对 speaker、series 和 topic 执行精确筛选。
- 对标题、讲员、系列、主题、主经文、摘要、文稿和结构化经文引用文字执行关键词搜索。
- 章节上下文只返回该章节的讲道，并按 exact verse、chapter 的优先级排序；只有未提供章节时才允许书卷级匹配，最后再按讲道日期排序。
- 校验 query、分页和 response schema。

Route 只解析 contract 和表达 HTTP response；查询语义属于 repository，公开 projection 和发布状态约束属于 service。

## Side Effects

公开发现查询本身没有写入副作用，不创建后台任务，也不写审计事件。Admin 对讲道元数据的修改和发布审计由 `sermon_publishing` 闭环负责。

## Lifecycle And Recovery

- 讲道发布、更新或下架后，后续 canonical query 立即反映当前数据库状态，不需要等待索引同步。
- App 网络失败时可读取本地缓存；恢复联网后由成功的安全查询更新缓存。
- Facets transport failure 时可从缓存讲道派生建议；malformed facet payload 必须显式失败。
- 已缓存讲道被下架后，权威详情 not found 会清除旧详情，避免继续暴露。

未来只有在真实数据量和查询延迟证明 canonical query 不足时，才可另行设计派生索引 contract。该方案必须声明同步 lifecycle、失败恢复、可见性和 source-of-truth 边界，不能作为当前 feature 的隐藏假设。

## Error Model

- `sermon_not_found`：详情不存在或不再公开。
- validation error：query 不符合共享 schema。
- transport/backend error：App 可按 repository 规则尝试缓存降级。
- contract/format error：响应 envelope 或 DTO malformed；必须保持可见，不能回退成空数据。

当前没有 `sermon_index_stale`、`sermon_search_unavailable` 或 `sermon_visibility_denied` 错误。

## Main Logic Chains

列表与筛选：

```text
App month/search/filter intent
-> SermonListRequest
-> SermonsRepository
-> GET /v1/sermons
-> SermonService published projection
-> SermonRepository canonical query
-> published results
-> typed DTO/domain
-> App list and safe cache update
```

经文推荐：

```text
local Bible verse context
-> GET /v1/sermons/recommendations
-> published exact-verse/chapter Scripture-reference ranking
-> related sermon cards
-> sermon detail
-> reference back to local Bible reader
```

Admin 元数据：

```text
Admin edits series/topics
-> typed sermon update contract
-> backend sermon aggregate mutation
-> canonical tables
-> subsequent published facets/search reflect current data
```

## Failure Chains

- 公开列表 transport failure -> repository 查询匹配的 Drift 缓存 -> 显示离线结果或失败态。
- Malformed public response -> DTO/contract failure -> 显示失败态，不用缓存掩盖。
- 讲道下架后打开旧缓存详情 -> backend not found -> 删除该讲道本地详情 -> 返回空结果。
- Facets 请求失败 -> 下次打开筛选器可重试；若存在缓存讲道，可仅派生编辑/筛选建议。
- 搜索、筛选或分页成功 -> 只 upsert 返回项目 -> 不删除其他月份或未返回项目。

## Verification Checklist

- Backend repository 测试覆盖关键词字段、topic 精确筛选、published-only facets 和经文推荐排序。
- Public route 测试覆盖 facets/recommendations envelope，并确认不泄露 Admin-only 字段。
- Postgres integration 测试覆盖 topics、文稿、经文引用查询和推荐。
- App remote 测试覆盖 query 参数、严格 envelope 和 facet DTO。
- App repository 测试覆盖 transport fallback、malformed contract、缓存 topics 和月份 reconciliation 边界。
- App widget 测试覆盖筛选选择、清除、应用、空态和小屏布局。
- Admin typecheck 覆盖 typed facets、topic 编辑和筛选调用。

## Related Docs

- [sermon_publishing.md](sermon_publishing.md)
- [../domains/bible_content.md](../domains/bible_content.md)
- [../domains/content_visibility.md](../domains/content_visibility.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)
- [../surfaces/admin_web.md](../surfaces/admin_web.md)
- [../surfaces/backend_api.md](../surfaces/backend_api.md)
- [../sdk/sermons.md](../sdk/sermons.md)
