# Object Storage

状态：对象存储能力边界

## Purpose

封装音频、图片、PDF、附件等文件存储和签名访问。

## Owner

Backend storage gateway adapter。

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

- 私有文件通过后端签名 URL 访问。
- Object storage 只存文件本体，业务状态在后端数据库。
- App 和管理 Web 不直接访问私有 bucket。
- 文件缺失必须返回结构化错误。
- 删除或替换敏感文件要审计。
- 业务 feature 必须在 canonical 数据 mutation 中登记可恢复清理记录，不能把“数据库已更新、对象删除失败”返回成虚假的整体失败。
- 新上传对象在绑定到业务聚合前应先登记清理候选；绑定成功时由同一数据库事务撤销候选，绑定失败时保留候选供恢复。
- 对象删除应具备幂等语义：目标已经不存在视为成功；provider 或路径校验失败返回结构化错误。
- 清理记录可以保留内部 `storagePath`，但 API、SDK、Admin Web、App 和审计投影不得暴露它。
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
