# Media SDK Contract

状态：已实现统一图片上传与媒体元数据读取

## Ownership

媒体 API 管理文件元数据、上传验证和 object storage 访问。Feature 只保存媒体 ID，或消费
后端返回的安全媒体投影；不得保存 R2 object key、bucket 名称或 provider credential。

## Admin Routes

```text
GET   /v1/admin/media
GET   /v1/admin/media/:mediaId/usages
POST  /v1/admin/media/images
PATCH /v1/admin/media/:mediaId
GET   /v1/admin/media/cleanup-tasks
POST  /v1/admin/media/cleanup-tasks/:cleanupTaskId/retry
```

图片上传使用原始 binary body：

```text
Content-Type: image/jpeg | image/png | image/webp | image/gif | image/avif
X-File-Name: encodeURIComponent(originalFileName)
```

元数据通过 query 传入：`visibility`、`consentStatus`、`altText`、`caption`、
`copyrightSource`。上传接口校验 MIME 和文件签名，当前限制为 12 MB。

## Public Route

```text
GET /v1/media/:mediaId/content
```

本地开发 driver 通过该路由读取公开资源。生产返回的媒体 URL 指向
`MEDIA_PUBLIC_BASE_URL`，浏览器直接从 Cloudflare R2 自定义媒体域名获取文件。
私有、待授权和受限媒体写入独立的私有 bucket，公开域名不得绑定该 bucket。
只有 `visibility=public` 且 `consentStatus=approved` 的媒体具有公开 URL。

## Projection

`MediaAsset` 包含：

- 稳定 UUID、kind、visibility、consent status。
- 安全 URL、MIME、大小、可选尺寸。
- focal point、替代文字、说明、版权来源。
- 创建和更新时间。

`storageKey` 只存在于后端 repository，不能出现在 API、SDK、Admin Web 状态或审计投影中。

上传对象落盘后，后端会先持久化 `unbound_upload` 清理候选。生产 Postgres 在同一事务中
创建媒体元数据并撤销候选；绑定失败时立即尝试删除，删除失败则保留不含内部 object key
的任务投影。仍处于正常绑定窗口内的 `pending` 任务不可人工重试，超过恢复窗口后才由
后端标记 `retryable=true`。

公开/私有状态切换使用双候选流程：先登记目标副本候选并复制对象，再在同一数据库事务中
切换 canonical `storageKey`、撤销目标候选并登记旧源对象清理。事务前失败时删除目标副本；
事务后删除旧源对象失败时保留 `relocated_source` 任务。后台 `/media` 页面按
`media:read` 展示图片库与恢复证据，`media:manage` 上传图片、维护替代文字/说明/版权来源/
焦点、撤销或恢复发布授权并执行清理重试。授权变化仍由后端完成对象迁移，Admin Web
不直接访问 bucket 或 object key。该恢复链路不引入常驻媒体 worker。

媒体物理删除暂不开放。生活内容使用数据库外键引用媒体，而官网结构化设置当前保留媒体
ID；在所有引用方接入统一查询目录并具备原子删除保护前，管理端只能撤销发布授权，不能
通过前端判断执行硬删除。

媒体使用位置不保存在第二张引用表。`GET /v1/admin/media/:mediaId/usages` 通过
Feature-owned provider 实时读取 canonical Life repository 与 Public Landing Settings，返回
安全的 source、sourceId、sourceLabel 和 slot。Media service 只聚合 provider，不直接读取
其他 Feature 的表或 JSON。

## Reference Validation

Feature 通过 `MediaReferenceValidator.assertPublicImageReference(mediaId)` 写入新的图片引用，
不自行查询 bucket、URL 或媒体表。校验只接受存在、`kind=image`、`visibility=public`、
`consentStatus=approved` 且具有公开 URL 的资源；失败返回 `media_reference_invalid`（409）。

该契约保护新写入，不阻止隐私撤销。管理员把已被引用的图片改为 pending/restricted 时，
后台必须提示受影响位置，但后端仍执行撤销；业务记录保留媒体 ID，公开投影立即隐藏 URL。
恢复授权后现有引用可重新解析，无需复制或重写业务内容。
