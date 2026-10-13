# Operations Runbook

This runbook is the working order for local development, staging, and a small
production deployment of the API, admin web, sermon media, and local sermon
package workflow.

For VPS automation and release management, see
[vps_deployment.md](vps_deployment.md).

For the optional Docker/Compose path, see
[docker_deployment.md](docker_deployment.md). Docker support is additive; the
native Bun/systemd/PostgreSQL/Nginx deployment remains supported.

For PostgreSQL encrypted backup, retention, alerting, and recovery procedures,
see [database_backup.md](database_backup.md).

## Common Commands

Install dependencies:

```sh
bun install
```

Run local API and admin web in separate terminals:

```sh
bun run dev:api
bun run dev:web
```

Run migrations:

```sh
bun run db:migrate
```

Backend migrations are executed by Drizzle Kit using
`backend/drizzle.config.ts`, `backend/src/shared/db/schema.ts`, and
`backend/migrations/`.

Import packaged Bible knowledge assets into Postgres:

```sh
DATABASE_URL=postgres://user@localhost:5432/mbc_walkwith \
bun run db:seed:bible-knowledge
```

Build the admin and public web bundles:

```sh
bun run build
```

Build a local linux-x64 prebuilt release for a small VPS:

```sh
VITE_API_BASE_URL=http://<server-ip>/v1 \
VITE_ADMIN_BASE_PATH=/admin/ \
bun run build:prebuilt
```

On macOS, ARM Linux, or another non-linux-x64 host, this command automatically
uses Docker with `--platform linux/amd64`. Docker must be running. The migration
runtime is therefore installed for the same platform used by the VPS; native
builds remain available on Linux x86_64.

The normal VPS artifact is built by
`.github/workflows/prebuilt_release.yml`. Configure repository variables
`DEPLOY_API_BASE_URL` and `DEPLOY_ADMIN_BASE_PATH`; every successful `main`
build updates the `deployment-latest` prerelease with a stable archive name and
SHA-256 checksum.

Start the production API with Bun running the TypeScript sources:

```sh
bun run start:api
```

When `NODE_ENV=production`, the API refuses to start unless `DATABASE_URL` is
set and `USE_MOCK_DATA=false`.

When Admin Settings enables `member.requireEmailVerification`, configure Resend
with `MEMBER_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and
`MEMBER_EMAIL_FROM`. Without it, registration returns a configuration error
instead of claiming that a verification email was sent.

Verify before deploy:

```sh
bun run check
```

## Local Development Modes

Initialize the ignored local configuration and run the complete Web stack:

```sh
bun run local:init
bun run local:check
bun run local:web
```

See [local_environment.md](local_environment.md) for individual API, Web, and
Flutter commands. The inline commands below remain useful for temporary
overrides and CI diagnostics.

Fast mock mode:

```sh
USE_MOCK_DATA=true bun run dev:api
bun run dev:web
```

Postgres mode:

```sh
createdb mbc_walkwith
DATABASE_URL=postgres://user@localhost:5432/mbc_walkwith \
USE_MOCK_DATA=false \
bun run db:migrate

DATABASE_URL=postgres://user@localhost:5432/mbc_walkwith \
USE_MOCK_DATA=false \
bun run dev:api
```

Admin web talks to `http://localhost:3020/v1` by default. Set
`VITE_API_BASE_URL` when using another API origin.

## Production Order

Source deploy order:

1. Install dependencies with `bun install`.
2. Set backend env from `backend/.env.example`.
   Production deploys should use `backend/.env.production.example` as the
   stronger starting point.
3. Run `bun run build` to produce the admin and public web bundles.
4. Run `bun run db:migrate`.
5. Run `bun run db:seed:bible-knowledge` to publish packaged reader-assist people and places into Postgres.
6. Start API with `bun run start:api`.
7. Serve `apps/admin_web/dist` and `apps/public_web/dist` behind HTTPS.
8. Check `/v1/health` and the Admin Diagnostics readiness panel.

Small VPS prebuilt order:

1. Push the reviewed commit to `main` or run the GitHub workflow manually.
2. GitHub Actions verifies and builds the complete linux-x64 release.
3. Run `mbcwalkwith deploy-release` on the VPS.
4. The VPS downloads only the archive and checksum, validates the release
   manifest, runs Drizzle Kit migrations, switches
   `current`, restarts `mbcwalkwith-api`, and checks `/v1/health`.

For a one-IP test server, the expected HTTP layout is:

```text
/          public landing web
/admin/    admin web
/v1/       backend API
```

The prebuilt path does not run `bun install` or frontend/backend build on the
VPS. The GitHub-built archive includes a minimal Drizzle Kit migration runtime
under `backend/node_modules`, and the server uses the Bun runtime to execute
`backend_dist/main.js`.

The VPS does not run sermon transcription, outline generation, or Scripture
extraction. Sermon media processing runs on a local workstation and the
reviewed package is uploaded through `/v1/admin/sermons/:sermonId/local-package`.

Optional Docker order:

1. Run `bun run check` on the source checkout.
2. Build the API, migration, and Web images locally for `linux/amd64`.
3. Push them to a registry or export/load them on the VPS.
4. Configure Docker-specific `compose.env` and `backend.env` outside Git.
5. Run `tools/scripts/docker/manage.sh deploy`.

The Docker manager starts PostgreSQL, runs the same Drizzle Kit migrations as a
one-shot container, then starts API and Web. It does not modify the native
systemd units, host PostgreSQL, or host Nginx configuration.

## Sermon Media Env

Local file storage:

```sh
MEDIA_STORAGE_DRIVER=local
MEDIA_UPLOAD_DIR=/var/lib/mbc_walkwith/uploads
```

Native VPS deployments keep this directory outside timestamped releases.
Local development may continue to use a repository-relative `uploads` path.

Cloudflare R2 or other S3-compatible storage:

```sh
MEDIA_STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket>
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
S3_FORCE_PATH_STYLE=true
```

Local sermon processing configuration belongs to the local workstation, not the
backend VPS. See [local_sermon_processing.md](local_sermon_processing.md) and
`apps/sermon_studio/README.md`.

## Smoke Test

The Postgres smoke path covers migrations, login, sermon creation, audio upload,
reviewed local package import, publish, public API read, and cleanup:

```sh
DATABASE_URL=postgres://user@localhost:5432/mbc_walkwith_smoke \
USE_MOCK_DATA=false \
bun run db:smoke
```

By default the smoke path uses local media storage and a reviewed local package.
To exercise R2/S3 storage, set the S3 env values before running `db:smoke`:

```sh
DATABASE_URL=postgres://user@localhost:5432/mbc_walkwith_smoke \
USE_MOCK_DATA=false \
MEDIA_STORAGE_DRIVER=s3 \
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com \
S3_REGION=auto \
S3_BUCKET=<bucket> \
S3_ACCESS_KEY_ID=<key> \
S3_SECRET_ACCESS_KEY=<secret> \
bun run db:smoke
```
