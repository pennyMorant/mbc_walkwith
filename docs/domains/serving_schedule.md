# Serving Schedule

状态：二阶段第一版已接入，三阶段 v2 可用性和到岗基础闭环已接入

## Purpose

定义服事团队、岗位、排班、确认、请假和换班请求的共享规则。

## Source Of Truth

后端拥有 serving team、role、assignment、confirmation、leave request 和 swap request。第一版已实现 team、role、assignment、confirm 和 leave intent。

## Core Concepts

- `serving_team`：敬拜、接待、儿童、音控等团队。
- `serving_role`：岗位或职责。
- `assignment`：某次日期和时段的排班。
- `confirmation`：会友确认或拒绝服事。
- `swap_request`：换班申请。

## Rules

- 排班发布后修改必须保留审计。
- 已有 assignment 引用的 role 不能迁移到其他 team，避免既有排班形成
  `teamId` / `roleId` 跨团队组合。
- 通知失败不改变 assignment 状态。
- 会友只能确认或请假自己的 assignment。
- 请假和换班不自动完成替补，需要同工或规则确认。
- 已取消或已替补排班不能由会友继续确认或请假。
- `scheduled`、`confirmed`、`swap_requested` 占用成员时段；同一成员的这些
  assignment 不得重叠，相邻时段允许。
- `declined`、`covered`、`cancelled` 释放成员时段。
- assignment 有结束时间时必须晚于开始时间；没有结束时间时视为开始时刻
  上的单点安排。
- 同一成员的 availability 记录不得重叠，且结束时间必须晚于开始时间。
- 成员只能提交自己的确认、请假、可用时间和 `checked_in` intent，不能伪造
  到岗时间或写入 `pending` / `missed`。
- `checked_in` 必须有服务器拥有的时间；`pending` 和 `missed` 不保留
  `checkedInAt`。管理员更正到岗状态也必须遵守此不变量。
- 成员不能把管理员标记的 `missed` 覆盖回 `checked_in`；管理员更正既有状态
  或签到时间必须保存原因和操作者。
- 并发排班和 availability 写入必须在 repository transaction 内按成员串行，
  service decision 在锁内验证后才能落库。

## Used By

- serving schedule。
- notification delivery。
- ministry analytics。
