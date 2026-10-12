# Scheduled Notification

状态：通知 retry scheduler 已接入；未来业务提醒调度仍在规划

## Purpose

封装通知重试、未来延迟通知、定时提醒和重复提醒的调度能力。它只负责调度，
不拥有通知偏好或业务状态。

## Owner

Backend notification scheduler/service。当前实现是进程内
`NotificationRetryScheduler`，不是独立 worker。

## Contract

输入：

- schedule time。
- recipient scope。
- notification intent type。
- dedupe key。
- cancellation key。
- retry batch limit。

输出：

- scheduled job id。
- status。
- next run time。
- retry state。
- processed count。

## Rules

- 调度前必须经过 feature service 权限和偏好检查。
- cancellation key 用于活动取消、排班取消或课程变更后的撤销。
- 定时任务失败不改变原业务状态。
- 任务执行时仍需重新检查偏好和可见性。
- 当前 notification retry scheduler 只处理已有 delivery task 的重试，不创建新的业务提醒。
- scheduler 读取到期任务后仍必须逐任务取得 repository lease；进程内 `running` 标志只防止本实例重入，不替代跨请求/跨进程 claim。
- 单个 provider 失败只更新该 task 并继续批次；崩溃遗留 lease 到期后可重新 claim。
- 小型 VPS 部署不使用独立 worker；除非部署模型改变，不重新引入 worker。

## Errors

- `scheduled_notification_invalid_time`
- `scheduled_notification_cancelled`
- `scheduled_notification_retry_exhausted`
- `scheduled_notification_preference_denied`

## Used By

- church life publishing。
- event attendance。
- serving schedule。
- course learning。
- pastoral care。
- notification delivery。
