# Course Learning

状态：二阶段第一版已接入

## Purpose

定义课程、课次、报名、资料、出勤和学习进度的共享规则。

## Source Of Truth

后端拥有 course、lesson、enrollment、material、attendance 和 progress。第一版已实现 course、lesson、enrollment 和 enrollment progress。

## Core Concepts

- `course`：课程或主日学项目。
- `lesson`：课程中的课次。
- `enrollment`：报名或候补状态。
- `material`：课件、讲义或附件。
- `attendance`：课次出席记录。
- `progress`：学习进度派生状态。

## Rules

- 课程资料必须按课程可见性和报名状态授权。
- 出勤由后台或授权同工维护，App 只展示。
- 报名状态和课次进度分离。
- 课程归档后保留历史报名和出勤。
- App 报名只是 intent；后端根据课程状态和容量返回 `enrolled` 或 `waitlisted`。
- 后台更新 `completedLessonCount` 时不能超过 canonical lesson count。
- 降低课程容量时不能小于当前 canonical `enrolledCount`。
- 候补转为已报名时必须重新检查容量。
- 重复有效报名返回已有 enrollment，不创建第二份 source of truth；并发容量判断必须在数据库事务内完成。
- 只有 `enrolled` 与 `completed` enrollment 可以持有学习进度。
- 有效报名重试先返回已有 canonical enrollment，不受课程之后关闭报名影响。
- 报名离开 `enrolled` / `completed` 学习状态时，canonical `completedLessonCount` 必须归零。
- 容量、状态转换和进度上限必须基于事务内锁定后读取的 canonical 状态决定。
- 已完成/已归档的历史课程只对仍有有效历史 enrollment 的会员可见，已取消报名不获得历史访问权。

## Used By

- course learning。
- event attendance。
- notification delivery。
- ministry analytics。
