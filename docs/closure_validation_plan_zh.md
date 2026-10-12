# MBC WalkWith 闭环验证方案

状态：执行入口  
最后更新：2026-06-25

本文档把当前产品从“代码已实现”推进到“测试环境可验收”和“生产上线可决策”。它不替代 feature 文档；业务边界仍以 `docs/features/`、`docs/domains/`、`docs/surfaces/`、`docs/capabilities/` 和 `docs/sdk/` 为准。

## 1. 闭环分层

MBC WalkWith 的闭环分三层判断：

| 层级 | 含义 | 当前判断 |
| --- | --- | --- |
| 代码闭环 | App、Admin Web、Backend API、contract、repository、测试都能串起来 | 已基本完成 |
| 测试环境闭环 | 真实 Postgres、测试 Stripe、Firebase/FCM、AI key、真机 App 都跑通过 | 待执行 |
| 生产闭环 | 域名 HTTPS、正式密钥、隐私/奉献/通知政策、备份和运维都确认 | 待决策和配置 |

当前阶段重点不是继续堆功能，而是执行测试环境闭环。

## 2. 执行顺序

按以下顺序推进，完成一项就记录结果：

1. 仓库本地核查。
2. 测试 VPS / Postgres 闭环。
3. Admin Web 闭环。
4. App 远程 API + 真机闭环。
5. Stripe 测试奉献闭环。
6. Firebase/FCM 通知闭环。
7. AI provider 闭环。
8. 讲道本地处理工作站闭环。
9. 上线前政策和运维闭环。

## 3. 本地仓库核查

必须通过：

```sh
bun run check
(cd apps/mobile && flutter analyze)
(cd apps/mobile && flutter test)
(cd apps/admin_web && bun run build)
git diff --check
```

当前最近核查结果：

- `bun run check`：通过。
- `flutter analyze`：通过。
- `flutter test`：83 tests passed。
- Admin Web build：通过，有 Vite chunk size warning。
- 后端测试：106 passed，1 skipped；skipped 项为缺少真实 `DATABASE_URL` 的 Postgres integration。

## 4. 功能闭环矩阵

| 功能 | 代码闭环 | 测试环境闭环 | 生产闭环判断 |
| --- | --- | --- | --- |
| 圣经阅读 / 搜索 / TTS | 已完成 | 真机验证 TTS、字体、离线文本 | 需确认圣经文本版权和版本策略 |
| AI 查经 | 已完成 | 配置 `AI_PROVIDER`、`AI_API_KEY` 后测试 | 需确认 AI 使用边界、提示文案和审计策略 |
| 讲道发布 | 已完成 | Postgres + 存储 + Admin 上传 + App 播放 | 需确认存储生命周期和内容审核流程 |
| 讲道本地处理 | 已完成本地工具链 | 本地工作站跑转录/大纲/经文引用后上传 package | 需明确同工操作手册和机器归属 |
| 讲道发现 | 已完成 | App 搜索、推荐、经文回跳真机测试 | 需长期维护标签、系列、讲员数据质量 |
| 生活内容发布 | 已完成 | Admin 发布，App 展示，图片/CTA 测试 | 需确认发布权限和内容审查责任 |
| 活动报名 | 已完成 | 真机报名、修改、取消、后台导出 | 生产可用 |
| 活动签到 | 已完成普通签到、二维码签到和 self check | App/Admin 签到动作实测，含现场二维码路径 | 需验收二维码打印、弱网异常处理和签到导出 |
| 小组 / 团契 | 已完成第一版 | App 申请，Admin 审核，Mine 状态同步 | 需确认小组可见性和成员数据维护流程 |
| 课程学习 | 已完成第一版 | App 报名，Admin 课次/学习进度维护 | 资料上传、逐课次出勤、结课导出后续接入 |
| 服事排班 | 已完成第一版 | App 确认/请假，Admin 排班维护 | 换班、提醒、导出后续接入 |
| 代祷 | 已完成 | App 提交，Admin 审核，App 可见性验证 | 需确认保留/归档/隐私政策 |
| 牧养关怀 | 已完成第一版 | App 提交，Admin 分派/跟进，App 状态查看 | 负责人提醒和会友状态通知后续接入 |
| 奉献付款 | 已完成代码链路 | Stripe test checkout + webhook signature + App return | 需教会财务和政策批准 |
| 专项基金 | 已完成 | Admin 启停/目标，App 选择基金奉献 | 需财务命名和会计归类确认 |
| 年度证明 | 已完成 CSV/PDF payload + App 临时文件分享 | 真机 PDF 打开/分享，后台生成/下载 | 长期可考虑对象存储签名 URL |
| 通知 | 已完成代码链路 | FlutterFire + FCM service account + 真机收推送 | 需 APNs、隐私文案、退订策略 |
| Admin Web | 已完成 | 用不同角色实测页面和后端权限 | 需 HTTPS、账号初始化、审计核查 |
| Dashboard / 任务 / 审计 | 已完成第一版 | 查看任务、审计、指标是否随操作变化 | 趋势、导出、运营指标后续增强 |

## 5. 测试环境闭环门槛

先运行 readiness 报告，明确缺口：

```sh
bun run release:readiness -- --env=backend/.env.production
```

正式上线或严格验收前使用 hard gate：

```sh
bun run release:readiness:strict -- --env=backend/.env.production
```

该脚本检查 Postgres、后端 auth secret、debug bypass、对象存储、Stripe、FCM、移动端 Firebase options 和 AI provider 配置。默认命令只报告缺口；strict 命令在缺少必要配置时失败。

### 5.1 后端和数据库

需要：

- 测试 VPS 或本地 Postgres。
- `DATABASE_URL`。
- `USE_MOCK_DATA=false`。
- `auth_secret` 和 `app_user_auth_secret` 不使用默认 dev 值。

执行：

```sh
DATABASE_URL=postgres://user@host:5432/mbc_walkwith_staging \
USE_MOCK_DATA=false \
bun run db:smoke
```

通过标准：

- Drizzle Kit migration 成功。
- admin login 成功。
- 讲道草稿、音频上传、本地 package 导入、发布、公开列表都成功。
- smoke 数据和上传音频清理成功。

### 5.2 Admin Web

执行：

- 登录后台。
- 逐个角色测试：owner、admin、pastor、finance、content editor、viewer。
- 确认菜单隐藏不是唯一权限；直接访问受限路由应被前端 guard 和后端权限拒绝。

关键动作：

- 讲道创建、音频上传、package 导入、发布。
- 生活内容创建、发布、选择是否通知 App。
- 活动报名名单查看、手动补签、导出。
- 代祷审核、隐藏、归档。
- 奉献交易、provider events、对账、年度证明。
- 通知任务 retry/cancel。
- 审计日志查看。

### 5.3 App 真机

需要：

- Android 或 iOS 真机。
- `API_BASE_URL` 指向测试 API。
- 默认不启用 `USE_MOCK_REMOTE_DATA`。

关键动作：

- 登录会员。
- 圣经阅读、搜索、TTS。
- 打开讲道、播放音频、从引用经文回跳圣经。
- 打开生活内容，报名活动，修改/取消，签到。
- 提交代祷。
- 查看小组、课程、服事、关怀状态。
- 发起奉献 checkout，返回 App 后刷新历史。
- 下载并系统分享年度证明 PDF。
- 修改通知偏好，注册/注销设备 token。

### 5.4 Stripe 测试奉献

需要：

- `STRIPE_SECRET_KEY`。
- `STRIPE_WEBHOOK_SECRET`。
- `GIVING_CHECKOUT_SUCCESS_URL`。
- `GIVING_CHECKOUT_CANCEL_URL`。

通过标准：

- App 创建 checkout session。
- Stripe Checkout 页面可打开。
- Stripe webhook 签名验证通过。
- `checkout.session.completed` 写入最终交易状态。
- 重复 webhook 被识别为 duplicate。
- `charge.succeeded` 写入 fee、net、payout。
- refund 和 dispute 事件进入对账状态。
- Admin Giving 显示 provider events 和 reconciliation。

### 5.5 Firebase / FCM 通知

需要：

- 运行 `flutterfire configure` 替换 `apps/mobile/lib/firebase_options.dart`。
- 后端配置 `FCM_SERVICE_ACCOUNT_JSON`。
- iOS 需要 APNs key、Push Notifications capability、Background Modes。

通过标准：

- App 启动后注册设备 token。
- 后端保存 guest/member device token。
- Admin 发布讲道后创建 inbox message 和 delivery task。
- Admin 发布 Life post 且 `notifyApp=true` 后真机收到通知。
- Admin 审核代祷且 `notifyApp=true` 后真机收到通用安全通知。
- 无效 token 能被撤销或标记失败。
- retry/cancel 操作有效。

### 5.6 AI Provider

需要：

- `AI_PROVIDER=openai`、`gemini` 或 `openai_compatible`。
- `AI_API_KEY`。
- `AI_MODEL`。
- 中转站需要 `AI_BASE_URL`，可选 `AI_EXTRA_HEADERS_JSON`。

通过标准：

- Admin AI status 显示 provider enabled。
- 后台内容草稿能生成。
- App 查经/讲道 AI 请求能返回结果。
- provider disabled/misconfigured 时错误结构清晰，App 和后台不崩。

## 6. 不能伪装成闭环的项目

以下项目不能在未配置真实环境前标成完成：

- Stripe 真实收款和 webhook delivery。
- FCM/APNs 真机推送。
- AI provider 实际请求。
- Postgres 生产数据迁移和 smoke。
- App Store / Google Play 发布。
- 域名 HTTPS。
- 正式隐私政策、使用条款、奉献说明和年度证明文案。

以下项目属于后续功能增强，不阻塞第一版闭环：

- 活动签到统计报表和更细的现场异常处理。
- 课程资料上传、逐课次出勤、结课导出。
- 服事换班、自动提醒、导出。
- 关怀负责人提醒和会友状态通知。
- Dashboard 趋势、快照、导出。
- 圣经文本后端 API、笔记/高亮/收藏云同步。
- 年度证明对象存储签名 URL。

## 7. 交接结论模板

每次闭环验证后，用这个格式记录：

```text
日期：
环境：
API URL：
Admin Web URL：
App build：

已通过：
- ...

未通过：
- ...

阻塞项：
- ...

下一步：
- ...
```

## 8. 当前结论

当前仓库已经达到“代码闭环可测试”状态。下一步应按本文档执行测试环境闭环：先跑 Postgres smoke，再做 Admin Web 和 App 真机远程 API 测试，最后接入 Stripe、FCM 和 AI provider 的真实测试配置。
