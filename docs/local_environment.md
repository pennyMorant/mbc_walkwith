# Local Private Environment

Status: active development workflow

Local credentials and machine-specific endpoints live outside the public
source tree under `private/local/`. The directory is ignored by Git and rejected
by the public repository checker if a file is ever force-added.

## Initialize

From the repository root:

```sh
bun run local:init
```

This creates missing files without overwriting existing values:

```text
private/local/backend.env
private/local/admin_web.env
private/local/public_web.env
private/local/mobile.json
```

The source examples remain owned by each application:

```text
backend/.env.example
apps/admin_web/.env.example
apps/public_web/.env.example
apps/mobile/config/dart_defines.local.example.json
```

Edit only the private copies. Keep API keys, service-account JSON, test account
passwords, public server IP addresses, and church-private data out of examples.

## Validate

```sh
bun run local:check
```

Validation checks required keys, environment-file syntax, and Flutter JSON
types without printing secret values. With `USE_MOCK_DATA=false`, the backend
configuration must include `DATABASE_URL`.

## Run

Run the local API and both Web applications together:

```sh
bun run local:web
```

The default addresses are:

```text
API          http://127.0.0.1:3020/v1
Admin Web    http://127.0.0.1:5173
Public Web   http://127.0.0.1:5174
```

Individual commands are also available:

```sh
bun run local:api
bun run local:admin
bun run local:public
bun run local:mobile
```

Flutter arguments may follow the Bun separator:

```sh
bun run local:mobile -- -d <device-id>
```

The mobile command uses `--dart-define-from-file=private/local/mobile.json`.
Firebase platform files are separate: generate them with FlutterFire for the
local Firebase project. `google-services.json`, `GoogleService-Info.plist`, and
generated project-specific Firebase options remain untracked.

## Boundaries

- Local files are for developer machines, not VPS production configuration.
- Native VPS secrets remain under `/etc/mbc_walkwith/`.
- Docker keeps its independent `infra/docker/*.env` configuration.
- Environment files hold configuration, not business seed data.
- PostgreSQL and object storage remain the source of truth for business data.
- Prebuilt and release scripts receive required build values explicitly; they
  never copy `private/local/` into an artifact.
