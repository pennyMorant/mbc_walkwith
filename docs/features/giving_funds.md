# Giving Funds

状态：二阶段第一版已接入，App active fund、Admin 基金维护和交易归属基础闭环已接入

## Feature Goal

让教会维护奉献用途和专项基金，让会友在奉献时选择用途，并让财务同工按基金查看统计。

## Non-Goals

- 不替代 Stripe 交易确认。
- 不让 App 端决定奉献最终入账。
- 不从会友年度证明中扣除手续费。

## Owners

- Product owner：财务同工。
- Backend owner：giving funds service。
- Surface owners：App Mine，Admin Giving。

## Source Of Truth

基金、用途、启停状态、目标金额、展示说明、交易归属和统计以后端 giving repository 为准。Stripe webhook 仍是付款最终状态来源。

## State Model

- fund：`draft`、`active`、`paused`、`archived`
- 交易归属状态跟随奉献交易状态：`pending`、`succeeded`、`failed`、`refunded`

争议不作为 fund allocation 的独立状态；它跟随 giving flow 的 `disputeStatus`
字段统计和展示。

## Capability Contracts

- `payment_gateway` 用于 Checkout 和 provider event。
- `data_export` 用于财务导出。

## App Surface Boundary

App 展示可用奉献用途、说明、金额输入和 checkout intent。App 不展示内部净额或手续费决策。

## Admin Web Surface Boundary

后台维护基金、启停、目标、说明、统计、交易过滤和导出。

## Backend Service Boundary

后端负责基金可用性、交易归属、统计、权限、审计和 webhook 幂等。

## Side Effects

- 创建支付会话。
- 处理 provider event。
- 导出基金统计。
- 审计基金配置变化。

## Lifecycle And Recovery

基金暂停后不能新建 checkout，但历史交易保留归属。Webhook 到达时若基金已归档，仍按交易创建时的 fund id 入账。

## Error Model

- `giving_fund_not_found`
- `giving_fund_inactive`
- `giving_fund_allocation_invalid`
- `giving_fund_code_conflict`
- `giving_fund_permission_denied`

## Main Logic Chain

会友选择基金 -> 后端校验 active fund -> 创建 Stripe Checkout -> webhook 确认付款 -> 后端记录 fund allocation -> App 和后台刷新记录。

## Failure Chains

- 基金停用后拒绝新 checkout。
- webhook 重放保持幂等。
- 退款和争议更新 allocation 状态。

## Verification Checklist

- App 只展示 active fund。
- 交易以 webhook 为准。
- 基金启停、归档和配置变更有审计。
- 基金 code 是创建后不可修改的唯一、稳定小写标识，只允许数字、连字符和下划线分隔。
- 空配置更新会被拒绝；更新审计同时保留变更前和变更后快照。
- 财务统计包含 gross、fee、net、refund、dispute。

## Related Docs

- [giving_flow.md](giving_flow.md)
- [annual_statement.md](annual_statement.md)
- [../domains/giving_fund.md](../domains/giving_fund.md)
- [../domains/giving_finance.md](../domains/giving_finance.md)
- [../capabilities/payment_gateway.md](../capabilities/payment_gateway.md)
