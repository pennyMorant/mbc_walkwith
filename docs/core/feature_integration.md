# Feature Integration

状态：feature 接入 core 的规则

Feature 不是页面、按钮、API、表或组件。Feature 是一个用户或管理员可以完成的业务闭环。

## 1. Feature Definition

一个完整 feature 必须同时具备：

- 清晰业务目标。
- 唯一业务 owner。
- source of truth。
- 状态模型。
- App / Admin Web / Backend API / local tool 的 surface 边界。
- capability contract。
- domain rule。
- 主链路。
- 失败链路。
- lifecycle 和恢复路径。
- 验证清单。

缺少这些内容时，它只是一个页面、能力或实现细节，不是完整 feature。

## 2. Integration Template

每个 `docs/features/*.md` 必须包含：

```text
1. Feature Goal
2. Non-Goals
3. Owners
4. Source Of Truth
5. State Model
6. Capability Contracts
7. App Surface Boundary
8. Admin Web Surface Boundary
9. Backend Service Boundary
10. Side Effects
11. Lifecycle And Recovery
12. Error Model
13. Main Logic Chain
14. Failure Chains
15. Verification Checklist
16. Related Docs
```

## 3. Integration Flow

接入新 feature 时按顺序做：

1. 在 `docs/features/` 写 feature 文档。
2. 在 `docs/domains/` 确认共享业务规则是否已有 owner。
3. 在 `docs/capabilities/` 确认外部能力是否已有 contract。
4. 在 `docs/surfaces/` 确认 App、Admin Web、Backend API 入口边界。
5. 更新 `docs/api.md`、`docs/database.md`、`docs/sdk.md` 或对应 SDK 文档。
6. 代码实现按 owner 分层。
7. 验证主链路和失败链路。

## 4. Feature Boundary Test

如果一个文档只描述以下内容，它不应该放在 `docs/features/`：

- 单个页面。
- 单个 API。
- 单个数据库表。
- 单个上传动作。
- 单个 provider SDK。
- 单个 UI 组件。
- 单个后台任务。

这些内容应该放到 surface、capability、domain、SDK 或 API 文档里。

## 5. Feature Release Map

Feature release map 只定义业务闭环的边界和阶段，不替代 `docs/features/*.md` 的完整 feature 文档。

第一批基础 feature：

- [event_registration.md](../features/event_registration.md)：活动报名闭环。
- [sermon_publishing.md](../features/sermon_publishing.md)：讲道上传、处理、审核、发布闭环。
- [giving_flow.md](../features/giving_flow.md)：奉献付款和交易确认闭环。
- [annual_statement.md](../features/annual_statement.md)：年度证明生成、下载、分享闭环。
- [bible_tts.md](../features/bible_tts.md)：圣经文字朗读闭环。

第二阶段 feature：

- [sermon_discovery.md](../features/sermon_discovery.md)：讲道搜索、系列、讲员、主题和经文关联闭环。
- [church_life_publishing.md](../features/church_life_publishing.md)：公告、周报、生活内容的草稿、审核、发布和归档闭环。
- [public_landing_publishing.md](../features/public_landing_publishing.md)：官网配置、固定日程、人员介绍和近期活动聚合闭环。
- [event_attendance.md](../features/event_attendance.md)：活动签到、手动补签、出席状态和导出闭环。
- [group_ministry.md](../features/group_ministry.md)：小组/团契资料、申请、成员、可见性和归档闭环。
- [serving_schedule.md](../features/serving_schedule.md)：服事岗位、排班、确认、请假、换班和提醒闭环。
- [course_learning.md](../features/course_learning.md)：课程、课次、报名、资料、出勤和学习进度闭环。
- [prayer_moderation.md](../features/prayer_moderation.md)：代祷提交、审核、可见性、隐藏和归档闭环。
- [giving_funds.md](../features/giving_funds.md)：奉献用途、专项基金、启停、目标和统计闭环。
- [member_profile.md](../features/member_profile.md)：会员资料、身份、通知偏好和设备 token 闭环。
- [pastoral_care.md](../features/pastoral_care.md)：关怀请求、负责人、跟进记录、隐私等级和审计闭环。
- [notification_delivery.md](../features/notification_delivery.md)：通知偏好、发送任务、投递状态、失败重试和审计闭环。
- [ministry_analytics.md](../features/ministry_analytics.md)：后台聚合指标、待处理事项、系统健康和数据看板闭环。

第三阶段成长主线 feature：

- [discipleship_journey.md](../features/discipleship_journey.md)：成长路径、阶段、任务引用、分配和进度闭环。
- [newcomer_followup.md](../features/newcomer_followup.md)：新朋友资料、分配、跟进、邀请和转会员闭环。
- [reading_plan.md](../features/reading_plan.md)：读经计划、每日经文引用、分配、提醒和完成进度闭环。
- [sermon_discussion_guide.md](../features/sermon_discussion_guide.md)：讲道讨论包、问题、行动回应、小组使用和个人回应闭环。

第三阶段增强不新增 feature id：

- 小组长工作台属于 `group_ministry` v2。
- 服事排班深化属于 `serving_schedule` v2。

## 6. Surface Placement Rule

移动 App 继续保持四个主入口：

```text
Study     bible_tts, sermon scripture links
Sermons   sermon_publishing read side, sermon_discovery
Life      church_life_publishing, event_registration, event_attendance,
          group_ministry, course_learning, serving_schedule, prayer_moderation,
          newcomer_followup, discipleship_journey, sermon_discussion_guide
Mine      member_profile, giving_flow, giving_funds, annual_statement,
          serving_schedule, notification_delivery, pastoral_care,
          discipleship_journey, reading_plan
```

管理 Web 继续保持六个工作区：

```text
Dashboard   ministry_analytics, jobs, audit alerts
Content     sermon_publishing, sermon_discovery, church_life_publishing, bible resources
Ministry    event_registration, event_attendance, group_ministry,
            course_learning, serving_schedule, prayer_moderation,
            discipleship_journey, reading_plan, sermon_discussion_guide
Giving      giving_flow, giving_funds, annual_statement
People      member_profile, pastoral_care, newcomer_followup,
            discipleship_journey, admin users
System      notification_delivery, settings, jobs, audit
```

新增 feature 不得因为入口多而新增随意的 App tab 或后台顶层菜单。入口归 surface，业务闭环归 feature。

## 7. Stage Two Integration Order

第二阶段按以下顺序接入：

1. 更新 feature、domain、capability、surface、API、database 和 SDK 文档。
2. 先实现后端 contract、repository、service、权限和审计。
3. 再实现管理 Web 的创建、维护、审核、导出和追踪能力。
4. 最后接入 App 的读取、提交、状态展示和恢复动作。
5. 对每个 feature 分别验证主链路、失败链路、权限链路和审计链路。

不能先做 App UI 再反推后端状态。App 和 Admin Web 都只是 surface，最终状态必须以后端 source of truth 为准。
