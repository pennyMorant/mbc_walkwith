# Code Splitting and Line Limits

Use this file when a file grows large or a feature spans multiple layers.

Line limits are splitting signals. Exceeding a recommendation means consider splitting. Exceeding a hard limit means split unless the file is generated, a migration, or an organized i18n/config file.

## Mobile App

| File type | Recommended | Hard limit | Split into |
| --- | ---: | ---: | --- |
| Page / Tab | 250-350 | 450 | widgets, sections, sheets, controllers |
| Widget | 80-180 | 250 | smaller widgets |
| Repository | 120-220 | 300 | remote/local data source, helper service |
| DTO / Model | 80-180 | 250 | feature-specific DTO/model files |
| Test | 200-400 | 600 | scenario or feature test files |

## Admin Web

| File type | Recommended | Hard limit | Split into |
| --- | ---: | ---: | --- |
| Page.vue | 250-400 | 550 | cards, dialogs, tables, forms, sections |
| Component.vue | 80-220 | 300 | smaller components |
| API helper | 100-220 | 300 | resource-specific API files |
| Test | 200-400 | 600 | feature or scenario tests |

`i18n` files can exceed these limits if organized and searchable.

## Backend

| File type | Recommended | Hard limit | Split into |
| --- | ---: | ---: | --- |
| routes | 120-250 | 350 | public/member/admin/subresource routes |
| service | 180-350 | 500 | focused services or private helpers |
| repository interface | 80-180 | 250 | subresource repositories |
| Postgres repository | 180-350 | 500 | aggregate/subresource repositories |
| in-memory repository | 180-350 | 500 | matching focused repositories |
| contract file | 200-400 | 600 | domain-specific contract files |
| backend test | 300-600 | 900 | module or workflow tests |

Migration files are not line-limited; keep each migration to one schema-change theme.

## Docs

| File type | Recommended | Hard limit |
| --- | ---: | ---: |
| Entry doc | 50-120 | 180 |
| Feature doc | 80-250 | 350 |
| SDK feature doc | 40-180 | 250 |

When a doc exceeds the hard limit, split it and add links from the entry doc.

## Splitting Rules

1. Split by responsibility, not by arbitrary line count.
2. Keep public APIs stable when splitting.
3. Avoid moving code and changing behavior in the same commit unless necessary.
4. Add tests around behavior before splitting risky logic.

