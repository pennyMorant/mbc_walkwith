# Event Attendance

状态：二阶段现场二维码签到第一版已接入

## Feature Goal

让会友在已报名活动中完成签到，并让同工查看出席状态、手动补签和导出名单。

## Non-Goals

- 不创建活动报名规则，报名归 `event_registration`。
- 不把 App 本地二维码视为最终签到状态。
- 不处理课程长期出勤，课程出勤归 `course_learning`。

## Owners

- Product owner：活动同工。
- Backend owner：`LifeEventAttendanceService`。
- Surface owners：App Life/Mine，Admin Ministry。

## Source Of Truth

签到状态、签到时间、签到方式、操作者和出席导出以后端
`event_registrations` repository 为准。第一版不另建 attendance 表，避免和报名事实表重复。

## State Model

- `not_checked_in`
- `checked_in`
- `onsite_qr`
- `admin_manual`
- `absent`
- `cancelled`

## Capability Contracts

- `qr_check_in` 用于二维码或签到码校验。
- `data_export` 用于名单导出。
- `notification_delivery` 用于活动提醒。

## App Surface Boundary

App 展示我的报名、扫描现场二维码入口、签到状态和活动提醒。App 不自己写最终出席状态。
签到成功响应中的状态、时间和方式必须作为一个一致的 canonical snapshot 解析；未知方式、
缺少签到时间或会员缓存串号时不得显示成功。

## Admin Web Surface Boundary

后台提供现场二维码生成/轮换/打印、搜索名单、手动补签、标记缺席、导出和统计。

## Backend Service Boundary

后端负责二维码凭证签发、报名状态校验、签到幂等、重复提交、时间窗口、权限和审计。
二维码生成/轮换、会友签到、取消和后台状态调整共享活动级串行化边界；轮换和扫码并发时，
扫码必须重新读取凭证状态，已禁用的旧码不得完成签到。

活动级锁必须向签到 service 提供 transaction-scoped registration store。禁用旧码与创建新码、
读取 active 报名与写入签到结果都必须在同一事务里完成；事务失败时旧码和报名状态保持不变。

## Side Effects

- 二维码凭证写入 `event_check_in_codes`。
- 签到记录写入 `event_registrations`。
- 出席名单导出。
- 提醒通知。

## Lifecycle And Recovery

签到码可过期并重新签发。后台轮换二维码时旧码禁用。会友自助和二维码签到仅在活动开始前 30 分钟至结束后 12 小时的窗口内可用；未设置活动排期时保持可签到，后台手动补签不受该窗口限制。重复签到返回现有 canonical state。离线扫码不得绕过后端确认。

## Error Model

- `event_check_in_code_invalid`
- `event_check_in_code_expired`
- `event_check_in_code_disabled`
- `registration_not_found`
- `check_in_not_allowed`
- `event_not_found`
- `event_not_open`

## Main Logic Chain

同工打开后台活动报名卡片 -> 生成或轮换现场二维码 -> 打印二维码 -> 会友打开 App 扫描现场二维码 -> 后端校验二维码、活动、会员和 active 报名 -> 写入
`checked_in`、`checkedInAt` 和 `onsite_qr` -> App 和后台刷新状态。

后台同工打开报名名单 -> 搜索报名 -> 手动签到或标记缺席 -> 后端写 canonical state
并记录审计 -> CSV 导出读取同一事实表。

## Failure Chains

- 二维码过期时重新请求。
- 活动尚未开始或已超过签到窗口时，会友自助和二维码签到均被拒绝。
- 未报名用户不能签到。
- 网络失败时 App 显示待重试，不标记成功。

## Verification Checklist

- 未报名、取消报名、活动结束都不能正常签到。
- 重复签到幂等。
- 手动补签需要权限和审计。
- 导出名单与后端 canonical state 一致。
- `absent` 和 `cancelled` 不进入 active 报名与参与人数统计。
- 导出不受后台名单分页上限影响，审计字节数按 UTF-8 计算。

## Related Docs

- [event_registration.md](event_registration.md)
- [../domains/event_attendance.md](../domains/event_attendance.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [../capabilities/qr_check_in.md](../capabilities/qr_check_in.md)
