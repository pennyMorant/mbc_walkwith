# Product Boundaries

Use this file before changing high-risk or product-defining behavior.

## Product Position

MBC WalkWith is a church app for:

- Bible reading and TTS
- sermons and sermon audio
- church life posts and weekly bulletin
- event registration and check-in
- giving, giving history, and annual statements
- prayer, notifications, and member care
- admin-managed content operations

It is not:

- an e-commerce app
- a social network
- a digital in-app purchase product
- a tax, legal, medical, or financial advisory product

## Strong Boundaries

1. Giving is donation/payment processing.
   - Do not model it as App Store or Play digital IAP.
   - Backend confirmation is the source of truth.

2. Bible TTS reads text.
   - It is not audio Bible playback.
   - It should work from approved packaged Bible text.

3. Sermon content is church-managed.
   - Admins upload audio and written content.
   - App UI consumes published content.

4. Event registration is backend-owned.
   - Capacity, deadlines, cancellation, and check-in are backend rules.
   - App and admin UI reflect backend state.

5. Member privacy is high-risk.
   - Do not expose private member, giving, or prayer data without backend authorization.

6. Deployment scripts are production-sensitive.
   - Health checks, env handling, and rollback logic must be treated as high-risk.

## High-Risk Verification

For high-risk changes, verify at more than one layer when practical:

- backend route/service test
- admin Web typecheck or flow check
- mobile repository/widget test
- migration or smoke check
- script syntax/help check

