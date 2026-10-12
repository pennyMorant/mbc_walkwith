# Content Visibility

状态：内容可见性领域规则

## Purpose

定义讲道、生活内容、活动、代祷、通知等内容在不同用户范围内的可见性。

## Source Of Truth

后端内容记录拥有 visibility 和 publication state。App 和管理 Web 只展示后端返回的可见视图。

## Visibility Levels

- `public`：访客可见。
- `member`：登录会友可见。
- `group`：指定小组或团契可见。
- `private`：作者、牧者或授权管理员可见。
- `admin_only`：仅后台管理。

## Publication States

- `draft`
- `processing`
- `needs_review`
- `published`
- `archived`
- `failed`

## Rules

- 可见性和发布状态都必须满足，内容才可展示。
- 代祷默认 private。
- 小组代祷只能按后端会员小组归属返回，客户端 query 不能成为授权依据。
- 生成内容默认 `needs_review`，由后端 feature service 决定是否可发布。
- 下架或取消发布不要引入第二套状态源，按 feature contract 退回 `draft`、`archived` 或对应私有可见性。
- App 不自行扩大可见性。
- 管理 Web 可以提交可见性修改 intent，最终由后端 service 校验。

## Used By

- sermon publishing。
- event registration。
- prayer。
- life content。
- notifications。
