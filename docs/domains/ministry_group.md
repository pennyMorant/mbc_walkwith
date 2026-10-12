# Ministry Group

状态：二阶段第一版已接入

## Purpose

定义小组/团契、申请、成员、带领人和可见性的共享业务语言。

## Source Of Truth

后端拥有 group、group application、group membership 和 group leader 关系。App 和后台只展示 canonical view。

## Core Concepts

- `group`：小组或团契资料。
- `group_application`：加入申请。
- `group_membership`：成员关系。
- `group_leader`：可管理该小组的授权角色。
- `visibility_scope`：公开、会友、小组成员、管理员。

## Rules

- 成员关系必须以后端为准。
- 小组成员名单默认不对非授权用户公开。
- 带领人可以管理所属小组，但不自动拥有全局会员权限。
- 小组归档不删除历史申请、成员关系和审计。
- 申请只有 `submitted` 可以进入 `approved`、`declined` 或 `withdrawn`；三个终态不可互相改写。
- 批准申请时在同一 repository transaction 创建或更新 membership；会员资料的 group id 是兼容筛选和 Prayer 的投影，不是 Mine 的 canonical 读源。
- Mine 通过 active/leader membership 读取 `/v1/me/groups`。
- 并发审批必须锁定 group 并在事务内重算容量；容量不能低于 active/leader 成员数。
- Admin 成员状态更新必须锁定 group 和 membership；从 inactive 恢复为
  active/leader 时重新检查 group 状态和容量。
- 成员状态重复更新返回 canonical membership，并重新同步 member profile
  小组投影，便于恢复中途失败。
- 出席记录只能关联 active/leader membership。
- 出席 intent 只携带成员 id；成员显示名由后端会员资料 source of truth 派生。
- 读经计划、讲道讨论包和课程材料只保存引用，创建或换源时必须验证 owner
  repository 中的目标真实存在；`manual` 材料不要求外部引用。

## Used By

- group ministry。
- church life publishing。
- prayer moderation。
- member profile。
