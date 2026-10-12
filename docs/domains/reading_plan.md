# Reading Plan Domain

状态：个人计划实例、可复用模板、进度和执行历史已接入

## Purpose

定义个人读经计划、可复用模板、每日经文引用和完成进度的共享规则。该 domain 连接后端计划和 App 本地圣经文本，但不改变圣经文本 source of truth。

## Source Of Truth

后端 reading plan repository 拥有计划、每日引用、分配和进度。圣经正文归 App 本地 public-domain 或已授权 Bible 数据。

## Core Concepts

- Plan：可供个人采用的读经或灵修计划模板。
- Plan day：计划中的一天，包含一个或多个 scripture reference。
- Scripture reference：bookId、chapter 和 verse range。
- Assignment：某位用户加入或收到分配后形成的个人计划实例。
- Attempt：同一用户重复执行同一计划时的独立 assignment 次数。
- Progress：用户在计划和每日任务上的完成状态。

## Rules

- 后端不得保存圣经正文作为计划内容。
- Scripture reference 必须能被 App 本地经文库解析。
- 未登录用户可阅读公开计划；跨设备进度需要会员身份或受控 external user id。
- Study 首页以个人 assignment 为展示依据，不得因存在 published template 就默认展示或开始计划。
- 新计划只能从 draft 开始；发布要求存在连续完整的 `1..durationDays` 日程。
- published/archived 内容不能原地修改；日程只能在 draft/paused 编辑且不得越界。
- 首个 assignment 后锁定 days、durationDays、visibility 和 locale；标题与说明可在 paused/draft 修正。
- progress 只在 plan 为 published 且 assignment 非 paused/completed/abandoned 时可写。
- 完成同一天必须幂等。
- 当前分配对象是具体 member 或 external user；group/course/discipleship 只可作为来源归因，不能当成已完成的批量受众分配。
- member assignment 必须引用真实 member；存在进行中 assignment 时，同一 plan/user 的重复或并发分配必须返回同一 assignment。
- completed/abandoned assignment 是不可变历史；重新开始创建递增 attempt。
- 历史标题和总天数读取 assignment 创建快照，完成/放弃时间读取 backend-owned `endedAt`。
- 计划创建/更新、日程 upsert 和 Admin 个人分配必须审计。

## Used By

- reading plan。
- bible tts。
- bible verse notes。
- ai bible study。
- discipleship journey。
- group ministry。
- course learning。
- notification delivery。
