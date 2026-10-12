# Discipleship Journey Domain

状态：三阶段第一版已接入

## Purpose

定义门徒成长路径、阶段、任务引用和成员进度的共享语言。该 domain 让新人跟进、读经计划、讲道讨论、小组、课程和服事都能被成长路径引用，但不让成长路径复制它们的业务数据。

## Source Of Truth

后端 discipleship journey repository 拥有路径模板、阶段、任务引用、分配和进度。被引用资源仍由原 feature repository 拥有。

## Core Concepts

- Journey template：一条可分配的成长路线，例如新人路径、受洗预备、会员路径或同工路径。
- Stage：路径中的阶段，例如认识教会、福音基础、加入小组、参与服事。
- Task reference：指向其他 feature 的稳定引用，例如 reading plan、sermon、course、group application 或 manual review。
- Assignment：某个新人或会员被分配到某条路径。
- Progress：成员在阶段和任务上的当前状态。

## Rules

- 成长路径只保存引用和进度，不复制圣经正文、讲道内容、课程资料、小组成员或服事排班。
- 一个任务必须有明确 owner feature，不能指向无法验证的自由文本。
- 需要人工确认的任务必须进入 `needs_review`，不能由 App 自动完成。
- 路径完成不自动授予角色或权限，只能产生推荐或管理员待处理动作。
- 管理员跳过、重置或手动完成任务必须写审计。

## Used By

- discipleship journey。
- newcomer follow-up。
- reading plan。
- sermon discussion guide。
- group ministry。
- course learning。
- serving schedule。
- pastoral care。
