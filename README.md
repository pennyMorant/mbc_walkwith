# MBC WalkWith

MBC WalkWith is a church life companion app and future multi-application monorepo.

The source code is released under the Apache License 2.0. Church deployment
data, credentials, private member information, and MBCG trademarks are not part
of that license. Read [Open Source and Self-Hosting](docs/open_source_release.md)
before publishing a fork or deploying the system.

## Repository Layout

```text
apps/
  mobile/       Flutter iOS/Android app
  admin_web/    Admin web console
  public_web/   Public church landing site
  sermon_studio/ Local Python sermon processing tool
  user_web/     Future member-facing web app

backend/        API and migrations
packages/       Shared contracts, types, and UI tokens
docs/           Architecture, core contracts, feature chains, domains, surfaces, capabilities, and development documents
infra/          Optional Docker and deployment infrastructure
tools/          Repository build, deployment, and maintenance scripts
```

## Mobile App

Run Flutter commands from `apps/mobile`:

```sh
cd apps/mobile
flutter pub get
flutter analyze
flutter test
```

Start with:

- [docs/product_vision.md](docs/product_vision.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/architecture/app.md](docs/architecture/app.md)
- [docs/architecture/backend_web.md](docs/architecture/backend_web.md)
- [docs/core/README.md](docs/core/README.md)
- [docs/features/README.md](docs/features/README.md)
- [docs/stage_two_status.md](docs/stage_two_status.md)
- [docs/domains/README.md](docs/domains/README.md)
- [docs/surfaces/README.md](docs/surfaces/README.md)
- [docs/capabilities/README.md](docs/capabilities/README.md)
- [docs/api.md](docs/api.md)
- [docs/api_standards.md](docs/api_standards.md)
- [docs/closure_validation_plan_zh.md](docs/closure_validation_plan_zh.md)
- [docs/backend_release_checklist.md](docs/backend_release_checklist.md)
- [docs/local_sermon_processing.md](docs/local_sermon_processing.md)
- [docs/operations.md](docs/operations.md)
- [docs/vps_deployment.md](docs/vps_deployment.md)
- [docs/docker_deployment.md](docs/docker_deployment.md)
- [docs/development_guidelines.md](docs/development_guidelines.md)
- [docs/push_notifications.md](docs/push_notifications.md)

Flutter debug builds default to `http://localhost:3020/v1`. Use
`--dart-define=USE_MOCK_REMOTE_DATA=true` for offline mock sermon/life data, or
set `--dart-define=API_BASE_URL=...` for a test or production backend. Do not
commit a private server address into App configuration.

For Android emulator local API testing:

```sh
flutter run --debug --dart-define=API_BASE_URL=http://10.0.2.2:3020/v1
```

For desktop/iOS simulator local API testing:

```sh
flutter run --debug --dart-define=API_BASE_URL=http://localhost:3020/v1
```

Flutter debug builds enable member auth bypass by default so developers can
open member-only App data without completing email-code login. The App sends
`DEBUG_MEMBER_ACCESS_TOKEN` to member APIs, and the backend accepts it only when
`NODE_ENV` is not `production` and `DEBUG_MEMBER_AUTH_BYPASS` is enabled. Disable
it locally with `--dart-define=DEBUG_MEMBER_AUTH_BYPASS=false` or
`DEBUG_MEMBER_AUTH_BYPASS=false` on the backend.

Firebase-backed features such as push notifications require a generated
`apps/mobile/lib/firebase_options.dart` from `flutterfire configure`. Keep the
generated project-specific values local; the repository intentionally contains
only a placeholder.

## Public Repository Safety

Before publishing or pushing a release branch, run:

```sh
bun run check:public-release
```

This checks tracked files for private runtime artifacts, high-confidence secret
formats, fixed private endpoints, and required open-source governance files.
The repository must contain only source code, documented public-domain or
licensed assets, examples, and synthetic test data. Production content remains
in Postgres/object storage and secrets remain in server-side environment files.

See [SECURITY.md](SECURITY.md), [CONTRIBUTING.md](CONTRIBUTING.md),
[TRADEMARKS.md](TRADEMARKS.md), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Backend Smoke

Run migrations and the Postgres sermon/local-package smoke path:

```sh
DATABASE_URL=postgres://user@localhost:5432/mbc_walkwith_smoke \
USE_MOCK_DATA=false \
bun run db:smoke
```

The smoke script runs migrations, logs in as the dev admin, creates a sermon,
uploads audio, imports a reviewed local sermon package, publishes the sermon,
checks the public API, then removes the smoke data and uploaded audio.

Seed packaged Bible knowledge into Postgres for the backend CMS:

```sh
DATABASE_URL=postgres://user@localhost:5432/mbc_walkwith \
bun run db:seed:bible-knowledge
```

## Backend and Admin

Run API and admin web in separate terminals:

```sh
bun run dev:api
bun run dev:web
bun run dev:public
```

Sermon transcription, outline drafting, and Scripture reference extraction run
locally through `apps/sermon_studio` or another local workstation process. The
backend receives reviewed local packages through the admin API.

Production build/start commands are documented in
[docs/operations.md](docs/operations.md).

For a small test VPS, build locally and deploy the prebuilt Bun/admin bundle:

```sh
VITE_API_BASE_URL=http://<server-ip>/v1 \
VITE_ADMIN_BASE_PATH=/admin/ \
bun run build:prebuilt
scp dist/prebuilt/mbc_walkwith_linux_x64_*.tar.gz root@<server-ip>:/tmp/
mbcwalkwith deploy-prebuilt /tmp/mbc_walkwith_linux_x64_<timestamp>.tar.gz
```

With one test IP, nginx serves the public landing page at `/`, the admin web
at `/admin/`, and the API at `/v1/`.

Docker is also supported as an optional, parallel deployment adapter. It does
not replace the native VPS/systemd path. See
[docs/docker_deployment.md](docs/docker_deployment.md) for local `linux/amd64`
image builds, offline VPS transfer, Compose deployment, and container database
backup boundaries.
