# Sermon Publishing

状态：管理员草稿、音频/文案、本地 package 审核、发布、App 播放和音频对象清理恢复已接入；远程对象存储 smoke 待验收

## Feature Goal

让教会管理员上传教会自录讲道音频和已预备好的文案，经过处理、审核、发布后，让会友在 App 中听讲道、读文案、查看经文引用。

## Non-Goals

- 不是单纯文件上传能力。
- 不是 App 播放器文档。
- 不是外部视频平台导入文档。
- 不允许 App 用户上传讲道。

## Owners

- Feature owner：backend sermon service。
- Processing owner：local sermon workstation / `apps/sermon_studio`。
- App surface：Sermons list/detail/player。
- Admin surface：sermon editor and processing pages。
- Source of truth owner：backend sermon repository。

## Source Of Truth

后端拥有：

- 讲道草稿。
- 音频文件 metadata。
- 文案、摘要、大纲、经文引用。
- 本地处理 metadata。
- 审核状态。
- 发布状态。

Object storage 存文件本体。Postgres 存元数据和状态。

## State Model

讲道状态：

- `draft`
- `processing`
- `needs_review`
- `published`
- `archived`
- `failed`

本地处理状态由本地工作站记录在 `processingMetadata`。后端只接收已审核
package，不在 VPS 上运行转录、提纲或经文抽取任务。

## Capability Contracts

使用：

- object storage：音频、图片、附件。
- audio playback：App 讲道播放、后台播放、锁屏/控制中心和系统媒体控制。
- media processing：本地转录、大纲、经文引用。
- notification delivery：新讲道通知。
- audit log：上传、替换、发布、下架、删除。

## App Surface Boundary

App 可以：

- 读取已发布讲道。
- 只读取公开投影；`reviewMarkdown` 和 `processingMetadata` 属于管理员审核信息，不进入公开响应。
- 按选中月份浏览已发布讲道，并在该月份范围内搜索。
- 播放后端授权的音频。
- 通过 Android / iOS 原生媒体体系播放讲道，支持后台播放、系统媒体控制和完成态进度上报。
- 展示文案、大纲、经文引用。
- 保存本地播放进度，并按 `updatedAt` 与后端 member/external owner 进度合并。
- 从经文引用跳回读经。

App 不可以：

- 修改讲道。
- 决定讲道是否发布。
- 直接访问私有对象存储。
- 使用转录或 AI provider 密钥。

## Admin Web Surface Boundary

管理 Web 可以：

- 创建讲道草稿。
- 上传音频和文案。
- 编辑元数据。
- 上传本地处理后的审核包。
- 查看历史任务诊断和本地处理链路就绪状态。
- 审核并发布。
- 下架或归档。
- 在讲道工作区按状态查看音频对象清理任务，并对 `pending` 或 `failed` 任务发起重试。
- 只查看安全清理投影；对象存储路径始终留在后端。

管理 Web 不拥有发布规则，所有状态迁移通过后端。

管理 Web 的创建、编辑、状态和音频 mutation 必须提交点击时的不可变 intent。
迟到结果始终刷新 canonical 列表，但只能更新仍选中的同一讲道；状态或媒体命令
只更新讲道聚合投影，不能重置请求期间新增的文稿、讲义或引用编辑。

创建完成后，Admin 讲道投影返回持久化的非负整数 `revision`。除创建外的每个
讲道聚合 mutation 都必须提交响应中最新的 `x-sermon-revision`，后端在同一事务
锁内比较并在成功写入后递增。缺少或格式错误的 header 是 contract failure；过期
revision 返回 `sermon_state_changed`。客户端不得自动重试并覆盖 canonical 内容。
公开 App 投影不包含这个后台并发令牌。

已发布讲道的任何内容修改、退稿、归档、删除、音频上传或音频删除都需要
`sermons:publish`。只有 `sermons:update` 的内容编辑者可以处理草稿，但不能绕过
发布权限修改已经公开的聚合。

## Backend Service Boundary

Sermon service 负责：

- 草稿创建。
- 文件 metadata 绑定。
- 发布状态迁移。
- 审核要求。
- App 可见性。
- 审计。

手工草稿创建是一个完整 backend command。标题、讲员、日期、主题、初始文稿和
审核说明由同一个创建 contract 提交，并在 repository 的同一事务中持久化；Admin
Web 不得先创建空草稿再用第二次 PATCH 补写初始内容。

Sermon audio cleanup service 负责：

- 在新对象绑定前持久化 `unbound_upload` 清理候选。
- 在讲道聚合事务成功绑定新对象时原子撤销该候选。
- 在替换、移除或删除讲道时，与 canonical 数据 mutation 原子登记旧对象清理任务。
- 立即做 best-effort 删除，并持久化 `pending / failed / succeeded`、尝试次数和安全错误摘要。
- 让有权限的管理员查看和幂等重试清理任务。
- 不把对象存储路径暴露给 Admin Web 或 App。

Sermon progress service 负责：

- 解析 member 或安装级 external owner；有效 member 身份优先。
- 只为 published 讲道读写进度。
- 按 `(sermon_id, user_type, user_id)` 幂等 upsert。
- 根据 canonical duration 限制位置，并在最后 15 秒推导完成态。
- 返回 `updatedAt`，让 App 在本地即时进度和服务器同步状态之间选择更新版本。

发布契约：

- 后端是发布规则 owner。
- 专用 publish API 必须调用 sermon service 的发布方法。
- PATCH 如果把状态改为 `published`，也必须按最终候选内容走同一套发布校验。
- 可发布内容至少需要元数据、音频、讲章/转写稿、大纲、经文引用。
- 空草稿、缺音频、缺讲稿、缺大纲或缺经文引用时返回 `review_required`。
- 讲道聚合更新在一个数据库事务内锁定父记录，并原子写入元数据、讲义、经文引用和文稿。
- service 在聚合 mutation 前校验客户端提交的 canonical revision；repository 在父记录事务锁内再次比较。元数据、状态或音频 mutation 成功后 revision 递增，并发修改返回 `sermon_state_changed`，不自动合并或重试。
- 已发布讲道必须持续满足 ready audio 不变量；删除音频前必须先退回草稿，否则返回 `sermon_published_asset_locked`。
- 管理 Web 可以显示 checklist，但不能成为发布规则的 source of truth。

本地工作站负责：

- 音频标准化。
- 转录。
- 大纲草拟。
- 经文引用提取。
- 人工复核后生成 package。

后端不运行讲道媒体处理任务；后端只负责存储 package、发布校验、审计和分发。

## Side Effects

- 音频上传。
- 对象存储签名 URL。
- 本地 sermon package 导入。
- 本地转录或 AI 调用产生的 metadata。
- 通知发送。
- 审计日志。

## Lifecycle And Recovery

上传成功不代表发布成功。本地 package 导入成功也不代表发布成功。管理员审核后发布状态才决定 App 可见性。

恢复路径：

- 上传失败可重试。
- 新对象绑定失败时，已预登记的 `unbound_upload` 任务负责删除孤立对象。
- 替换、移除或删除音频的 canonical 数据 mutation 成功后，对象删除失败不能把 API 伪装成数据 mutation 失败。
- 对象删除或清理状态写回失败时，任务保留 `pending` 或 `failed`；管理员可以从专用 API 幂等重试，重试动作写审计。
- 清理由请求后的轻量 best-effort 动作和管理员恢复入口完成，不创建 VPS 媒体 worker。
- 本地处理失败留在本地工作站修复，不写入 VPS 后端生命周期。
- 生成内容默认不发布。
- 发布失败保留草稿和审计。

## Error Model

稳定错误：

- `sermon_not_found`
- `upload_failed`
- `media_missing`
- `review_required`
- `publish_permission_denied`
- `sermon_state_changed`
- `sermon_published_asset_locked`
- `sermon_progress_identity_required`
- `sermon_audio_cleanup_not_found`
- `private_asset_url_expired`

专用发布接口和 PATCH 发布路径都必须在讲道 feature 边界返回
`publish_permission_denied`，不能只暴露通用后台权限错误。

底层 capability 错误必须在 feature 边界被解释：

- object storage 的 `object_not_found` 对 App / Admin surface 表达为 `media_missing`。
- object storage 的 `object_upload_failed` 对讲道上传链路表达为 `upload_failed`。
- 本地 media processing 的 provider 错误只属于本地工作站诊断；后端 API
  不暴露 sermon processing provider、timeout 或 retry contract。

历史 job 诊断可以继续展示 `jobId`、`jobType`、`resourceId`、`attempt`、
`maxAttempts` 等 evidence，但 Admin Web 不能再发起服务器端转录或重跑任务。

## Main Logic Chain

```text
admin creates sermon draft
-> backend atomically stores initial metadata/text
-> admin uploads audio or later text revisions through backend
-> backend stores audio object metadata and draft state
-> local workstation prepares transcript/outline/scripture references
-> admin uploads reviewed local package
-> backend publishes sermon
-> App reads published sermon
-> App player requests authorized media URL
-> device audio playback capability exposes native media controls
-> player saves local progress immediately
-> backend upserts member/external progress
-> a later session restores the newer local or server position
```

## Failure Chains

必须验证：

- 上传中断。
- 文件 metadata 存在但对象缺失。
- 本地 package 缺少 transcript / outline / references。
- 本地 package metadata 错误。
- 未审核内容发布被拒。
- App 访问未发布讲道。
- 公开列表和详情泄漏管理员审核备注或本地处理 metadata。
- 发布校验后、数据库写入前发生并发内容或媒体修改。
- 已发布讲道直接删除必需音频。
- 无 member/external identity 写入播放进度。
- 不同 external installation 或 member 之间读取到彼此进度。
- 服务器旧进度覆盖更新的离线本地位置。
- App 详情接口收到 `sermon_not_found` 后不能回退展示旧缓存。
- 签名 URL 过期后刷新。
- 新音频对象已保存但 revision 冲突，候选清理任务仍可恢复。
- 替换、移除或删除后的对象存储删除失败，不反转已经提交的讲道状态。
- 清理任务状态写回失败时，canonical mutation 仍成功，任务保持可重试。
- 无 `sermons:update` 权限的管理员不能重试清理任务。
- 清理列表、响应和审计投影不泄漏 `storagePath`。

## Verification Checklist

- App 只读 published 内容。
- App 公开 DTO 不包含 `revision`、`reviewMarkdown` 或 `processingMetadata`。
- 元数据、讲义、经文引用与文稿聚合更新具备事务性和 revision 冲突保护。
- 已发布讲道的 mutation 同时守住 publish permission 与必需媒体不变量。
- App 播放器接入 Android / iOS 原生媒体控制，并在系统暂停或播放完成时保存/上报进度。
- App 切换讲道 source 时，旧位置必须继续归属于旧讲道；本地保存完成后即可
  切源，远端进度上报不能阻塞新讲道加载。
- 播放进度具备真实持久化、owner 隔离、幂等 upsert、完成态归一化和离线合并测试。
- 管理 Web 不直接访问对象存储私有桶。
- 生成内容默认不发布。
- 发布、下架、删除有审计。
- 本地处理失败不会阻塞后端 API；修复 package 后可重新上传。
- 音频清理候选与绑定、旧对象清理任务与聚合 mutation 具备事务性测试。
- 替换、移除、讲道删除、未绑定上传、对象删除失败、状态写回失败和幂等重试均有 owning-layer 测试。

## Related Docs

- [../domains/media_asset.md](../domains/media_asset.md)
- [../domains/content_visibility.md](../domains/content_visibility.md)
- [../capabilities/object_storage.md](../capabilities/object_storage.md)
- [../capabilities/audio_playback.md](../capabilities/audio_playback.md)
- [../capabilities/media_processing.md](../capabilities/media_processing.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)
- [../surfaces/admin_web.md](../surfaces/admin_web.md)
