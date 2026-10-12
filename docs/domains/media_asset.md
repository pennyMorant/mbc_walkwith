# Media Asset

状态：媒体文件领域规则

## Purpose

定义音频、图片、PDF、附件等文件的元数据、归属、可见性和存储边界。

## Source Of Truth

对象存储保存文件本体。后端数据库保存 metadata、owner、object key、visibility、status、checksum、created_by 和 audit reference。

## Asset Types

- sermon audio。
- sermon image。
- life post image。
- annual statement PDF。
- event attachment。
- future bulletin file。

## Rules

- 私有文件必须通过后端签名 URL 访问。
- App 和管理 Web 不直接访问私有 bucket。
- 替换、删除、下载敏感文件需要审计。
- metadata 存在但对象缺失必须进入 recoverable error。
- 文件可见性必须跟内容 publication state 一起判断。
- 发布内容依赖的必需资产不能被单独移除。已发布讲道删除 ready audio 前必须先回到草稿状态。
- 媒体绑定、内容状态和聚合 revision 必须一起校验，避免并发上传或删除破坏发布不变量。

## Used By

- sermon publishing。
- annual statement。
- life content。
- event registration。
