# Domains

状态：共享领域模型入口

`docs/domains/` 描述多个 feature 共享的业务概念和规则。Domain 不是页面，不是 API，也不是外部 provider。Domain rule 必须能脱离 UI、storage、network 和 provider SDK 被理解和测试。

## 1. Domain Boundary

Domain 负责：

- 定义共享业务语言。
- 定义状态含义。
- 定义跨 feature 复用规则。
- 定义隐私、可见性、金额、审计等一致性。

Domain 不负责：

- 页面布局。
- provider SDK 调用。
- HTTP route 细节。
- 具体数据库 SQL。
- App 或管理 Web 交互细节。

## 2. Current Domains

- [member_identity.md](member_identity.md)：会员身份和角色。
- [content_visibility.md](content_visibility.md)：内容可见性。
- [bible_content.md](bible_content.md)：圣经文本、版本和版权边界。
- [media_asset.md](media_asset.md)：媒体文件和对象存储元数据。
- [giving_finance.md](giving_finance.md)：奉献财务、费用、退款、争议和年度总额。
- [audit_log.md](audit_log.md)：审计事件。
- [privacy.md](privacy.md)：隐私和敏感数据分类。
- [ministry_group.md](ministry_group.md)：小组/团契、申请、成员和可见性。
- [serving_schedule.md](serving_schedule.md)：服事团队、岗位、排班和确认。
- [course_learning.md](course_learning.md)：课程、课次、报名、资料、出勤和进度。
- [event_attendance.md](event_attendance.md)：活动签到、出席状态和补签规则。
- [pastoral_care.md](pastoral_care.md)：关怀请求、跟进记录和隐私等级。
- [giving_fund.md](giving_fund.md)：奉献用途、专项基金和交易归属。
- [notification_preference.md](notification_preference.md)：通知偏好、频道和设备 token。
- [analytics_metrics.md](analytics_metrics.md)：后台聚合指标和看板口径。
- [discipleship_journey.md](discipleship_journey.md)：门徒成长路径、任务引用和进度。
- [newcomer_followup.md](newcomer_followup.md)：新朋友、跟进、负责人和转会员边界。
- [reading_plan.md](reading_plan.md)：读经计划、经文引用和完成进度。
- [sermon_discussion_guide.md](sermon_discussion_guide.md)：讲道讨论包、问题、行动回应和可见性。

## 3. Rule

当一个业务规则被两个以上 feature 使用时，优先放进 domain 文档，再由 feature 引用。
