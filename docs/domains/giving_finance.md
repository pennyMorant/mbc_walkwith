# Giving Finance

状态：奉献财务领域规则

## Purpose

定义奉献金额、手续费、净额、退款、争议、payout、对账和年度证明金额之间的关系。

## Source Of Truth

Stripe webhook 事件经过后端验证和幂等处理后，写入后端 giving records。后端记录是产品内 canonical state。

## Money Fields

- gross amount：会友奉献总额。
- fee amount：支付平台手续费。
- net amount：扣费后净额。
- refund amount：退款金额。
- dispute amount：争议金额。
- payout id：平台打款批次。

## Rules

- 会友年度证明显示 confirmed gifts 的 gross amount。
- 手续费和净额属于财务对账，不从会友证明中扣除。
- App success page 不能确认交易。
- Webhook 必须幂等。
- `pending -> succeeded|failed`、`succeeded -> refunded` 是正常推进；provider 已创建 session 但本地请求超时的补偿记录允许由签名 paid event 执行 `failed -> succeeded` 恢复。相同状态可幂等重放，其他倒退转换必须忽略并保留 canonical 状态。
- provider checkout session id 和 payment intent id 在同一 provider 内必须唯一。
- provider charge id 在同一 provider 内必须唯一，只用于把 Stripe balance transaction/payout 关联到 canonical gift。
- fee 和 net 来自 Stripe charge 对应的 balance transaction；charge webhook 只给出 balance transaction id 时，payment adapter 必须回查，不能用 gross 猜 net。
- balance transaction 的 gross、currency 和 `net = gross - fee` 必须与 canonical gift 一致；不一致时 provider event 失败并进入财务调查，不能跨币种混记。
- net 表示原 charge 扣除支付手续费后的净额；累计退款额单独记录，不能因部分或全额退款无依据地把 net 归零。
- 部分退款不改变 gift 的 confirmed 状态；全额退款才进入 `refunded`。两者都进入 `needs_review`，直到退款财务影响完成复核。
- payout 只在 `payout.reconciliation_completed` 后按 Stripe payout balance transactions 关联；`payout.failed` 使已关联记录进入 `needs_review`。
- 退款、争议、payout 必须可追踪。
- 财务查看、导出、复核必须有权限和审计。

## Used By

- giving_flow。
- annual_statement。
- admin finance reconciliation。
