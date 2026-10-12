# Event Registration

状态：二阶段第一版已接入，报名、取消、资料更新、签到和后台名单导出基础闭环已接入

## Feature Goal

让会友在 App 里查看活动、报名、取消、查看状态；让管理员在管理 Web 里创建活动、设置名额、查看名单、签到和导出。

## Non-Goals

- 不是活动详情页面文档。
- 不是报名按钮文档。
- 不是单个报名 API 文档。
- 不处理奉献付款。

## Owners

- Feature owner：backend `LifeEventRegistrationService`。
- App surface：Life / event detail。
- Admin surface：event management pages。
- Source of truth owner：backend database through event repository。

## Source Of Truth

后端拥有：

- 活动定义。
- 活动可见性。
- 活动容量。
- 报名状态。
- 取消状态。
- 签到状态。

App 和管理 Web 只能读取 canonical state 或提交 intent。

## State Model

活动状态：

- `draft`
- `needs_review`
- `published`
- `archived`

报名是否开放不是独立状态，而由 `published`、`registrationEnabled`、可见性和
`registrationDeadline` 共同决定。

报名状态：

- `confirmed`
- `cancelled`
- `checked_in`
- `absent`

当前 v1 不启用 waitlist。缺席使用 `absent`，不计入 active 容量；签到使用
`checked_in` 并带 `checkedInAt`、`checkInMethod` 和可选后台操作者。
现场二维码签到写入 `onsite_qr`；后台手动补签写入 `admin_manual`。

数据库契约：

- 每个会友在同一个活动下只能有一个 active 报名。
- Active 报名状态是 `confirmed` 和 `checked_in`。
- `cancelled` 不计入容量，也不阻止会友重新报名。
- `absent` 不计入容量，也不阻止会友重新报名。

## Capability Contracts

使用：

- notification delivery：报名确认、活动提醒、取消通知。
- audit log：管理员创建、修改、导出、签到调整。
- object storage：未来活动附件或图片。

## App Surface Boundary

App 可以：

- 展示活动列表和详情。
- 展示自己的报名状态。
- 提交报名 intent。
- 提交取消 intent。
- 提交自助签到 intent。
- 展示后端返回的错误和下一步。

App 不可以：

- 自行判断最终报名成功。
- 自行计算剩余名额。
- 自行进入候补。
- 自行写入最终签到状态。

App 只缓存后端返回的 canonical 报名摘要。会员专属状态按会员 ID 保留在进程内，
不得写入未按账号分区的通用生活内容 SQLite 缓存；未知状态或不一致计数必须作为
契约错误暴露，不能降级成“未报名”。

## Admin Web Surface Boundary

管理 Web 可以：

- 创建和编辑活动。
- 设置活动状态、容量、可见性。
- 查看报名名单。
- 手动调整报名状态。
- 做签到和导出。
- 通过后端总数驱动的分页浏览完整名单，显示 loading、empty、error 和成功状态。
- 将 CSV 响应下载为后端指定文件名，不在操作页面长期展开敏感名单正文。

管理 Web 不可以绕过后端直接改数据库。
只有 `life_posts:update` 才能读取或操作报名名单；仅有 `life_posts:read` 的账号不得发起
包含姓名、邮箱、备注和签到事实的名单请求。

## Backend Service Boundary

Event service 负责：

- 校验登录和会员资格。
- 判断活动是否开放。
- 判断是否重复报名。
- 判断名额。
- 对同一活动串行化所有可能增加 active 容量的报名创建、人数修改和后台状态调整，再写入报名状态。
- 对同一活动串行化报名取消、会友签到、二维码签到和签到码轮换，避免状态竞态或多个有效码。
- 记录管理员手动调整审计。

持久化契约：

- `EventRegistrationRepository.withEventRegistrationLock` 必须向回调提供同一事务内的
  scoped store。
- 名额读取与报名写入、状态调整与容量校验必须只通过该 scoped store，不能在持锁期间回到
  root repository 做自动提交读写。
- 签到码与自助签到由 `LifeEventAttendanceService` 管理，但复用同一事务边界和报名事实表。

## Side Effects

- Postgres 写入。
- 通知发送。
- 审计日志。
- 名单导出文件。

审计边界：

- 会友报名、修改报名和取消报名成功后记录 member intent 审计。
- 管理员创建线下报名、调整状态、签到和导出名单记录 admin 审计。
- 审计只记录必要业务快照，不把完整备注或邮箱正文作为默认审计内容。
- 管理员名单搜索审计只记录是否使用搜索和分页范围，不复制可能包含姓名或邮箱的搜索词。

## Lifecycle And Recovery

报名操作必须幂等。重复提交同一报名 intent 时，返回当前 canonical state。

需要恢复：

- 网络失败后 App 刷新活动详情。
- 管理员调整后 App 下次读取 canonical state。
- 通知失败不回滚报名状态，但必须可重试。
- 管理员名单使用后端 `limit + offset` 分页并返回总数；CSV 导出不复用分页结果，
  必须读取该活动的全部报名记录。

## Error Model

稳定错误：

- `event_not_found`
- `event_not_open`
- `authentication_required`
- `permission_denied`
- `event_capacity_full`
- `event_party_size_invalid`
- `already_registered`
- `registration_not_found`
- `check_in_not_allowed`

## Main Logic Chain

```text
tap register
-> App sends registration intent
-> backend validates member and event
-> event service reads event and registration source of truth
-> service applies capacity and duplicate rules
-> repository writes registration atomically
-> audit/notification side effects run
-> App refreshes event detail
-> UI shows confirmed state or a structured capacity/registration error
```

## Failure Chains

必须验证：

- 未登录。
- 活动关闭。
- 活动已隐藏或不再对会员可见。
- 名额已满。
- 重复报名。
- 网络失败后刷新。
- 管理员手动取消。
- 签到权限不足。
- App 详情接口收到 404 或 `event_not_found` 后不能回退展示旧缓存。

## Verification Checklist

- App 不计算最终容量。
- 管理 Web 不直接写数据库。
- 后端报名写入幂等。
- 会友报名/修改/取消和管理员创建/调整/签到有审计。
- 失败错误有 next action。

## Related Docs

- [../core/feature_integration.md](../core/feature_integration.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [../domains/content_visibility.md](../domains/content_visibility.md)
- [../capabilities/notification_delivery.md](../capabilities/notification_delivery.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)
- [../surfaces/admin_web.md](../surfaces/admin_web.md)
