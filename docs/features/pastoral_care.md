# Pastoral Care

状态：第一版已落地

## Feature Goal

让会友提交关怀请求，让牧者或授权同工分配负责人、记录跟进、设置下一步和保护隐私。

## Non-Goals

- 不做医疗、法律或心理治疗记录系统。
- 不公开关怀记录给普通会友。
- 不把关怀备注推送到通知 payload。

## Owners

- Product owner：牧养同工。
- Backend owner：pastoral care service。
- Surface owners：App Life/Mine，Admin People。

## Source Of Truth

关怀请求、负责人、跟进记录、隐私等级、下一次跟进时间和状态以后端 pastoral care repository 为准。

## State Model

- request：`submitted`、`assigned`、`in_progress`、`resolved`、`archived`
- follow up：`planned`、`completed`、`cancelled`
- privacy：`pastoral_only`、`assigned_team`、`admin_restricted`

## Capability Contracts

- `scheduled_notification` 用于负责人提醒。
- `notification_delivery` 用于会友状态更新。

## App Surface Boundary

App Life 在会友登录后提供提交关怀请求和查看自己的请求状态。App 只接收 member-safe summary，不展示 `internalNote` 或 `followUps`。
会友列表的 `status` 和 `limit` 必须由 member query contract 校验，后端不得忽略 App 的分页意图。

## Admin Web Surface Boundary

后台 Care 页面提供关怀队列、状态筛选、分配负责人、隐私等级、下一步、内部备注和跟进记录创建。页面只调用 admin API helper，不直接判断最终隐私权限。
负责人选择读取 `/v1/admin/care-assignees` 的最小目录，只包含具备 `care:manage` 的活跃管理员 ID 和姓名，不复用完整管理员用户列表。
关怀队列不内嵌 follow-up 正文；打开记录后通过独立、隐私校验且有访问审计的 follow-up API 加载。

## Backend Service Boundary

后端负责 member/admin API、隐私权限、负责人、状态流转、跟进记录和审计。第一版已实现请求提交、后台更新、跟进记录和审计元数据；负责人提醒和会友状态通知留给 notification delivery 阶段接入。

- 负责人 ID 必须是有效 Admin UUID，显示名称不能代替权限判断。
- `planned` 跟进必须提供 `plannedAt`；非 `completed` 跟进不得提供 `completedAt`。
- 完成跟进推动请求进入 `in_progress` 的决定属于 care service；repository 只原子执行 service 给出的写入意图。

后台关怀读取不是单纯的页面权限：

- `owner`、`admin` 可以读取和管理所有关怀隐私等级。
- `pastor` 可以读取和管理 `pastoral_only`、`assigned_team`，但不能读取或修改 `admin_restricted`。
- `content_editor`、`viewer`、`finance` 默认没有 `care:read` 或 `care:manage`。
- `assigned_team` 以后允许被分配负责人读取；具体负责人身份以后端保存的 `assigneeAdminUserId` 为准。
- Admin Web 可以根据权限隐藏入口，但最终可见性必须由后端 service 强制执行。

## Side Effects

- 审计记录访问和修改。
- 后续接入负责人提醒。
- 后续接入会友状态通知。

## Lifecycle And Recovery

请求提交后可分配负责人。跟进记录不可静默删除，只能更正或归档。归档后保留审计。

## Error Model

- `care_request_not_found`
- `care_privacy_denied`
- `care_assignee_required`（后续负责人强校验）
- `care_assignee_invalid`
- `care_request_state_conflict`
- `care_follow_up_invalid`（后续细化跟进计划校验）

## Main Logic Chain

会友提交关怀请求 -> 后端保存 submitted -> 同工分配负责人 -> 负责人记录跟进 -> 后端更新状态和下一步 -> App 显示自己的公开状态。

## Failure Chains

- 无权限同工不能查看 restricted 请求。
- 无权限角色即使能登录后台，也不能通过 admin API 读取关怀列表或跟进记录。
- 有 `care:read` 的牧者不能读取或修改 `admin_restricted` 记录。
- 提醒失败不删除跟进计划。
- 状态冲突返回当前 canonical state。
- 更新和跟进创建使用递增 `version` 并发守卫；冲突后重新读取并先复核当前隐私权限，再返回脱敏 canonical evidence。

## Verification Checklist

- App 不展示内部备注。
- 访问和修改关怀记录有审计。
- 隐私等级由后端强制执行。
- 审计 payload 只记录 `hasBody`、`hasInternalNote`、`hasNote` 等元数据，不记录关怀正文、内部备注或跟进正文。
- 列表审计不记录管理员原始搜索词或被筛选会员 ID，只记录存在性和长度。
- 更新审计保留脱敏 before/after；跟进推动主请求状态时另记主请求状态审计。
- 负责人提醒接入后可重试。

## Related Docs

- [../domains/pastoral_care.md](../domains/pastoral_care.md)
- [../domains/privacy.md](../domains/privacy.md)
- [../domains/member_identity.md](../domains/member_identity.md)
