# MBC WalkWith Agent Constitution

`AGENTS.md` is the repository-wide working constitution for every developer and AI agent. It defines how to start, classify, reason, protect architecture boundaries, verify, and commit. It does not describe feature implementation details.

Detailed rules live in:

- `docs/agent-workflow/`: workflow, boundaries, ownership, verification, splitting, naming
- `docs/sdk.md` and `docs/sdk/`: SDK, DTO, repository, API client, and contract rules
- `docs/product_vision_zh.md`: product direction
- `docs/architecture.md` and `docs/architecture/`: system architecture and App/backend Web boundaries
- `docs/core/`: contracts, feature integration, lifecycle, errors, and logic-chain rules
- `docs/features/`, `docs/domains/`, `docs/surfaces/`, `docs/capabilities/`: business chains, shared rules, expression layers, and side-effect boundaries
- `docs/development_guidelines.md`: long-form implementation rules

Change this file only when the rules for all agents change. Feature-specific details belong in the linked workflow or feature documents.

## Required Startup

For every non-trivial task:

1. Run `git status --short`.
2. Read `README.md`, `docs/product_vision_zh.md`, `docs/architecture.md`, `docs/core/README.md`, and `docs/development_guidelines.md`.
3. Read the current task's source code and nearby tests.
4. Read the relevant workflow file from `docs/agent-workflow/`.
5. If a relevant doc does not exist, read the code directly and report the documentation gap at the end.

## Standard Workflow

1. Classify the task: UI, bug, feature, SDK, contract, migration, backend, admin Web, mobile App, deployment, or docs.
2. Ask whether the issue is a local defect or an architecture boundary problem.
3. Find the owner: UI, controller/provider, domain model, repository, API client, route, service, persistence, contract, or deployment script.
4. Keep UI and business logic separate.
5. Complete one closed loop at a time.
6. Check sibling flows at the same layer.
7. Trace the user action to the final API, database, worker, or UI state.
8. Run the smallest effective verification.
9. Document what changed and what was verified.
10. Commit only when the user explicitly asks, or when an action trigger command below authorizes the full closed loop.

## Action Trigger Workflow

When the user uses an action command such as `执行`, `落地`, `修复`, `处理`, `继续`, `推进`, `开始`, `做`, `改`, `实现`, `全部做完`, or a similar direct command to proceed, treat it as authorization for the complete delivery loop:

1. Conceive the implementation plan.
2. Review the plan against architecture boundaries, ownership, source of truth, and verification needs.
3. Execute the plan.
4. Audit the changed logic chain from entry point to final state, including sibling flows at the same layer.
5. Run the smallest effective verification.
6. Stage only files that belong to the task.
7. Commit the completed stage.
8. Report what changed, what was verified, the commit hash, and any remaining risk.

For large work, split the task into small coherent stages. After each stage, audit, verify, and commit before continuing.

Do not run the full action trigger workflow when the user explicitly limits the request, such as `只构思`, `只审核`, `先别执行`, `先别提交`, `暂停`, `不要改代码`, or `只回答`. The newest user instruction wins.

## Startup Brief

Before substantial work, give a short brief:

- docs and code read
- task classification
- local bug or architecture boundary issue
- layers expected to change
- layers that should not change
- verification plan

Keep the brief short. Its purpose is to prevent blind edits.

## Workflow Files

- [Code Boundaries](docs/agent-workflow/code_boundaries.md)
- [Agent Ownership](docs/agent-workflow/agent_ownership.md)
- [Product Boundaries](docs/agent-workflow/product_boundaries.md)
- [Failure Escalation](docs/agent-workflow/failure_escalation.md)
- [File Naming](docs/agent-workflow/file_naming.md)
- [Code Splitting and Line Limits](docs/agent-workflow/code_splitting.md)
- [Documentation Linkage](docs/agent-workflow/docs_linkage.md)
- [Verification](docs/agent-workflow/verification.md)
- [Frontend Workflow](docs/agent-workflow/frontend_workflow.md)
- [Backend Workflow](docs/agent-workflow/backend_workflow.md)
- [SDK Workflow](docs/agent-workflow/sdk_workflow.md)

## Mandatory Routing

- App or admin Web UI changes: read `frontend_workflow.md`, `agent_ownership.md`, `code_splitting.md`, and `file_naming.md`.
- Backend, database, migration, or contract changes: read `backend_workflow.md`, `code_boundaries.md`, and `docs_linkage.md`.
- SDK, DTO, repository, API client, or transport changes: read `sdk_workflow.md` and the relevant `docs/sdk/*.md`.
- New or changed feature chains: read `docs/core/feature_integration.md`, matching `docs/features/*.md`, and related domain/surface/capability docs.
- Shared business rule changes: read matching `docs/domains/*.md` and affected feature docs.
- External provider, storage, notification, PDF, TTS, or worker capability changes: read matching `docs/capabilities/*.md` and affected feature docs.
- Giving, Stripe, annual statement, refund, fee, or dispute changes: read `product_boundaries.md`, `backend_workflow.md`, and `verification.md`.
- Sermon audio, transcript, Bible reader, TTS, event registration, member privacy, push notification, or deployment changes: read `product_boundaries.md` and the relevant workflow file.
- Repeated failed fixes: read `failure_escalation.md` before editing again.

## Required Final Self-Check

Before finishing, confirm:

- no new large file should be split
- no duplicate source of truth was introduced
- UI did not absorb business rules
- business behavior was not changed accidentally
- repository/API/helper boundaries were not bypassed
- feature behavior was traced through the full chain
- no temporary fallback, debug bypass, or stale compatibility remains
- docs and SDK docs were updated when required
- the target verification ran

## Product Boundary Summary

MBC WalkWith is a church app for Bible reading, sermons, church life, event registration, giving, prayer, notifications, and member care. It is not an e-commerce app, not a social network, and not a digital in-app purchase product.

Strong boundaries:

- Giving is donation/payment processing, not App Store or Play digital IAP.
- Bible TTS reads local public-domain or licensed text; it is not audio Bible playback.
- Sermon audio and written content are managed by church admins.
- Member privacy, giving data, annual statements, and payment data are high-risk.
- UI does not directly own payment, registration, auth, storage, SDK transport, or deployment behavior.

## Commit Rule

Commit only when the user explicitly asks or when an action trigger command authorizes the full delivery loop. Before committing:

1. Check `git status --short`.
2. Confirm staged files match the task.
3. Keep documentation-only changes separate from behavior changes when practical.
4. Never commit secrets, keystores, private config, or local credentials.
