# Member Auth

状态：独立认证页面、密码恢复与 Firebase 联合登录闭环已接入

## Goal

让访客以清晰、可恢复且不泄漏账号状态的方式登录、注册和重设密码；认证不是 Mine 资料页的子功能。

## Owners

- App feature owner：`apps/mobile/lib/features/member_auth/`。
- Backend owner：`backend/src/modules/members/auth/`。
- Source of truth：后端用户、会员资料、password credential、session 与 challenge。

## App Flow

`/auth/login` 只收集并本地校验邮箱，不能请求后端探测账号。`/auth/password` 收集密码并调用 repository 登录；注册、邮箱验证和密码恢复各自使用根级二级路由。Mine 与其他受保护入口只打开登录路由。

认证页面使用统一的居中 MD3 壳层、MBCG 品牌图标、filled 输入框和共享 `AppButton`。邮箱页负责邮箱校验、创建账号和联合登录入口；密码页以可点击账号行显示当前邮箱，并提供密码可见性、忘记密码、提交 loading 和行内错误状态。认证路由使用短距离淡入位移动画，键盘出现时页面通过滚动与底部 inset 保持操作可达。

Google 与 Apple 登录由 Firebase Auth 完成客户端身份验证。App 只把短期 Firebase ID Token 交给 `MemberSessionRepository`；后端验证 token 后签发自己的会员 session。Firebase session 不能替代 MBCG session，也不能成为会员资料或权限的 source of truth。

登录页和注册页复用同一个 `MemberFederatedAuthActions`。provider 取消不显示错误；配置缺失、验证失败、待管理员审批必须呈现稳定状态。联合登录成功后与密码登录一样刷新 `memberSessionProvider` 并尽力同步当前设备 push token。

FlutterFire 客户端配置不存在时不显示联合登录入口，密码登录继续可用。公开认证写接口按客户端 IP 和操作类型限流；生产 API 只信任本机 nginx 代理提供的客户端地址。同一会员、IP 与 user agent 创建新会话时，后端原子撤销该客户端旧的有效会话，避免重复 token 交换持续堆积会话。

后端以 `provider + providerSubject` 识别外部身份。首次登录只在 Firebase 已验证邮箱时按邮箱关联现有会员；同一会员同一 provider 出现不同 subject 时必须拒绝自动关联并交由管理员处理。新会员仍遵守开放注册和管理员审批设置，关闭注册不能阻止已经绑定的会员登录。

## Password Recovery

恢复请求始终返回同形 challenge。只有 active 且有 password credential 的会员才会持久化 `password_reset` challenge；未知邮箱只得到不持久化的 dummy response。真实 reset challenge 的查询和创建必须在 repository 的单一临界区完成，同邮箱有效期内复用同一 challenge，重复或并发请求不会再次投递邮件。确认操作在同一 repository transaction 中校验/消费 code、更新 password hash、撤销该会员所有 session。未知邮箱、过期 code 与错误 code 不泄漏账号存在性。

## Boundaries

- UI 不直连 API，也不保存 token 或 password。
- `MemberSessionRepository` 是 App token、session 和 member auth request 的唯一 owner。
- 注册是否开放、邮箱验证和管理员审核只由后端 settings 决定。
- Firebase Admin credential 是后端 capability 配置，不进入 App、数据库或 API response。
- `member_external_identities` 只保存外部身份映射；`users`、`member_profiles` 和 `member_sessions` 仍是业务身份事实来源。
- 首次创建或关联外部身份必须写脱敏审计，只记录会员、provider 和创建/关联结果。
- 邮件是 capability，投递失败必须使对应 challenge 失效。

## Verification

- 邮箱页 Next 不触发认证请求。
- 密码成功登录后安全保存 session 并尽力同步设备 token。
- 重设密码后旧 session 必须失效，新密码可登录。
- 未知邮箱请求与有效邮箱请求返回相同公开形状。
- Google/Apple token 必须验证签名、撤销状态、provider 与 verified email。
- 首次联合登录、已有账号关联、关闭注册、待审批和身份冲突均有目标测试。
