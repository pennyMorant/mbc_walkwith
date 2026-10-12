# Notification Preference

状态：二阶段第一版已接入

## Purpose

定义会友通知偏好、设备 token、频道、通知类型和隐私边界。

## Source Of Truth

后端拥有 notification preference、device token、channel consent 和 delivery eligibility。

## Core Concepts

- `notification_type`：讲道、生活发布、周报、活动、课程、服事、代祷、年度证明等类型。
- `channel`：push、email、sms 的未来扩展。
- `device_token`：设备投递 token。
- `preference`：启用、关闭或未设置。
- `audience`：`public`、`members`、`member_specific`，决定通知目标范围。

## Rules

- 偏好关闭时不得创建投递任务。
- 私密正文不得放进 push payload。
- 设备 token 登出时必须注销或撤销。
- 群发通知需要权限和审计。
- 当前会员偏好键：`weeklyBulletin`、`sermonPublished`、`lifePostPublished`、`prayerUpdates`。
- 访客 token 只能接收 `public` audience，不创建会员 inbox item。
- `members` audience 必须按 active member 和偏好键筛选。
- `member_specific` audience 必须携带明确 recipient user IDs，不能靠标题、路由或前端状态推导。

## Used By

- member profile。
- notification delivery。
- serving schedule。
- course learning。
- event attendance。
