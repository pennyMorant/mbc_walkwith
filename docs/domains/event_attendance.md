# Event Attendance

状态：二阶段现场签到第一版已接入

## Purpose

定义活动签到、出席、迟到、缺席、手动补签和导出的共享规则。

## Source Of Truth

后端通过 `event_registrations` 拥有 attendance status、check-in actor、method
和 timestamp；二维码或短码只是签到凭证，不是最终出席状态。

## Core Concepts

- `check_in_code`：签到码或二维码中的一次性验证材料。
- `attendance_status`：确认、已签到、缺席、取消。
- `check_in_method`：现场二维码签到、会友自助签到或同工手动补签。
- `onsite_qr`：会友扫描同工打印的活动级二维码后，由后端按当前会员报名完成签到。
- `manual_check_in`：授权同工执行的补签。
- `attendance_export`：出席名单导出。

## Rules

- 签到必须绑定有效报名。
- 重复签到必须幂等。
- 手动补签需要权限和审计。
- 二维码或签到码不可作为最终出席状态。
- `confirmed` 和 `checked_in` 计入 active 容量；`cancelled` 和 `absent` 不计入。

## Used By

- event attendance。
- event registration。
- ministry analytics。
