# Features

状态：业务闭环文档入口

`docs/features/` 只放完整业务闭环。Feature 不是页面、按钮、API、数据库表、上传动作或组件。

阶段二和三阶段第一版当前落地状态见
[../stage_two_status.md](../stage_two_status.md)。全 feature 精修完成度审计见
[../feature_completion_audit.md](../feature_completion_audit.md)。单个 feature 的最新状态以对应
feature 文档顶部 `状态` 行为准；跨 feature 是否达到上线测试标准，以完成度审计表为当前基线。

## 1. Feature Boundary

一个 feature 必须同时具备：

- 一个清晰用户或管理员目标。
- 一个最终业务 owner。
- 一个 source of truth。
- 一个状态模型。
- App / Admin Web / Backend API / local tool 的边界。
- 用到的 domain rule。
- 用到的 capability contract。
- 主链路和失败链路。
- lifecycle 和 recovery。
- 验证清单。

缺少这些内容时，应该放到 `docs/surfaces/`、`docs/domains/`、`docs/capabilities/`、`docs/api.md` 或 SDK 文档里。

## 2. Foundation Feature Docs

- [event_registration.md](event_registration.md)：活动报名闭环。
- [sermon_publishing.md](sermon_publishing.md)：讲道上传、处理、审核、发布闭环。
- [giving_flow.md](giving_flow.md)：奉献付款和交易确认闭环。
- [annual_statement.md](annual_statement.md)：年度证明生成、下载、分享闭环。
- [bible_tts.md](bible_tts.md)：圣经文字朗读闭环。
- [bible_verse_notes.md](bible_verse_notes.md)：经文公开心得闭环。
- [ai_content_assist.md](ai_content_assist.md)：后台 AI 内容草稿辅助闭环。
- [ai_bible_study.md](ai_bible_study.md)：会友 AI 查经辅助闭环。
- [content_localization.md](content_localization.md)：教会内容手工与 AI 翻译、版本校验和公开读取投影闭环。
- [public_landing_publishing.md](public_landing_publishing.md)：官网配置、固定日程、人员介绍和近期活动聚合闭环。

## 3. Stage Two Feature Catalog

第二阶段 feature 已完成第一版 core/features 架构接入，后续精修不再横向堆新页面，
而是围绕高风险闭环、App 高频体验、Admin 运营效率和真实环境验收继续打磨。每个
文档都要说明 App、Admin Web、Backend API、local tool、domain、capability、权限、
审计和验证链路。

| Feature | Business Chain | Primary Surfaces |
| --- | --- | --- |
| [sermon_discovery.md](sermon_discovery.md) | 讲道搜索、系列、讲员、主题和经文关联 | App Sermons, Admin Content, Backend API |
| [church_life_publishing.md](church_life_publishing.md) | 公告、周报、生活内容草稿、审核、发布和归档 | App Life, Admin Content, Backend API |
| [event_attendance.md](event_attendance.md) | 活动签到、手动补签、出席状态和导出 | App Life/Mine, Admin Ministry, Backend API |
| [group_ministry.md](group_ministry.md) | 小组/团契资料、申请、成员、可见性和归档 | App Life/Mine, Admin Ministry, Backend API |
| [serving_schedule.md](serving_schedule.md) | 服事岗位、排班、确认、请假、换班和提醒 | App Life/Mine, Admin Ministry, Backend API |
| [course_learning.md](course_learning.md) | 课程、课次、报名、资料、出勤和学习进度 | App Life/Mine, Admin Ministry, Backend API |
| [prayer_moderation.md](prayer_moderation.md) | 代祷提交、审核、可见性、隐藏和归档 | App Life/Mine, Admin Ministry, Backend API |
| [giving_funds.md](giving_funds.md) | 奉献用途、专项基金、启停、目标和统计 | App Mine, Admin Giving, Backend API |
| [member_profile.md](member_profile.md) | 会员资料、身份、通知偏好和设备 token | App Mine, Admin People, Backend API |
| [pastoral_care.md](pastoral_care.md) | 关怀请求、负责人、跟进记录、隐私等级和审计 | App Mine, Admin People, Backend API |
| [notification_delivery.md](notification_delivery.md) | 通知偏好、发送任务、投递状态、失败重试和审计 | App Mine, Admin System, Backend service |
| [ministry_analytics.md](ministry_analytics.md) | 后台聚合指标、待处理事项、系统健康和数据看板 | Admin Dashboard, Backend API |

这些名称是稳定 `feature_id`。对应文档必须使用 `snake_case.md`，例如 `sermon_discovery.md`。

## 4. Stage Three Growth Feature Catalog

第三阶段 feature 围绕教会门徒成长主线，不新增随意 App tab，也不重建已有小组、
课程、服事或讲道系统。当前第一版已接入新人跟进、成长路径、读经计划和讲道讨论包
基础闭环；后续精修必须引用已有 feature 的 canonical state。

| Feature | Business Chain | Primary Surfaces |
| --- | --- | --- |
| [discipleship_journey.md](discipleship_journey.md) | 成长路径、阶段、任务引用、分配、进度和负责人跟进 | App Mine/Life, Admin People/Ministry, Backend API |
| [newcomer_followup.md](newcomer_followup.md) | 新朋友资料、分配、跟进、邀请、转会员和进入成长路径 | Public Web/App, Admin People, Backend API |
| [reading_plan.md](reading_plan.md) | 读经计划、每日经文引用、分配、提醒和完成进度 | App Study/Mine, Admin Content/Ministry, Backend API |
| [sermon_discussion_guide.md](sermon_discussion_guide.md) | 讲道讨论包、问题、行动回应、小组使用和个人回应 | App Sermons/Life, Admin Content/Ministry, Backend API |

已有 feature 的三阶段增强：

- `group_ministry` v2：小组长工作台、出席、关怀提醒、小组材料和小组通知，仍归 [group_ministry.md](group_ministry.md)。
- `serving_schedule` v2：换班替补、可用性、导出、提醒 dedupe 和主日到岗，仍归 [serving_schedule.md](serving_schedule.md)。

## 5. Required Template

每个 feature 文档必须包含：

```text
Feature Goal
Non-Goals
Owners
Source Of Truth
State Model
Capability Contracts
App Surface Boundary
Admin Web Surface Boundary
Backend Service Boundary
Side Effects
Lifecycle And Recovery
Error Model
Main Logic Chain
Failure Chains
Verification Checklist
Related Docs
```

## 6. Integration Rule

新增或修改 feature 时，必须同步：

- [../core/feature_integration.md](../core/feature_integration.md)
- 相关 `docs/domains/*.md`
- 相关 `docs/surfaces/*.md`
- 相关 `docs/capabilities/*.md`
- `docs/api.md`
- `docs/database.md`
- `docs/sdk.md` 或相关 SDK 文档
