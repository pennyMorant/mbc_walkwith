# Media SDK Contract

状态：已实现统一图片上传与媒体元数据读取

## Ownership

媒体 API 管理文件元数据、上传验证和 object storage 访问。Feature 只保存媒体 ID，或消费
后端返回的安全媒体投影；不得保存 R2 object key、bucket 名称或 provider credential。

## Admin Routes

```text
GET   /v1/admin/media
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
的任务投影，供具备 `media:manage` 权限的管理员重试。该恢复链路在请求内执行，不引入
常驻媒体 worker。
