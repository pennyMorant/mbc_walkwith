# Giving Fund

状态：二阶段第一版已接入

## Purpose

定义奉献用途、专项基金、交易归属、目标金额和财务统计口径。

## Source Of Truth

后端拥有 fund、fund allocation、fund status 和 derived statistics。付款最终状态仍来自 payment gateway webhook。

## Core Concepts

- `fund`：普通奉献、宣教、建堂、慈善等用途。
- `allocation`：交易与 fund 的归属关系。
- `target_amount`：可选目标金额。
- `fund_status`：草稿、启用、暂停、归档。

## Rules

- 只有 active fund 可用于新 checkout。
- 历史交易保留创建时的 fund 归属。
- 年度证明显示奉献总额，不扣手续费。
- 财务后台可查看 gross、fee、net、refund、dispute。

## Used By

- giving funds。
- giving flow。
- annual statement。
- ministry analytics。
