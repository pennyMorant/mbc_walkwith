# Bible Content

状态：圣经文本和版本领域规则

## Purpose

定义圣经文本、版本、版权状态、章节经文结构和本地读经边界。

## Source Of Truth

可公开或已授权的圣经文本可以作为 App 本地数据包。版本目录、版权状态、来源说明和未来文本包发布由后端或构建资产流程维护。

## Rules

- 只使用无版权、公开版权或教会已获授权文本。
- TTS 朗读的是文字圣经，不是音频圣经。
- App 可以本地缓存和朗读公开或授权文本。
- 经文引用必须保留 book、chapter、verse 结构。
- 学习辅助或 AI 解释不能把无来源内容当成教会教义。
- 后台人物、地点和读经辅助资料按 `id + locale + translationId` 形成 canonical
  复合身份；它们是本地经文之外的学习投影，不能覆盖或复制圣经正文。
- 管理端筛选草稿只有在明确应用后才能成为目录查询快照。保存和删除必须冻结操作
  发起时的复合身份，异步结果只有仍命中原编辑上下文时才能更新当前编辑器。

## State

- translation id。
- language。
- copyright status。
- source。
- book/chapter/verse。
- local package version。
- knowledge entity id、locale、translation id、status。

## Used By

- bible_tts。
- study reader。
- sermon scripture references。
- ai bible study。
