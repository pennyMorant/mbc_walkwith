# Privacy

状态：隐私和敏感数据领域规则

## Purpose

定义 MBC WalkWith 的数据敏感度和处理边界。

## Data Classes

- Public：公开讲道、公开公告、公开活动、授权圣经文本。
- Personal：会员资料、阅读进度、书签、高亮、设备 token。
- Spiritual Sensitive：代祷、私密笔记、牧养相关内容、AI 学习问题。
- Financial：奉献交易、年度证明、支付 provider id、PDF。
- Admin Sensitive：后台角色、审计、系统设置、任务错误。

## Rules

- 代祷默认私密。
- 小组代祷可见性必须以后端会员资料里的小组/团契归属为准，不能相信 App 传入的 `groupId`。
- 代祷审计日志只记录必要元数据，不记录原始正文或原始审核备注。
- 财务数据与普通 App 使用数据隔离。
- 年度证明 PDF 不进入普通长期缓存。
- 后端决定敏感数据可见性。
- 管理 Web 权限不能只靠隐藏 UI。
- 日志和错误不得泄露 raw sensitive content。

## Used By

- prayer。
- giving flow。
- annual statement。
- member identity。
- notification delivery。
- admin web。
