# Object Storage

状态：对象存储能力边界

## Purpose

封装音频、图片、PDF、附件等文件存储和签名访问。

## Owner

Backend storage gateway adapter。

生产环境的唯一文件存储实现是 Cloudflare R2。Postgres 只保存媒体元数据、业务关联与
R2 object key；开发和自动化测试可以使用本地 driver，但生产启动时不得回退到本地磁盘。

## Contract

输入：

- object key。
- content type。
- byte length。
- access scope。
- expiration。

输出：

- upload URL。
- download URL。
- object metadata。
- checksum。
- 删除结果或结构化删除错误。

## Rules

- 私有文件必须放入不绑定公开域名的独立 `S3_PRIVATE_BUCKET`，并通过后端签名 URL 访问。
- 公开图片通过 `MEDIA_PUBLIC_BASE_URL` 指向的 R2 自定义媒体域名访问；URL 不经过 VPS
  转发，避免把图片流量压到应用服务器。
- 统一媒体可能撤销授权，因此公开 R2 对象与本地公开媒体响应都使用 `no-store`，不得使用长期 `immutable`
  缓存；限制授权后删除公开对象，后续请求不能继续命中持久缓存。
- 生产必须配置 `MEDIA_STORAGE_DRIVER=s3`、R2 S3 endpoint、公开与私有 bucket、access key、secret
  与 `MEDIA_PUBLIC_BASE_URL`，缺少任一项时后端拒绝启动。
- 统一媒体元数据由 `media_assets` 管理；API 不暴露 `storageKey`。
- 公开资源 key 使用 `public/<kind>s/<uuid>.<ext>` 并写入公开 bucket；私有资源使用
  `private/<kind>s/<uuid>.<ext>` 并写入独立私有 bucket。两个 bucket 不得相同。
- 只有 `visibility=public` 且 `consentStatus=approved` 的统一媒体可以进入公开 bucket；
  `pending`、`restricted` 和 private 媒体始终留在私有 bucket。
- Object storage 只存文件本体，业务状态在后端数据库。
- App 和管理 Web 不直接访问私有 bucket。
- 文件缺失必须返回结构化错误。
- 删除或替换敏感文件要审计。
- 业务 feature 必须在 canonical 数据 mutation 中登记可恢复清理记录，不能把“数据库已更新、对象删除失败”返回成虚假的整体失败。
- 新上传对象在绑定到业务聚合前应先登记清理候选；绑定成功时由同一数据库事务撤销候选，绑定失败时保留候选供恢复。
- bucket 迁移必须先登记目标候选并复制，再以单一数据库事务切换 canonical key、撤销目标候选并登记旧源对象清理；不得先删除数据库仍引用的源对象。
- 活跃绑定窗口内的 `pending` 候选禁止人工删除，只有失败任务或超过恢复窗口的陈旧任务可重试。
- 对象删除应具备幂等语义：目标已经不存在视为成功；provider 或路径校验失败返回结构化错误。
- 清理记录可以保留内部 `storagePath`，但 API、SDK、Admin Web、App 和审计投影不得暴露它。
- 媒体使用位置由引用方 Feature 的 provider 从 canonical repository 实时解析；Object Storage
  和 Media surface 只消费安全 usage 投影，不维护第二份业务引用真相。
- 清理恢复可以采用请求内 best-effort 尝试和受权限保护的人工重试；这不等于引入媒体处理 worker。
- 本地存储 driver 必须把 `MEDIA_UPLOAD_DIR` 解析为明确 root；相对路径基于后端
  工作目录，绝对路径保持绝对路径。
- 本地 `storagePath` 必须使用 `local:` 前缀，并且回读/删除只能访问对应 feature
  的 media 子目录。
- S3 `storagePath` 中的 bucket 必须等于当前配置 bucket，不能根据数据库里的任意
  bucket 字段访问其它桶。

## Errors

- `object_not_found`
- `object_upload_failed`
- `object_download_expired`
- `object_checksum_mismatch`
- `object_permission_denied`
- `object_delete_failed`

Feature-specific upload adapters may map object storage validation into
feature-owned errors such as `life_image_*`, but those errors belong in the
feature contract that owns the upload flow.

## Used By

- sermon publishing。
- annual statement。
- life content。
- event attachments。
