# Stage Two Status

状态：第一版闭环完成，进入精修和真实环境验收阶段
最后核查：2026-06-30

本文档记录第二阶段 core/features 架构接入后的当前产品状态、验证结果、精修优先级
和上线前剩余事项。它不替代各 feature 文档；业务边界仍以 `docs/features/`、
`docs/domains/`、`docs/surfaces/`、`docs/capabilities/` 和 `docs/sdk/` 为准。

## 已落地闭环

### Backend

- 讲道、讲道讨论包、生活内容、代祷、奉献、年度证明、专项基金、活动报名/签到、小组、课程、服事、会员关怀、新人跟进、读经计划、成长路径、通知偏好、任务、审计均有 `/v1` API 或 admin API 基础闭环。
- 奉献链路以 Stripe Checkout 和 webhook 为交易 source of truth。
- 年度证明支持 CSV/PDF 输出。
- 关怀请求已区分 member summary 和 admin detail，App 不接收内部备注或跟进记录。
- 高风险写操作已有审计路径，审计 payload 避免保存代祷正文、关怀正文、内部备注和跟进正文。

### Admin Web

- Dashboard 显示基础指标、任务健康、运营关注点和二阶段事工工作区快捷入口。
- Content：讲道、讲道讨论包、生活内容、圣经知识、读经计划、经文心得审核。
- Ministry：活动报名/签到、小组、课程、服事、代祷。
- Giving：奉献交易、专项基金、对账、年度证明、provider events。
- People：会员基础管理、新人跟进、成长路径、关怀队列和跟进记录。
- System：设置、任务、审计。

### Mobile App

- Study：圣经阅读、搜索、读经辅助、TTS、读经计划、经文公开心得。
- Sermons：讲道列表、详情、文稿/经文引用、播放器状态、讨论包和 AI 学习辅助入口。
- Life：生活内容、活动报名、我的报名、二维码签到、代祷、小组、课程、服事、关怀、新朋友提交、奉献入口。
- Mine：会员登录、资料编辑、通知权限入口、奉献历史、年度证明、教会生活状态聚合、成长路径摘要、主题、字体和语言设置。
- 敏感数据边界：奉献交易、年度证明 PDF、私密代祷、关怀跟进记录不进入普通长期缓存。

## 当前验证

最近通过的验证命令：

```sh
bun run check
cd apps/admin_web && bun run build
flutter analyze
flutter test
git diff --check
```

本次文档状态核查还通过：

```sh
bun run check:contracts
bun run check:sdk-boundaries
bun run check:surfaces
bun run check:capabilities
```

验证结果：

- Backend tests：106 passed，1 skipped；skipped 项为未配置真实 `DATABASE_URL` 的 Postgres integration。
- Mobile tests：83 passed。
- Admin Web build：通过，有 Vite chunk size warning。

已知非阻断提醒：

- Flutter dependency outdated 提醒。
- `flutter_tts` 暂不支持 iOS Swift Package Manager；当前按既有约定暂不处理。
- Admin Web Vite chunk size warning；功能可构建，后续可按路由做 code splitting。

## 上线前剩余事项

- 在测试 VPS 上跑 Postgres 迁移、API、Admin Web 和移动端远程 API smoke。
- 配置真实或测试 Stripe secret、webhook secret、checkout success/cancel URL，并验证 webhook 幂等。
- 配置生产对象存储或 VPS 本地存储策略，确认讲道音频、图片、年度证明 PDF 的权限。
- 配置 Firebase/FCM 或选定通知 provider，验证设备 token 注册、注销和失败重试。
- 做管理员角色实测：owner、admin、pastor、finance、content editor、viewer。
- 做真机 App 测试：登录、活动报名/签到、奉献 checkout return、PDF 分享、TTS、关怀请求。
- 按 `docs/backend_release_checklist.md` 和 `docs/vps_deployment.md` 执行部署核查。
- 按 `docs/closure_validation_plan_zh.md` 执行测试环境闭环记录。

## 精修执行顺序

当前重点不是继续横向新增孤立 feature，而是把已有闭环做成真实教会可试用的产品：

1. P0 高风险闭环：奉献、年度证明、通知、活动报名/签到、会员资料、代祷隐私。
2. P1 App 高频体验：Study、Sermons、Life、Mine 的 MD3 视觉、状态、字体、多语言和未登录/已登录差异。
3. P2 Admin 运营体验：发布检查、筛选、导出、详情抽屉、二维码打印、财务对账、通知投递证据。
4. P3 成长主线联动：新人、读经计划、课程、小组、服事、成长路径和讲道讨论包之间的任务引用。
5. P4 真实环境验收：VPS、Stripe test、FCM、对象存储、Android release 和权限矩阵 smoke。

## 交接判断

第二阶段第一版已经具备“代码闭环可测试、可演示、可继续部署验证”的产品形态。下一步重点不再是补页面，而是按 [closure_validation_plan_zh.md](closure_validation_plan_zh.md) 用真实 VPS、真实环境变量、测试支付和真机 App 把后端、Admin Web、App 三端联调跑通。

## 三阶段规划入口

三阶段不把“小组、课程、服事、讲道、读经”重新做成平行系统，而是在二阶段闭环之上补齐门徒成长主线。

第一版已接入 feature：

- [features/discipleship_journey.md](features/discipleship_journey.md)：后端基础闭环、Admin Web 第一版和 App Mine 进度摘要已接入。
- [features/newcomer_followup.md](features/newcomer_followup.md)：后端基础闭环、Admin Web 第一版和 App Life 新朋友提交入口已接入。
- [features/reading_plan.md](features/reading_plan.md)：后端基础闭环、Admin Web 第一版、App Study 计划入口、Mine 进度摘要和完成进度提交已接入。
- [features/sermon_discussion_guide.md](features/sermon_discussion_guide.md)：后端基础闭环、Admin Web 管理入口、App 讲道详情读取讨论包和默认私密回应提交已接入。

三阶段增强仍归既有 feature：

- 小组长工作台归 [features/group_ministry.md](features/group_ministry.md) v2：Admin 材料分配和出席记录基础闭环已接入，小组长 App 权限链路待接入。
- 服事排班深化归 [features/serving_schedule.md](features/serving_schedule.md) v2：可用性和到岗基础闭环已接入，完整换班替补撮合待接入。
