# Member Profile

状态：资料、通知权限入口、Admin 会员管理和注册策略基础闭环已接入；认证链路见 `member_auth.md`

## Feature Goal

让会友注册、登录、查看和维护基础个人资料、系统通知权限入口和设备绑定，让后台维护会员身份、角色、状态和注册策略。

## Non-Goals

- 不把 App 个人资料缓存当作会员 source of truth。
- 不让会友自行授予角色或财务权限。
- 不收集超出教会使用目的的敏感信息。

## Owners

- Product owner：会员管理同工。
- Backend owner：member profile service。
- Surface owners：App Mine，Admin People。

## Source Of Truth

会员资料、角色、状态、注册策略、通知偏好和设备 token 绑定以后端 member repository / settings repository 为准。

## State Model

- member：`active`、`pending`、`inactive`、`blocked`
- device token：`registered`、`revoked`、`expired`
- preference：`enabled`、`disabled`
- registration mode：`open`、`closed`、`admin_only`
- email verification：由 `member.requireEmailVerification` 控制，不能写死在 App；生产环境必须先配置 `email_delivery` capability，未配置时后端拒绝注册而不伪造已发送状态。
- email verification challenge：后端以服务端密钥 HMAC 保存验证码校验值；每个 challenge 最多五次错误尝试，达到上限后只能重新注册获取新验证码。
- password credential：由后端保存 password hash，App 只提交明文密码到认证接口，不能存 hash。
- registration commit：直接注册必须在同一事务创建 `users`、`member_profiles` 和 password credential；验证码注册必须锁定 challenge，在同一事务消费 challenge 并创建完整账号。

## Capability Contracts

- `notification_delivery` 用于设备 token 投递。

## App Surface Boundary

App 展示我的资料、偏好、系统通知权限入口、设备绑定、Mine 教会生活状态聚合和登出。认证入口由独立 `member_auth` feature 承担。access token 和离线 session profile 只进入 secure storage；401、403、session invalid 或会员停用时必须清除本地 session，只有网络或服务暂时失败时才能使用安全缓存。App 只能写会友自助字段：姓名、电话、地址、信仰年份、受洗年份、加入教会日期、紧急联系人和 locale。App 不写角色、高权限状态、小组成员关系、课程报名状态、服事排班状态或关怀最终状态。

## Admin Web Surface Boundary

后台维护会员资料、角色、状态、备注、导出、权限和注册设置。会员列表只返回姓名、邮箱、状态、角色、locale 和小组归属等运营摘要；电话、地址、紧急联系人和通知偏好只在管理员明确打开单条详情后返回。注册设置包括：是否开放 App 注册、是否需要邮箱验证、是否需要管理员审核、注册提示文案。

## Backend Service Boundary

后端负责身份、注册策略、角色、设备 token、通知偏好、权限和审计。`users` 与 `member_profiles` 的创建和更新必须在同一事务中完成，不能留下半份会员资料。

验证码注册的 HMAC 比较、失败次数检查/递增、challenge 锁定、账号与 password credential
创建以及 challenge 消费必须由 `MemberAuthRepository.completeRegistration` 在同一事务中完成。
Service 不得先在事务外判断验证码正确后再提交建号。管理员创建会员或修改邮箱时，repository
必须把数据库唯一约束冲突归一化，由 service 返回稳定的 `member_email_conflict`，不能泄漏原始
SQL 错误。

## Side Effects

- 设备 token 注册和注销。
- 偏好变更审计。
- 会友自助资料变更审计。
- 管理员会员列表和单条详情读取审计；搜索正文、地址、电话和紧急联系人不得写入审计 metadata。
- 会员导出。

## Lifecycle And Recovery

登录注册设备 token，登出注销 token。token 投递失败后可标记 expired。会员停用或封锁通过 `inactive` / `blocked` 状态保留记录，不提供普通后台硬删除，不删除财务、审计、通知、经文心得或其他关联历史。

## Error Model

- `member_not_found`
- `member_registration_unavailable`
- `member_permission_denied`
- `member_device_token_invalid`
- `member_preference_invalid`

## Main Logic Chain

注册链：后台设置注册策略 -> App 读取公开设置 -> 会友提交邮箱和密码 -> 后端按策略返回验证码、待审核或 session -> App 保存 session 或展示待审核状态。

登录链：会友输入邮箱和密码 -> App repository 调用 `POST /v1/member/auth/login` -> 后端验证 password hash 和会员状态 -> App 保存 session -> 设备 token 同步。

资料链：会友登录 -> 后端返回 profile -> App Mine 展示资料、身份 chips 和入口 -> 会友更新允许字段 -> 后端保存 canonical profile -> 审计记录变更 -> App 刷新 session profile。

后台读取链：管理员读取最小会员列表 -> 选择一名会员 -> 单条详情接口重新校验 `users:read` -> 返回完整资料 -> 两次读取分别写入不含原始个人资料的审计记录。

## Failure Chains

- token 注册失败不阻断登录。
- 无权限字段更新被拒绝。
- 会员停用或封锁后无法访问会友专属内容。
- 注册关闭时新邮箱不能创建会友，已有会友仍可账号密码登录。
- 邮箱验证关闭时注册不能继续要求验证码。
- 邮箱验证码不能作为普通登录通道绕过密码。
- 同一个验证码 challenge 连续五次错误后必须被拒绝，不能继续猜测或改用正确验证码。
- 并发提交错误验证码时也必须逐次锁定并累计失败次数，不能让同时到达的正确验证码绕过上限。
- 同一个有效验证码并发提交时只能有一个请求完成建号；其他请求返回无效 challenge，不能创建第二个账号。
- 注册关闭时验证 challenge 不得先被消费；重新开放后仍可在有效期内完成。
- 公开注册冲突和密码登录失败不得通过错误 evidence、邮箱正文或“账号没有密码”等专用错误暴露邮箱是否存在。
- 生产环境未配置邮件 provider 时，开启邮箱验证的注册请求返回 `member_email_verification_unavailable`，不会创建待验证注册。
- 邮件 provider 发送失败后 challenge 必须失效，不能留下可被验证的未投递验证码。
- App 收到终止性 session 错误时清空 secure storage；暂时性 provider/network 失败可以显示安全缓存，但缓存不成为 source of truth。
- 后台不能通过硬删除绕过停用、封锁、关联历史和保留规则。
- 会员列表不能为了通知偏好筛选而退回完整 profile；通知收件人使用 repository 专用 eligibility 查询。

## Verification Checklist

- 角色只由后端/admin 修改。
- 注册开关由后台设置控制，App 不能写死。
- 自助资料更新不能修改角色、状态、奉献权限或小组归属。
- 设备 token 登出后注销。
- 通知偏好影响后续投递。
- 高风险资料变更有审计。
- 自助资料审计只保存字段是否存在，不保存地址、紧急联系人、信仰/受洗年份或加入教会日期原值。
- 注册、password credential 和验证码消费不存在半成功状态。
- 验证码尝试上限在 repository 事务内执行；并发管理员邮箱冲突返回稳定业务错误。
- App 不在 SharedPreferences 保存会员 profile，旧明文缓存会一次性迁入 secure storage 并清除。
- 会员列表和详情读取有最小化审计，且列表响应不含电话、地址、紧急联系人或通知偏好。
- 后台只通过状态停用/封锁会员，不存在普通会员硬删除 route。

## Related Docs

- [../domains/member_identity.md](../domains/member_identity.md)
- [../domains/notification_preference.md](../domains/notification_preference.md)
- [../domains/privacy.md](../domains/privacy.md)
- [../capabilities/email_delivery.md](../capabilities/email_delivery.md)
