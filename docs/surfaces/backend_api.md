# Backend API Surface

状态：后端 API 表达层边界

## Purpose

Backend API route 和 webhook handler 都是 surface。它们接收请求或事件，执行认证和 schema 校验，然后把 typed intent 交给 service。

## Can Do

- 解析 HTTP 请求。
- 绑定 actor context。
- 验证 request schema。
- 调用 service。
- 格式化 response。
- 映射 structured error。
- 记录 request correlation id。

## Must Not Do

- 把业务规则写在 route handler。
- 直接拼 SQL 执行业务状态迁移。
- 在 webhook handler 里散落财务规则。
- 绕过 service 写审计。
- 泄露 provider payload 中的敏感内容。

## Required Pattern

```text
route / webhook / callback
-> schema validation
-> actor/context binding
-> service method
-> repository / gateway
-> structured response/error
```

## Current Route Registry

当前真实 backend route、owner、shared contract、SDK 文档和 App/Admin client
入口登记在：

```text
packages/api_contracts/src/route-registry.ts
```

新增、删除或移动 route 后必须运行：

```sh
bun run check:contracts
```

当前 route registry 覆盖的 backend surface group：

| Surface group | Route scope | Contract owner |
| --- | --- | --- |
| Health | `/v1/health` | local diagnostic response |
| Public landing | `/v1/public/landing` | `public.ts` |
| Settings | `/v1/settings/public`, `/v1/admin/settings/*` | `settings.ts` |
| Admin auth | `/v1/admin/auth/*` | `auth.ts` |
| Member auth | `/v1/member/auth/*` | `auth.ts` |
| Sermons | `/v1/sermons/*`, `/v1/admin/sermons/*` | `sermons.ts` |
| Sermon discussion guides | `/v1/sermons/:sermonId/discussion-guide`, `/v1/sermon-discussion-guides/*`, `/v1/admin/sermon-discussion-guides/*` | `sermon-discussion-guides.ts`; public GET uses a service-owned projection without `generatedMetadata`, Admin routes use the complete schema |
| Life posts and events | `/v1/life/*`, `/v1/member/life/*`, `/v1/admin/life-posts/*` | `life.ts` |
| Prayer | `/v1/prayer-requests`, `/v1/member/prayer-requests/*`, `/v1/admin/prayer-requests/*` | `prayer.ts` |
| Giving | `/v1/member/giving/*`, `/v1/admin/giving/*` | `giving.ts` |
| Stripe webhook | `/v1/webhooks/giving/stripe` | `giving.ts` |
| Notifications | `/v1/app/devices/*`, `/v1/member/notifications/*`, `/v1/admin/notifications/*` | `push.ts` |
| AI | `/v1/admin/ai/*`, `/v1/member/ai/study` | `ai.ts` |
| Bible knowledge | `/v1/bible-knowledge`, `/v1/admin/bible-knowledge/*` | `bible-knowledge.ts` |
| Groups | `/v1/groups/*`, `/v1/me/groups`, `/v1/admin/groups/*` | `groups.ts` |
| Courses | `/v1/courses/*`, `/v1/me/courses`, `/v1/admin/courses/*` | `courses.ts` |
| Serving | `/v1/me/serving-assignments`, `/v1/me/serving-availability`, `/v1/me/serving-check-ins`, `/v1/serving-assignments/*`, `/v1/admin/serving/*` | `serving.ts` |
| Care | `/v1/me/care-requests/*`, `/v1/admin/care-requests/*` | `care.ts` |
| Newcomers | `/v1/newcomers`, `/v1/admin/newcomers/*` | `newcomers.ts` |
| Discipleship | `/v1/me/discipleship`, `/v1/admin/discipleship/*` | `discipleship.ts` |
| Reading plans | `/v1/reading-plans/*`, `/v1/me/reading-plans`, `/v1/admin/reading-plans/*` | `reading-plans.ts` |
| Members | `/v1/admin/members/*` | `members.ts` |
| Admin users | `/v1/admin/users/*` | `auth.ts` |
| Audit logs | `/v1/admin/audit-logs` | `audit.ts` |
| Dashboard | `/v1/admin/dashboard` | `dashboard.ts`；route 只绑定管理员角色，精确聚合、权限过滤和 stale snapshot 归 `MinistryAnalyticsService` |
| Jobs | `/v1/admin/jobs/*` | `jobs.ts` |

Webhook callbacks must use the same service layer as HTTP routes. Provider
signature checks happen at the route/capability edge, but final business state
still belongs to the feature service.

## Planned Growth Route Groups

三阶段成长主线当前没有独立 planned route group 尚未登记。新增 route
时必须先补 shared contract、route registry、SDK 文档和权限，再接入
App/Admin surface。

`group_ministry` v2 and `serving_schedule` v2 should extend their current route groups instead of creating new feature route roots.

## Verification

- Route handler 保持薄。
- 业务规则在 service/domain。
- Webhook 幂等在 service。
- 错误结构稳定。
- 高风险动作有 audit correlation。
