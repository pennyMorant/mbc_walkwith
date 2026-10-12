# Payment Gateway

状态：支付 provider 能力边界

## Purpose

封装 Stripe Checkout、webhook、refund、dispute、payout 等支付 provider 能力。

## Owner

Backend payment gateway adapter。

## Contract

输入：

- member id。
- amount。
- currency。
- giving category。
- success/cancel redirect。

输出：

- checkout session id。
- checkout URL。
- provider event payload。
- normalized payment event。
- charge balance transaction 中的 fee、net、available date。
- payout 对应的 charge id 集合。

## Rules

- 不处理 raw card data。
- Provider secret 只在后端。
- Webhook signature 必须验证。
- Provider event 必须幂等。
- Provider event 必须提供稳定 event id；checkout 事件必须提供 session id，adapter 不生成临时 identity。
- Gateway 输出的金额和币种由 giving service 与 canonical transaction 核对。
- Gateway 不决定年度证明金额。
- Gateway 不决定财务对账业务含义。
- Stripe charge 的 `balance_transaction` 可以只是可展开 id；adapter 负责向 Stripe 回查完整财务事实。
- payout adapter 只在 `payout.reconciliation_completed` 后按 payout 分页读取 balance transactions，并只输出 charge source id。
- provider API 失败或财务响应缺字段时必须返回可重试错误，不能用 0 或 gross 代替。
- adapter 必须输出 balance transaction 的 gross 和 currency，供 giving service 在写入 fee/net 前核对 canonical transaction。

## Errors

- `payment_provider_unavailable`
- `checkout_session_failed`
- `webhook_signature_invalid`
- `provider_event_duplicate`
- `provider_event_unhandled`
- `provider_event_transaction_mismatch`
- `provider_finance_unavailable`

## Used By

- [../features/giving_flow.md](../features/giving_flow.md)
