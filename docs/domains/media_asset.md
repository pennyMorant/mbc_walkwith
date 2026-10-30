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
- Feature 写入媒体 ID 前必须调用 Media 的窄引用校验契约；只有存在、公开、已批准且有可用 URL 的图片可以成为新的公开内容引用。
- 撤销授权属于隐私优先操作：即使媒体已被内容引用也允许撤销，引用记录继续保留，但所有公开投影必须立即停止返回该资源 URL。
- 发布内容依赖的必需资产不能被单独移除。已发布讲道删除 ready audio 前必须先回到草稿状态。
- 媒体绑定、内容状态和聚合 revision 必须一起校验，避免并发上传或删除破坏发布不变量。
- Admin Web 的筛选草稿与已应用查询必须分离；只有明确应用、清除或刷新意图才改变查询。
- 图片列表、使用位置和清理任务刷新失败时保留最近一次成功投影，并把刷新错误与首次加载错误、命令错误分开呈现。
- 编辑命令必须冻结 asset ID 和提交 payload。异步结果只能更新仍指向同一 asset 的打开上下文，不能关闭或污染后来打开的编辑弹窗。
- Admin Web 只消费安全媒体和 usage 投影。usage 关系、发布授权、对象 key 与清理状态继续由后端 canonical repository 决定。

## Used By

- sermon publishing。
- annual statement。
- life content。
- event registration。
