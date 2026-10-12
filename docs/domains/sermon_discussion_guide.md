# Sermon Discussion Guide Domain

状态：公开讨论包第一版已接入；scoped 投递权限仍在规划

## Purpose

定义讲道讨论包、讨论问题、行动回应和个人回应的共享规则。讨论包帮助讲道进入小组讨论和生活操练，但不替代讲道本体。

## Source Of Truth

后端 sermon discussion guide repository 拥有讨论包结构、发布状态、适用对象和回应状态。讲道本体、音频、文稿、大纲和经文引用归 sermon repository。

## Core Concepts

- Discussion guide：绑定到一篇讲道的讨论材料。
- Question：观察、解释、应用、祷告或行动类问题。
- Action step：建议的生活操练。
- Assignment：讨论包记录公开范围，或引用一个真实存在的小组、课程、成长路径目标；引用本身不授予读取权限。
- Response：用户对讨论问题或行动步骤的个人回应。

## Rules

- 讨论包只引用 sermon，不复制 sermon source of truth。
- AI 生成材料必须人工审核后发布。
- 新讨论包只能从 draft 或 review 开始；首次发布必须由 review 进入。
- 已发布内容先退回 review 才能修改；归档内容只能先恢复到 draft。
- 发布要求至少一项问题、行动步骤或祷告方向，且关联讲道已经发布。
- 同一篇讲道可保留多个 public 草稿或审核稿，但最多只能有一个 public 已发布稿；scoped guide 不占用该槽位。
- Questions、action steps、prayer prompts 各最多 50 项；question/action id 在各自集合内唯一。
- Public audience 不携带目标 ID；group、course 和 discipleship audience 必须携带目标 ID。
- group、course 和 discipleship 目标在创建、变更或发布时必须真实存在；目标
  被删除后仍允许旧 guide 退回审核或归档，避免生命周期被悬空引用锁死。
- scoped guide 的 App 读取必须在后续链路中再次校验当前成员与目标的关系；目标存在性不能替代权限判断。当前 App 尚无 scoped 读取 route。
- 个人回应默认私密。
- 小组可见回应必须有明确小组成员权限。
- 后台普通列表和审核动作只能处理用户明确共享的回应；私密回应不能因 query 参数或 UUID 被读取、隐藏或归档。
- 讲道下架后，公开入口不展示对应讨论包。
- 发布、归档、隐藏回应必须审计。

## Used By

- sermon discussion guide。
- sermon publishing。
- sermon discovery。
- group ministry。
- course learning。
- discipleship journey。
- ai content assist。
