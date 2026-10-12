# Email Delivery

状态：会员注册邮箱验证码已接入 Resend provider。

## Purpose

封装邮箱验证码投递，不让注册 UI 或会员 service 自行调用邮件服务商。

## Owner

`backend/src/modules/members/auth/member-email-verification.provider.ts`。

## Contract

输入为收件邮箱、一次性验证码和有效期；输出仅表示投递成功或结构化失败。provider 不创建会员、不决定注册设置，也不记录明文验证码。

## Configuration

生产环境使用 Resend：`MEMBER_EMAIL_PROVIDER=resend`、`RESEND_API_KEY`、`MEMBER_EMAIL_FROM`，可选 `MEMBER_EMAIL_REPLY_TO` 和 `MEMBER_EMAIL_HTTP_TIMEOUT_MS`。

开发和测试环境使用显式开发 adapter，验证码只通过已有开发响应字段提供。生产未配置 provider 时，会员注册返回 `member_email_verification_unavailable`，不能返回“邮件已发送”。

## Errors

- `member_email_verification_unavailable`
- `member_email_delivery_failed`

## Rules

- 不记录或输出生产验证码。
- 不把 provider 密钥传给 App 或 Admin Web。
- provider 失败不创建可被用户误认为已送达的注册流程。

## Used By

- member profile registration。
