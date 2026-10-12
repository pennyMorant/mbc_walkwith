# File Naming

Use this file when creating or renaming files.

## Global Rules

1. New multi-word files should use `_` as the word separator.
2. Do not create new business files with `-` as the separator.
3. Directory names may follow existing project conventions or explicit user requests, such as `docs/agent-workflow/`.
4. Keep existing files as-is unless the task is explicitly about renaming.
5. Do not use temporary names:
   - `new_`
   - `old_`
   - `copy`
   - `backup`
   - `final`
   - `test2`

## Backend TypeScript

New backend files should use `snake_case` plus responsibility suffix:

- routes: `<feature>.routes.ts`
- service: `<feature>.service.ts`
- repository interface: `<feature>.repository.ts`
- Postgres repository: `postgres_<feature>.repository.ts`
- in-memory repository: `in_memory_<feature>.repository.ts`
- tests: `*.test.ts`

Migration files:

- `0000_short_feature_name.sql`
- Use the next migration number.
- Name the actual business change.

## Admin Web

Vue component names keep the Vue convention:

- pages: `<Feature>Page.vue`
- cards: `<Thing>Card.vue`
- dialogs: `<Thing>Dialog.vue`
- tables: `<Thing>Table.vue`
- forms: `<Thing>Form.vue`

TypeScript helper files should use `snake_case.ts`, for example `life_posts.ts`.

## Mobile Flutter

Dart files use `snake_case.dart`:

- pages: `*_page.dart`
- tabs: `*_tab.dart`
- cards: `*_card.dart`
- sheets: `*_sheet.dart`
- dialogs: `*_dialog.dart`
- DTOs: `*_dto.dart`

## Docs

Docs use `snake_case.md`.

Chinese docs may use `_zh.md`.
