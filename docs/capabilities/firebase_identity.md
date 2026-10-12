# Firebase Identity

状态：Google 与 Apple 会员登录能力已接入，等待实际 Firebase 项目配置

## Purpose

Firebase Identity 只验证 Google/Apple 外部身份。它不拥有会员资料、角色、审批状态或 App 长期会话。

## Owners

- App adapter：`apps/mobile/lib/features/member_auth/data/member_federated_auth_service.dart`。
- Shared App initialization：`apps/mobile/lib/core/firebase/firebase_app_initializer.dart`。
- Backend verifier：`backend/src/modules/members/auth/firebase-identity.verifier.ts`。
- Identity binding repository：`backend/src/modules/members/auth/*member-auth.repository.ts`。

## Contract

```text
Google/Apple provider
-> Firebase Auth credential
-> short-lived Firebase ID token
-> POST /v1/member/auth/firebase
-> Firebase Admin verification
-> external identity resolution
-> backend MemberAuthSession or pending approval
```

App 完成 token 交换后清理 Firebase/Google 临时 session。`MemberSessionRepository` 只持久化后端签发的 MBCG token。

## Provider Setup

- 在同一个 Firebase project 中注册 Android package `org.mbcglendora.walkwith` 和 iOS bundle `org.mbcglendora.walkwith`。
- 运行 `flutterfire configure`，替换占位的 `lib/firebase_options.dart`，并完成 Android/iOS Firebase 原生配置。
- Firebase Authentication 中启用 Google 与 Apple provider。
- Android 配置签名证书 SHA-1/SHA-256，并通过 `--dart-define=GOOGLE_SERVER_CLIENT_ID=...` 提供 Firebase web OAuth client ID。
- iOS 把 Google `REVERSED_CLIENT_ID` URL scheme 配入 `Runner/Info.plist`；`firebase_options.dart` 的 `iosClientId` 用作客户端 ID。
- Apple Developer 与 Xcode target 启用 Sign in with Apple；仓库已包含 entitlement，Firebase 仍需 Apple provider 的 Team ID、Key ID 和 private key。
- 后端设置 `FIREBASE_SERVICE_ACCOUNT_JSON`；未设置时可复用 `FCM_SERVICE_ACCOUNT_JSON`。

客户端 Firebase 配置不是服务端密钥，可以随 App 构建；service account、Apple private key 和其他服务器凭据不得进入移动端或 Git。

## Rules

- 后端必须验证 token 签名、撤销状态、provider 与 verified email。
- 只有 `google.com` 和 `apple.com` token 可进入此链路。
- 首次绑定可按 verified email 关联现有会员；同会员同 provider 的不同 subject 不自动合并。
- 新用户遵守注册开放和管理员审批；已绑定用户不受“关闭新注册”影响。
- 外部 provider 故障不能破坏密码登录与访客模式。
- Firebase 明确拒绝、过期或撤销的 token 返回不可重试认证错误；网络、证书刷新和 provider 内部错误返回可重试的外部依赖错误。
- `MEMBER_AUTH_RATE_LIMIT_WINDOW_MS` 与 `MEMBER_AUTH_RATE_LIMIT_PER_WINDOW` 控制公开会员认证写接口的进程内限流。多实例部署前必须切换为共享限流存储。
- Android provider SDK 可能把部分配置错误报告成 `canceled`；App 对取消路径写不含邮箱、token 或 provider 响应正文的稳定诊断事件。

## Errors

- `firebase_not_configured`：App 缺少 FlutterFire 配置。
- `member_firebase_auth_unavailable`：后端缺少 Firebase Admin credential。
- `member_firebase_token_invalid`：token、provider 或 verified email 校验失败。
- `member_firebase_provider_unavailable`：Firebase 外部验证暂时失败，可稍后重试或改用密码登录。
- `member_auth_rate_limit_exceeded`：同一客户端认证尝试过于频繁，应按 `Retry-After` 等待。
- `member_firebase_identity_conflict`：同一会员/provider 出现不一致 subject，需要管理员处理。
- `member_registration_closed`：未绑定的新身份在关闭注册时尝试建号。

## Used By

- member auth 登录与注册。
- member session 创建。
- push notification 与认证共享 Firebase App 初始化，但不共享业务状态。
