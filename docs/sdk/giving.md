# Giving SDK

This document covers giving, funds, transaction history, annual statements, PDF sharing, fees, disputes, and Stripe-backed flows.

## Mobile Files

- Domain: `apps/mobile/lib/features/life/domain/giving_record.dart`
- Repository: `apps/mobile/lib/features/life/data/giving_repository.dart`
- Giving card: `apps/mobile/lib/features/life/presentation/widgets/giving_card.dart`
- History page: `apps/mobile/lib/features/life/presentation/giving_history_page.dart`
- Annual statements: `apps/mobile/lib/features/life/presentation/annual_statements_page.dart`

## Backend and Contracts

- Contracts: `packages/api_contracts/src/giving.ts`
- Backend module: `backend/src/modules/giving/`
- Admin Web page: `apps/admin_web/src/features/giving/pages/GivingPage.vue`
- Admin API helper: `apps/admin_web/src/core/api/giving.ts`

## SDK Rules

- Giving is donation/payment processing, not digital in-app purchase.
- Member giving history requires `MemberSession`.
- Annual statement PDF generation and sharing must be explicit user actions.
- Annual statement exports come from the backend statement service's exact,
  unpaginated confirmed-gift query. A `statement_stale` response requires
  regeneration; clients must not combine an old total with new transaction data.
- Fees, payouts, refunds, and disputes must be represented accurately.
- Clients read fee, net, cumulative refund, payout, and reconciliation state from
  backend canonical records. They must not derive them from Checkout redirects or
  provider payloads.
- Partial refunds remain confirmed gifts with a cumulative refund amount; full
  refunds move to `refunded`. Both require backend finance review.
- Active giving funds come from the backend; clients must not hardcode fund ids.
- Fund allocation is chosen before checkout and confirmed by the backend webhook flow.
- Admin fund creation and updates require `giving:manage`; financial exports,
  statement generation, and downloads require `giving:export`.
- Mobile checkout must load active funds through `GET /member/giving/funds` and
  submit both `category` and `fundId` to `/member/giving/checkout-sessions`.
- Mobile financial JSON is parsed by strict DTOs under `data/dto`; malformed
  identities, amounts, states, dates, envelopes, or checkout URLs must fail the
  repository request instead of becoming zero-value domain records.
- Mobile checkout amounts are converted to integer cents without floating-point
  rounding and must stay within the shared request range of USD 1.00 through
  USD 100,000.00.
- The `checkout=success` deep link means the hosted Checkout flow finished, not
  that the gift is confirmed. The App clears the one-time route value, refreshes
  canonical history, polls briefly for webhook confirmation, and cancels those
  timers when the page is disposed.
- The transaction overview and statement list are independent authenticated
  reads and may run concurrently; either request failing keeps the overview in
  an error state.
- `MockGivingRepository` is allowed only behind `AppConfig.useMockRemoteData`.
- Do not hide payment provider failures.
- Backend provider-event replay treats `received` and `failed` records as
  recoverable work; only `processed` and `ignored` records short-circuit as
  completed duplicates. Clients continue to read canonical transaction state.
- Never treat a client-side success state as final payment confirmation without backend confirmation.

## Documentation Linkage

If giving SDK behavior changes, update:

- `docs/sdk/giving.md`
- `docs/api.md`
- `docs/product_vision_zh.md`
- `docs/privacy_security.md` when sensitive data handling changes
