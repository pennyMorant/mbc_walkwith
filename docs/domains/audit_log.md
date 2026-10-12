# Audit Log

状态：审计日志领域规则

## Purpose

定义高风险动作如何记录，支持追踪、恢复、复核和责任边界。

## Source Of Truth

后端 audit log repository 是审计 source of truth。前端不能伪造或补写最终审计。

## Required Fields

- actor id。
- actor role。
- action。
- resource type。
- resource id。
- before/after 或关键 metadata。
- provider event id。
- request correlation id。
- timestamp。

## Required Events

- 管理员登录失败和权限拒绝。
- 发布、下架、归档、删除内容。
- 上传和替换讲道资源。
- 审核代祷。
- 财务查看、导出、生成证明。
- 退款、争议、对账状态变更。
- 群发通知。
- 管理员手动调整报名和签到。

## Rules

- 审计日志不能包含 raw card data。
- 敏感正文只记录引用和必要 metadata。
- 审计失败时，高风险业务动作应失败或进入需复核状态。

## Used By

- sermon publishing。
- event registration。
- giving flow。
- annual statement。
- prayer。
- admin web。
