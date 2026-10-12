# Pastoral Care

状态：第一版已落地

## Purpose

定义关怀请求、负责人、跟进记录、隐私等级和牧养备注的共享规则。

## Source Of Truth

后端拥有 care request、assignee、follow-up、privacy level、status 和 audit trail。

## Core Concepts

- `care_request`：会友或同工创建的关怀请求。
- `assignee`：授权跟进负责人。
- `follow_up`：一次跟进记录或计划。
- `privacy_level`：牧者可见、负责团队可见、管理员限制可见。
- `care_status`：提交、已分配、跟进中、已解决、归档。

## Rules

- 关怀备注默认敏感，不进入普通通知 payload。
- 普通 App member API 只能返回 care request summary，不能返回内部备注或跟进记录。
- `care:read` 是进入后台关怀 API 的基础权限，不等于能读取所有隐私等级。
- `admin_restricted` 只能由 `owner` 和 `admin` 读取或管理。
- `pastoral_only` 可以由 `owner`、`admin` 和 `pastor` 读取或管理。
- `assigned_team` 可以由 `owner`、`admin`、`pastor` 或后端记录的负责人读取；负责人判断以后端 `assigneeAdminUserId` 为准。
- 后台审计只能记录敏感内容是否存在、状态、隐私等级、负责人等元数据，不能记录原始关怀正文、内部备注或跟进正文。
- 后台列表审计不得记录原始搜索词或被筛选会员 ID。
- 访问和修改关怀记录必须审计。
- 完成跟进自动推动主请求状态时，跟进和主请求状态变化必须分别审计。
- 更新和跟进写入必须使用递增版本防止旧页面覆盖较新的状态或隐私等级；冲突证据不得包含关怀正文或内部备注。
- `planned` 跟进必须有计划时间，完成时间只属于 `completed` 跟进。
- 归档不删除历史审计。
- 只有授权角色能查看 restricted 记录。

## Used By

- pastoral care。
- member profile。
- notification delivery。
- privacy。
