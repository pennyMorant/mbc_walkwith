# Contributing

Thank you for helping improve MBC WalkWith.

## Start Here

Read `AGENTS.md`, `README.md`, `docs/product_vision_zh.md`, and
`docs/architecture.md`. Then read the workflow and feature documents for the
area you plan to change. Architecture and privacy boundaries apply to human and
automated contributors alike.

## Development Flow

1. Create a focused branch.
2. Keep UI, business rules, persistence, and provider integrations in their
   documented owner layers.
3. Add or update focused tests.
4. Update linked architecture, feature, SDK, or operations documentation when
   a contract or behavior changes.
5. Run the smallest relevant checks and `bun run check:public-release`.
6. Describe behavior, verification, and residual risk in the pull request.

Use synthetic test data only. Do not submit church production content, member
records, credentials, server addresses, database exports, or generated signing
and Firebase configuration.

## Licensing

By submitting a contribution, you agree that it may be distributed under the
Apache License 2.0 and confirm that you have the right to contribute it. Do not
submit third-party media or text without compatible redistribution terms and a
notice in `THIRD_PARTY_NOTICES.md`.
