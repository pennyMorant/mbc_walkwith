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

## Projection

`MediaAsset` 包含：

- 稳定 UUID、kind、visibility、consent status。
- 安全 URL、MIME、大小、可选尺寸。
- focal point、替代文字、说明、版权来源。
- 创建和更新时间。

`storageKey` 只存在于后端 repository，不能出现在 API、SDK、Admin Web 状态或审计投影中。
