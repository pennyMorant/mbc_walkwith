# Giving Flow

状态：Stripe Checkout/webhook、交易、费用、部分/全额退款、争议和 payout 对账代码闭环已接入；真实 Stripe 环境待验收

## Feature Goal

让会友通过 App 发起奉献，让后端通过 Stripe 确认交易最终状态，让财务同工在管理 Web 中查看交易、手续费、退款、争议、payout 和对账。

## Non-Goals

- 不是 App Store 或 Play 数字内购。
- 不处理原始卡号。
- 不让 App 成为交易最终状态 owner。
- 不定义年度证明 PDF 版式，年度证明见 [annual_statement.md](annual_statement.md)。

## Owners

- Feature owner：backend giving service。
- Payment capability owner：payment gateway adapter。
- App surface：Giving entry and history。
- Admin surface：finance and reconciliation pages。
- Source of truth owner：backend giving records from verified Stripe events。

## Source Of Truth

后端拥有：

- pending gift。
- provider session id。
- provider payment intent id。
- provider charge id（仅后端对账关联）。
- succeeded/failed/refunded 状态。
- gross amount。
- fee。
- net amount。
- payout id。
- dispute id/status/amount。
- provider event id。
- reconciliation state。

Stripe webhook 是最终交易事件来源。后端记录是产品内 canonical state。

## State Model

交易状态：

- `pending`
- `succeeded`
- `failed`
- `refunded`

争议状态独立于交易状态：

- `none`
- `warning`
- `open`
- `won`
- `lost`
- `closed`

对账状态：

- `unreconciled`
- `reconciled`
- `needs_review`

## Capability Contracts

使用：

- payment gateway：Stripe checkout、webhook、refund、dispute、payout event。
- audit log：财务查看、导出、手动复核。
- notification delivery：收据或状态提醒。

## App Surface Boundary

App 可以：

- 发起奉献 intent。
- 打开后端返回的 Stripe Checkout。
- 显示 pending/succeeded/failed/refunded 等后端状态。
- 刷新奉献历史。

App 不可以：

- 处理卡号。
- 根据 checkout success page 确认交易。
- 计算手续费、净额、payout。
- 修改交易状态。

## Admin Web Surface Boundary

管理 Web 可以：

- 查看交易。
- 查看手续费、净额、退款、争议、payout。
- 用 `giving:manage` 维护奉献基金。
- 标记复核状态。
- 用 `giving:export` 导出财务数据和生成/下载年度证明。

管理 Web 不可以直接调用 Stripe secret API 或改写最终交易状态。

## Backend Service Boundary

Giving service 负责：

- 创建 checkout session。
- 只使用服务端配置的 checkout success/cancel URL，不接受 App 传入的跳转 URL。
- 创建 pending gift。
- 验证 webhook signature。
- 幂等处理 provider event。
- 写入最终交易状态。
- 记录费用、净额、退款、争议、payout。
- 用 charge 的 balance transaction id 向 Stripe 回查费用、净额和可用日期；不能把缺失费用静默写成 0。
- 提供 member 和 finance 视图。

## Side Effects

- Stripe checkout。
- Stripe webhook。
- Postgres 写入。
- 审计。
- 通知。

## Lifecycle And Recovery

Checkout 创建后可能长期 pending，尤其是异步支付方式。Webhook 重放必须幂等。

恢复路径：

- App checkout 返回后刷新交易状态；`checkout=success` 只表示托管流程结束，
  App 在 5、15、30 秒短暂轮询后端 canonical state，并在页面销毁时取消轮询。
- Stripe session 创建失败时，后端把已创建的 pending gift 转为 failed。
- Stripe session 已创建但本地 session id 关联中断时，签名 webhook 使用服务端写入的 transaction id metadata 找回并补齐原交易。
- webhook 失败可重试。
- provider event 重放不会重复入账。
- 只有 `processed`/`ignored` event 可直接确认重复；停留在 `received` 或 `failed` 的 event 必须允许幂等重放恢复。
- 交易状态按后端单向状态机推进；迟到的 pending/failed/succeeded 事件不能覆盖已成功或已退款状态。
- checkout 成功和异步结果必须与本地 transaction 的 session identity、金额和币种一致，否则 event 进入 failed 并要求财务复核。
- 未匹配到本地交易的 provider event 必须标记 failed，不能记为 processed。
- 已失败的 provider event 在本地交易状态补齐后允许同 event id 重放恢复。
- 财务对账异常进入 `needs_review`。
- `charge.refunded` 的 `amount_refunded` 是累计退款额；部分退款保留 `succeeded`，只有全额退款进入 `refunded`，退款发生后先进入 `needs_review`。
- charge webhook 先保存 Stripe charge id；收到 `payout.reconciliation_completed` 后，adapter 按 payout 分页读取 balance transactions，giving service 再用 charge id 关联并标记 `reconciled`。
- `payout.failed` 使已经关联该 payout 的交易回到 `needs_review`；未匹配 payout 事件保持 failed，允许调查后重放。

## Error Model

稳定错误：

- `giving_amount_invalid`
- `checkout_session_failed`
- `payment_pending`
- `payment_failed`
- `webhook_signature_invalid`
- `webhook_duplicate`
- `provider_event_unhandled`
- `provider_event_transaction_mismatch`
- `provider_finance_unavailable`
- `finance_permission_denied`

## Main Logic Chain

```text
App requests checkout
-> backend validates member, amount, category
-> backend creates pending gift
-> payment gateway creates Stripe Checkout Session
-> App opens checkout
-> Stripe sends webhook
-> backend verifies signature and idempotency
-> giving service records final transaction state
-> App/admin Web refresh canonical state
```

## Failure Chains

必须验证：

- checkout 创建失败。
- 用户取消 checkout。
- 异步支付 pending。
- webhook 重放。
- webhook 乱序或未匹配本地交易。
- provider event 缺少稳定 event id、checkout session id，或金额/币种与本地交易不一致。
- webhook 签名失败。
- 退款。
- 争议。
- payout 未匹配。

## Verification Checklist

- App success page 不确认交易。
- Webhook 处理幂等。
- 费用和净额不影响会友奉献总额。
- 财务访问有权限和审计。
- Provider secrets 不进入前端。

## Related Docs

- [../domains/giving_finance.md](../domains/giving_finance.md)
- [../capabilities/payment_gateway.md](../capabilities/payment_gateway.md)
- [../domains/audit_log.md](../domains/audit_log.md)
- [annual_statement.md](annual_statement.md)
