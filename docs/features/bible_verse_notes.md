# Bible Verse Notes

状态：第一版已接入，App 经文工具、公开心得 API 和 Admin 审核基础闭环已接入

## 1. Feature Goal

让 App 用户在阅读本地圣经经文时，可以围绕某一节经文发布教会可见的心得，并查看同一节经文下其他用户公开的心得。未登录用户也可以通过安装级 `external_user_id` 发布心得；登录用户则以会员身份发布。

## 2. Non-Goals

- 不替代本地私密读经笔记、高亮、收藏。
- 不把本地圣经文本上传到后端。
- 不做社交评论区、回复楼层、点赞或关注。
- 不把 `external_user_id` 当作会员身份。
- 不用于奉献、年度证明、会员资料或财务链路。

## 3. Owners

- Feature owner：Bible Agent / Study feature。
- App surface owner：Study reader verse tools sheet。
- Backend owner：Bible verse notes service。
- Admin Web owner：Content moderation surface。
- Identity owner：Core external user identity contract。

## 4. Source Of Truth

- 圣经文本：App 本地 Bible content package 和 Drift SQLite。
- 私密笔记、高亮、收藏：App 本地 Study tables。
- 公开心得：Backend Postgres `bible_verse_notes`。
- 匿名安装身份：App 本地 `external_user_id`，后端只记录使用它提交的公开内容。

## 5. State Model

公开心得状态：

- `published`：App 可见。
- `hidden`：管理员隐藏，App 不显示。
- `deleted`：作者删除，App 和普通管理员列表默认不显示。

作者类型：

- `member`：登录会员。
- `external`：未登录安装级外部用户。

## 6. Capability Contracts

使用：

- Core external identity：生成并提供 `external_user_id`。
- Member auth：登录会员发布和编辑自己的心得。
- Admin auth：后台隐藏和恢复心得。
- Audit log：管理员隐藏/恢复记录。

## 7. App Surface Boundary

App 可以：

- 默认保持经文列表安静，不为每节经文常驻操作按钮或展开行内快捷操作。
- 用户点击一节经文后直接打开经文工具底部弹窗。
- 在底部弹窗中切换本地书签和高亮，并进入“我的笔记”或“教会心得”Tab；可用时从弹窗打开原文词汇。
- 教会心得将当前用户的发布编辑区与公开心得列表分开；公开心得按后端最新优先顺序显示作者、日期和“我的”标记，并使用可滚动懒加载列表承载多条内容。
- 在经文工具弹窗中显示“我的笔记”和“教会心得”。
- 继续用本地 repository 保存私密笔记、高亮、收藏。
- 用 `verseId` 读取同节经文公开心得。
- 用会员 token 或 `X-External-User-Id` 发布、编辑、删除自己的公开心得。
- 显示加载、失败、空状态。

App 不可以：

- 把公开心得直接写本地当 source of truth。
- 用 `external_user_id` 访问财务或会员资料能力。
- 在 UI 中实现管理员审核规则。

## 8. Admin Web Surface Boundary

Admin Web 可以：

- 查看公开心得列表。
- 按经文、状态、作者类型和关键字筛选。
- 隐藏不合适心得。
- 恢复被隐藏心得。

Admin Web 不可以：

- 修改圣经文本。
- 伪造用户作者身份。
- 把 hidden 心得继续暴露给 App。

## 9. Backend Service Boundary

后端负责：

- 校验 `verseId`、`bookId`、`chapter`、`verse` 和内容长度。
- 判断作者类型：优先会员 token，否则 `external_user_id`。
- 限制作者只能编辑/删除自己的心得。
- 作者只能编辑 `published` 心得，不能通过编辑恢复管理员隐藏的心得。
- 只向公开 App API 返回 `published` 心得。
- 为管理员隐藏/恢复写审计记录。

## 10. Side Effects

- Postgres 写入公开心得。
- 管理员审核动作写入 audit log。

不产生：

- 圣经文本变更。
- 本地私密笔记迁移。
- 通知推送。
- 会员资料变更。

## 11. Lifecycle And Recovery

- 未登录且无 `external_user_id`：App 重新生成后重试。
- 发布失败：保留输入内容，允许重试。
- 列表失败：显示重试。
- 管理员隐藏：App 下次刷新不再显示。
- 用户删除：状态变为 `deleted`，不物理删除，便于审计。

## 12. Error Model

- `bible_verse_note_author_required`
- `bible_verse_note_not_found`
- `bible_verse_note_permission_denied`
- `bible_verse_note_content_invalid`
- `bible_verse_note_verse_invalid`

## 13. Main Logic Chain

```text
App opens local Bible chapter
-> user taps one verse and directly opens the verse tools bottom sheet
-> user chooses personal note or church note for that local verseId
-> My Notes tab reads/writes local SQLite
-> Church Notes tab calls GET /v1/bible/verse-notes?verseId=...
-> backend returns published notes for that verse
-> user submits note with member token or X-External-User-Id
-> backend records member/external author and published status
-> App refreshes the same verse notes list
-> admin can hide/restore from Admin Web
```

## 14. Failure Chains

必须验证：

- 无 `external_user_id` 且未登录提交。
- 其他 external/member 作者编辑同一条心得。
- hidden/deleted 心得不出现在 App 公开列表。
- 键盘弹出后经文工具弹窗不遮挡输入框和提交按钮。
- 本地私密笔记、高亮、收藏不受公开心得失败影响。

## 15. Verification Checklist

- 本地圣经文本仍只来自本地数据。
- `verseId` 是本地经文和云端心得唯一连接点。
- `external_user_id` 是 core identity，不属于推送模块。
- 公开心得 backend-owned，不吞并本地 StudyNotes。
- 管理员隐藏/恢复有审计。
- App/Admin visible text 已本地化或在当前 surface 现有语言系统中可维护。

## 16. Related Docs

- [../domains/bible_content.md](../domains/bible_content.md)
- [bible_tts.md](bible_tts.md)
- [ai_bible_study.md](ai_bible_study.md)
- [../core/feature_integration.md](../core/feature_integration.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)
