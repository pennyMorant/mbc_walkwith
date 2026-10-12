# Course Learning

状态：二阶段第一版已接入

## Feature Goal

让同工管理课程、课次、报名、资料和出勤，让会友报名课程并查看学习进度。

第一版已落地课程、课次、报名和学习进度闭环；资料上传、课程提醒和逐课次出勤属于后续 object storage / notification / attendance 能力阶段。

## Non-Goals

- 不做通用在线教育平台。
- 不处理活动一次性报名，活动归 `event_registration`。
- 不公开报名名单给无权限用户。

## Owners

- Product owner：课程/主日学同工。
- Backend owner：course learning service。
- Surface owners：App Life/Mine，Admin Ministry。

## Source Of Truth

课程、课次、报名、资料授权、出勤和进度以后端 course repository 为准。第一版 source of truth 对应 `courses`、`course_lessons`、`course_enrollments`。

## State Model

- course：`draft`、`open`、`closed`、`in_progress`、`completed`、`archived`
- enrollment：`submitted`、`enrolled`、`waitlisted`、`cancelled`、`completed`
- lesson：`scheduled`、`published`、`completed`

状态转换由后端 service 统一校验：已归档课程、已完成课次、已取消或已完成报名均为终态；后台不能通过跳回旧状态绕过业务生命周期。

## Capability Contracts

- `object_storage` 用于课件资料。
- `data_export` 用于名单和出勤导出。
- `notification_delivery` 用于课程提醒。

## App Surface Boundary

App Life 向未登录访客展示公开课程目录和详情；登录会员可以提交报名 intent。App Mine 的课程数量和“我的课程”页面直接读取 `/me/courses`，不从公开目录推算历史报名。App 不决定报名和出勤最终状态。

App 课程目录和普通详情只展示 `open` 与 `in_progress` 课程；`draft`、`closed`、`completed`、`archived` 不进入目录。已报名会员可以继续从“我的课程”打开自己的历史课程详情，用于查看结课进度和课次记录。

## Admin Web Surface Boundary

后台维护课程、课次、报名名单和学习进度；每次 mutation 后重新读取 canonical course、lesson 或 enrollment 状态。课程切换会使旧页面操作上下文失效，迟到结果只刷新其资源缓存，不能覆盖当前课程表单或错误状态。资料、逐课次出勤、结课导出在后续阶段接入。

## Backend Service Boundary

后端负责报名规则、资料授权、出勤、进度、权限和审计。

## Side Effects

- 资料上传和签名访问。
- 课程提醒通知。
- 名单和出勤导出。

## Lifecycle And Recovery

课程可从草稿开放报名，开课后进入进行中，结课后归档。资料上传失败不改变课程发布状态。

## Error Model

- `course_not_found`
- `course_enrollment_closed`
- `course_enrollment_not_found`
- `course_lesson_not_found`
- `course_progress_out_of_range`
- `course_capacity_exceeded`
- `course_status_transition_invalid`
- `course_lesson_status_transition_invalid`
- `course_enrollment_status_transition_invalid`
- `course_enrollment_progress_unavailable`

## Main Logic Chain

后台创建课程和课次 -> 发布开放报名 -> App Life 展示公开/会员目录与详情 -> 会友提交报名 intent -> 后端事务内锁定课程并按容量写入 enrollment -> App Mine 从 canonical enrollment 展示当前和历史课程 -> 同工更新进度或结课。

## Failure Chains

- 报名关闭后拒绝新报名。
- 资料无权限时返回 denial，不暴露存储 URL。
- 重复报名返回当前 enrollment state。
- 并发报名在同一个数据库事务和课程行锁内完成容量判断，不能超卖。
- 候补、已取消或已提交状态不能写学习进度。
- 课程关闭后，同一用户对已有有效报名的重试仍返回 canonical enrollment；只有新报名 intent 被拒绝。
- 报名转为候补或取消等非学习状态时，后端在同一事务内把学习进度归零。
- 课程容量、课次状态和报名进度的校验与写入必须在各自数据库事务及行锁内完成。

## Verification Checklist

- 课程状态、报名状态、课次状态分离。
- 报名和进度修改有审计。
- 资料访问有签名和权限，后续接入 object storage 时必须补验证。
- App 我的课程来自 canonical enrollment。
- 匿名目录和详情不携带 bearer，会员目录、详情和我的课程按 session 携带 bearer。
- 畸形 course/lesson/enrollment projection 显示错误，不伪装为空列表。

## Related Docs

- [../domains/course_learning.md](../domains/course_learning.md)
- [../domains/member_identity.md](../domains/member_identity.md)
- [../capabilities/object_storage.md](../capabilities/object_storage.md)
