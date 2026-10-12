# Backend And Web Architecture

状态：后端 API、管理 Web 与公开 Web 架构规则

本文档说明 MBC WalkWith 后端、管理 Web 和公开 Web 的责任边界。后端是可信业务 owner；管理 Web 是管理员操作 surface；公开 Web 是访客 landing surface。

阅读前先看：

- [../core/README.md](../core/README.md)
- [../core/contracts.md](../core/contracts.md)
- [../core/feature_integration.md](../core/feature_integration.md)
- [../surfaces/admin_web.md](../surfaces/admin_web.md)
- [../surfaces/public_web.md](../surfaces/public_web.md)
- [../surfaces/backend_api.md](../surfaces/backend_api.md)

## 1. Backend Role

后端负责：

- `/v1` REST API。
- 管理员和会员认证。
- 权限、角色、可见性。
- 业务规则和状态迁移。
- Postgres 持久化。
- 对象存储元数据和签名访问。
- Stripe checkout、webhook、退款、费用、payout、争议和对账。
- 讲道、生活内容、活动、代祷、奉献、年度证明。
- 历史任务诊断和运维状态。
- 推送通知、审计日志和运维诊断。

后端不应该把核心规则放进 route handler、前端页面、SQL 片段或 provider callback 临时代码里。

## 2. Admin Web Role

管理 Web 负责：

- 登录和管理员会话展示。
- 内容、讲道、活动、代祷、奉献、通知、任务和审计的操作界面。
- 表格、筛选、表单、dialog、上传进度、错误反馈。
- 调用后端 admin API。

管理 Web 不负责：

- 直接连接 Postgres。
- 直接调用 Stripe secret API。
- 直接访问对象存储私有桶。
- 直接调用 AI、通知、转录或外部 provider。
- 自己判断最终财务、报名、发布或审核状态。

管理 Web 可以做表单级校验，但最终校验和状态迁移必须由后端 service 完成。

## 3. Public Web Role

公开 Web 负责：

- 展示教会宗旨、聚会信息、新朋友入口、App 引导、地图和联系入口。
- 通过 `GET /v1/public/landing?locale=...` 读取官网资源和 CTA action。
- 支持 English、Español、简体中文和繁體中文，首次进入跟随浏览器/系统语言。
- 在 API 不可用时展示明确错误状态。
- 提供现代、响应式、可访问的访客体验。

公开 Web 不负责：

- 后台内容审核。
- 活动报名容量、截止、取消和签到规则。
- 奉献付款确认。
- 会员身份、代祷隐私、通知投递。
- 管理员权限和审计。

公开 Web 不承载讲道消费、活动报名、个人通知或会员功能；这些深度功能进入 App。公开 Web 不能让本地 fallback 成为业务真相。

## 4. Backend Layers

推荐方向：

```text
route/handler
  -> service
  -> repository / gateway
  -> Postgres / object storage / Stripe / notification provider
```

职责：

- route/handler：HTTP surface，负责认证上下文、schema 校验、调用 service、格式化响应。
- service：业务规则 owner，负责状态迁移、权限含义、幂等策略、审计意图。
- repository：持久化 owner，负责 Postgres 或内存实现差异。
- gateway/adapter：外部系统边界，如 Stripe、object storage、notification。
- local workstation：讲道转录、大纲、经文引用等媒体处理生命周期 owner。
- contract/schema：请求、响应、DTO、错误格式 owner。

## 5. Source Of Truth

后端 source of truth：

- Postgres：会员、内容、讲道、活动、报名、代祷、奉献、年度证明、审计、任务状态。
- Object storage：音频、图片、PDF 等文件本体。
- Postgres file metadata：文件归属、权限、状态、checksum、object key。
- Stripe webhook processed state：奉献交易最终状态和 provider 事件。
- Jobs table：历史任务诊断和旧记录查询。
- Audit log：敏感后台动作记录。

不允许让 App、管理 Web、临时 JSON 文件或第三方 redirect success page 成为最终业务真相。

部署可以选择原生 Bun/systemd/Nginx 或可选 Docker/Compose adapter。两条路径必须共享
同一套 `/v1` contract、Drizzle schema/migrations 和环境变量含义；部署 adapter 不得复制
业务规则。容器反向代理必须通过显式 `TRUST_PROXY` 白名单接入，不能信任任意
`X-Forwarded-*` 来源。具体步骤见 [../docker_deployment.md](../docker_deployment.md)。

## 6. Services Own Rules

典型 service owner：

- auth/member service：会员身份、会话、设备绑定。
- sermon service：讲道草稿、上传、本地 package 导入、发布、下架、审核元数据。
- local sermon processing：本地转录、大纲、经文引用和 package metadata。
- life service：公告、周报、生活内容可见性。
- event service：活动、报名、候补、取消、签到。
- prayer service：代祷提交、审核、可见性、归档。
- giving service：checkout session、交易状态、退款、费用、争议、对账。
- statement service：年度证明生成、下载授权、PDF 状态。
- notification service：偏好、token、发送、失败重试。
- audit service：敏感操作记录。

Route 只转发 intent。Repository 只存取数据。Gateway 只接外部能力。规则归 service。

## 7. Admin Web Surfaces

管理 Web 页面只表达后端状态。

页面可以：

- 展示列表、详情、统计、历史任务诊断和本地处理链路状态。
- 提交表单和上传文件。
- 发起发布、归档、取消、重试、生成证明、导出等 intent。
- 展示后端返回的错误原因、证据和下一步。

页面不可以：

- 在浏览器端修改最终状态再假装成功。
- 用本地状态覆盖后端 canonical state。
- 绕过共享 API client。
- 把财务权限写成纯前端隐藏按钮。
- 在前端 bundle 中暴露 provider secrets。

## 8. Sermon Content Chain

讲道音频和文案应该由教会管理员上传或导入，并由后端统一管理。
转录、大纲、经文引用由本地工作站完成，VPS 后端只接收审核后的
local package。

链路：

```text
admin creates sermon draft
-> upload audio/text/metadata through admin API
-> backend stores file metadata and draft state
-> local workstation prepares transcript/outline/scripture references
-> admin uploads reviewed local package
-> backend publishes sermon
-> App reads public/member-visible sermon API
-> public Web may link users toward the App but does not list or play sermons
```

规则：

- 生成内容默认不发布。
- 文件私有访问必须通过后端授权。
- 发布、下架、删除、重新上传 package 要写审计。
- 本地处理失败留在本地修复；后端只接收审核包和保留历史诊断。

## 9. Event Registration Chain

活动报名由后端 `LifeEventRegistrationService` 拥有；自助签到、现场二维码和签到码轮换由
`LifeEventAttendanceService` 拥有。两者共享同一个活动报名事实表和活动级事务锁，不建立第二份
出席 source of truth。

链路：

```text
admin creates event
-> backend stores capacity/rules/visibility
-> App submits registration intent
-> registration service validates member, status, capacity, duplicate state
-> transaction-scoped registration repository writes atomically
-> App/admin Web refresh canonical registration state
```

必须处理：

- 未登录。
- 活动关闭。
- 名额已满。
- 重复报名。
- 取消后重新报名。
- 取消、重新报名和并发容量变化。
- 自助签到、二维码签到、签到码轮换和后台手动调整。

当前版本不启用候补；满员时返回稳定的容量错误，不创建隐式 waitlist 状态。

- 管理员手动调整和审计。

## 10. Giving And Finance Chain

奉献最终状态以后端根据 Stripe webhook 写入的记录为准。

链路：

```text
App requests checkout
-> backend creates pending gift and Stripe checkout session
-> Stripe handles payment
-> Stripe webhook arrives
-> backend verifies signature and idempotency
-> giving service records final status, fee, refund, dispute, payout data
-> finance admin sees reconciliation state
-> statement service generates annual PDF from confirmed gifts
```

规则：

- App success page 只能触发刷新，不能确认交易。
- Webhook 必须幂等。
- 费用、净额、payout、退款、争议属于财务记录，不影响会友年度证明的奉献总额展示。
- 财务导出和证明生成需要角色权限和审计。
- PDF 存对象存储，下载通过后端签名授权。

## 11. Prayer And Privacy Chain

代祷默认私密。

链路：

```text
member submits prayer
-> backend stores private/pending state
-> admin/pastor reviews if visibility expands
-> backend updates approved visibility
-> App reads only allowed requests
```

规则：

- 私密内容不能被普通管理页面或 App 缓存随意扩散。
- 小组、会友、公开可见性必须由后端权限判断。
- 审核、隐藏、归档需要审计。

## 12. Error And Audit Model

后端错误应包含：

- code/category。
- message。
- source layer。
- recoverability。
- retryability。
- evidence。
- next action。

高风险动作必须审计：

- 管理员登录失败和权限拒绝。
- 发布、下架、删除内容。
- 上传和替换讲道资源。
- 审核代祷。
- 财务查看、导出、生成证明。
- 退款、争议、对账状态变更。
- 通知群发。

## 13. Backend Verification

后端或管理 Web 改动至少按影响面验证：

- 后端：目标测试，必要时 `bun run test`。
- 管理 Web：`bun run typecheck`。
- 数据库：迁移检查和 smoke path。
- 脚本：`bash -n <script>`。

高风险链路必须额外验证：

- 权限失败路径。
- 重复提交和幂等。
- provider webhook 重放。
- 本地处理 package 缺失、重复上传和发布校验。
- audit log 是否记录。
- App 和管理 Web 是否都从后端 canonical state 刷新。

## 14. Related Feature Docs

- [../features/sermon_publishing.md](../features/sermon_publishing.md)
- [../features/event_registration.md](../features/event_registration.md)
- [../features/giving_flow.md](../features/giving_flow.md)
- [../features/annual_statement.md](../features/annual_statement.md)
