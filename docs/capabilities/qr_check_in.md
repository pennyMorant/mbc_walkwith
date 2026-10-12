# QR Check In

状态：已接入活动现场签到第一版

## Purpose

封装活动现场二维码/短码生成、校验、过期和诊断信息。它只处理现场签到凭证能力，不决定活动出席业务结果。

## Owner

Backend attendance capability adapter。当前第一版由 `LifePostService` 直接编排
`event_check_in_codes` 和 `event_registrations`，后续如二维码能力复用到其他场景，再抽出独立 adapter。

## Contract

输入：

- activity event id。
- QR payload。
- short code。
- expiration。
- disabled state。
- scanning member session。

输出：

- active check-in code。
- check-in validation result。
- canonical event registration state。
- structured diagnostic error。

## Rules

- QR capability 不写 attendance source of truth；最终状态仍是 `event_registrations`。
- 后台生成活动级现场二维码，参与者用 App 扫码。
- 扫码后端按当前会员 session 查找该活动 active 报名。
- 重复扫码必须幂等返回现有 `checked_in` 状态。
- 二维码可以轮换；旧码写入 `disabled_at` 后不能再签到。
- 签到码默认有过期时间，也可由 Admin 请求指定过期时间。
- 失败原因必须结构化返回。

## Errors

- `event_check_in_code_invalid`
- `event_check_in_code_expired`
- `event_check_in_code_disabled`
- `registration_not_found`
- `event_not_found`
- `event_not_open`

## Used By

- event attendance。
