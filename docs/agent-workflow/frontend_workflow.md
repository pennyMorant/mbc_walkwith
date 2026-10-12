# Frontend Workflow

Use this file for mobile App and admin Web UI changes.

## Mobile App

Follow existing Flutter structure:

- domain: `apps/mobile/lib/features/<feature>/domain/`
- DTOs: `apps/mobile/lib/features/<feature>/data/dto/`
- repositories: `apps/mobile/lib/features/<feature>/data/`
- remote data sources: `apps/mobile/lib/features/<feature>/data/remote/`
- local data sources: `apps/mobile/lib/features/<feature>/data/local/`
- screens and widgets: `apps/mobile/lib/features/<feature>/presentation/`

Rules:

- UI calls repositories/providers, not raw HTTP.
- Preserve guest mode where public content exists.
- Add l10n keys for visible text.
- Keep pages quiet, readable, and church-appropriate.
- Keep business rules out of widgets.
- If UI needs a rule from backend state, expose it through domain/repository state instead of duplicating it locally.
- Run `flutter analyze` and `flutter test` for meaningful UI/data changes.

## Admin Web

Follow existing Vue structure:

- feature pages: `apps/admin_web/src/features/<feature>/pages/`
- feature components: `apps/admin_web/src/features/<feature>/components/`
- API helpers: `apps/admin_web/src/core/api/`
- i18n: `apps/admin_web/src/core/i18n/`

Rules:

- Pages call API helpers, not raw `fetch`.
- Split large pages into cards, dialogs, tables, forms, and sections.
- Keep operational screens dense, scannable, and calm.
- Do not implement backend authorization, payment, registration capacity, or privacy rules in Vue pages.
- Admin UI should reflect backend state and call admin API helpers.
- Run `bun run typecheck` for admin Web changes.

## UI Change Checklist

Before finishing:

- user action reaches the intended repository/API helper
- loading, empty, error, and success states exist where needed
- visible text is localized where the surface supports l10n
- no unrelated business behavior changed
- large pages/components were split according to `code_splitting.md`
