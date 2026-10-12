# Member Identity

状态：会员身份领域规则

## Purpose

定义访客、会友、同工、管理员、财务角色在 App、管理 Web 和后端中的共同含义。

## Source Of Truth

后端拥有：

- 用户账号。
- 会员资料。
- 角色。
- 会话。
- Google/Apple 外部身份与本地会员的绑定关系。
- 小组或团契归属。
- 设备通知 token 绑定。

App 和管理 Web 可以缓存当前 session view，但不能成为身份 source of truth。

## Core Roles

- `guest`
- `member`
- `group_leader`
- `content_editor`
- `pastor`
- `finance`
- `admin`
- `owner`

角色可以组合，但 finance 不自动拥有内容发布权限，content_editor 不自动拥有奉献查看权限。

## Rules

- 公开内容可给 guest。
- 会友专属内容需要 member。
- 小组内容需要 member 和 group membership。
- 财务数据需要 finance 或更高财务授权。
- 管理 Web 需要 admin-side role。
- 后端 service 是权限最终判断 owner。
- Firebase 只证明外部身份；后端会员 ID、状态、角色和 MBCG session 决定 App 权限。
- 只有 provider 已验证邮箱可以自动关联现有会员；身份冲突不得按客户端传入邮箱强行合并。

## Used By

- event registration。
- event attendance。
- group ministry。
- course learning。
- serving schedule。
- prayer。
- giving flow。
- annual statement。
- content visibility。
- notification preferences。
- member profile。
- pastoral care。
