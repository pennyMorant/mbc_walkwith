# Documentation Linkage

Use this file whenever code changes may affect product understanding, operations, API behavior, SDK usage, or testing.

## Required Linkage

| Change type | Update |
| --- | --- |
| Product behavior | `docs/product_vision_zh.md`; optionally `docs/product_vision.md` |
| Architecture or module boundary | `docs/architecture.md`, matching `docs/architecture/*.md`, `docs/core/*.md`, `docs/development_guidelines.md` |
| Feature business chain | matching `docs/features/*.md`, related domain/surface/capability docs |
| Shared domain rule | matching `docs/domains/*.md`, affected feature docs |
| Surface entry or page responsibility | matching `docs/surfaces/*.md`, affected feature docs |
| External capability or side effect | matching `docs/capabilities/*.md`, affected feature docs |
| API endpoint or payload | `docs/api.md`, `packages/api_contracts` |
| SDK / DTO / repository / API client | `docs/sdk.md`, matching `docs/sdk/*.md` |
| Database schema | `docs/database.md`, migration, tests |
| Deployment or server script | `docs/operations.md`, `docs/vps_deployment.md` |
| Push notifications | `docs/push_notifications.md`, `docs/sdk/notifications.md` |
| Sermon processing | `docs/local_sermon_processing.md` |
| Testing strategy | `docs/testing.md` |
| Agent-wide workflow rule | `AGENTS.md`, relevant `docs/agent-workflow/*.md` |

## Rules

1. Do not let docs describe an old behavior after code changes.
2. Do not duplicate full API docs inside SDK docs; link to `docs/api.md`.
3. Keep entry docs short and split feature docs when they grow.
4. Prefer Chinese product-facing docs when preparing material for church leadership.
5. Change `AGENTS.md` only when all-agent workflow rules change.
6. Put feature-specific details in feature docs, SDK docs, or workflow files instead of the root entry.
7. For architecture changes, keep `docs/architecture.md` as the entry, App-specific rules in `docs/architecture/app.md`, backend/admin Web rules in `docs/architecture/backend_web.md`, and core contracts in `docs/core/`.
8. A feature doc must describe a full business chain, not a page, API, table, component, or provider SDK.
