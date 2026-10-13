# VPS Deployment Script

Status: draft  
Audience: operators deploying the API and admin web to a VPS

This repository includes a VPS deployment manager script:

```text
tools/scripts/vps/mbc_walkwith.sh
```

This document covers the native host deployment. An optional Docker/Compose
adapter is documented separately in [docker_deployment.md](docker_deployment.md).
Docker does not replace or wrap this script, and the two paths must not manage
the same PostgreSQL data directory or listen on the same public port.

Its purpose is to deploy:

- backend API
- admin web static build
- public landing web static build
- nginx
- PostgreSQL
- release directories and service management

It does **not** manage the local sermon processing workstation.

It also manages optional encrypted PostgreSQL backups. The full operator
configuration and recovery procedure is in [database_backup.md](database_backup.md).

## 1. Supported Environment

Current script target:

- Debian
- Ubuntu

The script will fail fast on unsupported systems.

## 2. Managed Layout

The default install layout is:

```text
/opt/mbc_walkwith/
  source/
  releases/
    20260525-101500/
    20260525-143000/
  current -> /opt/mbc_walkwith/releases/<timestamp>
  .bun/
  .home/
  .cache/
```

Configuration files:

```text
/etc/mbc_walkwith/backend.env
/etc/mbc_walkwith/deploy.env
/etc/mbc_walkwith/db-password
/etc/mbc_walkwith/backup.env
/etc/mbc_walkwith/backup-restic-password
```

Installed command:

```text
/usr/local/bin/mbcwalkwith
```

## 3. Managed Services

The script writes and manages:

- `mbcwalkwith-api.service`
- `mbcwalkwith-backup.service` and its daily timer
- `mbcwalkwith-backup-verify.service` and its weekly timer
- `mbcwalkwith-backup-restore.service` and its monthly timer

The web bundles are served as static files from:

```text
/opt/mbc_walkwith/current/apps/admin_web/dist
/opt/mbc_walkwith/current/apps/public_web/dist
```

through nginx.

## 4. Main Commands

Show help:

```sh
bash tools/scripts/vps/mbc_walkwith.sh help
```

Interactive menu:

```sh
bash tools/scripts/vps/mbc_walkwith.sh --interactive
```

Install:

```sh
bash tools/scripts/vps/mbc_walkwith.sh install --git-ref main
```

The installer pulls the public repository by default:

```text
https://github.com/pennyMorant/mbc_walkwith.git
```

Use `--repo-url` only when deploying a maintained fork or mirror.

Deploy:

```sh
mbcwalkwith deploy-release
```

This is the recommended update path. GitHub Actions builds the backend, admin
Web, public Web, and linux-x64 migration runtime. The VPS downloads the rolling
release archive and checksum; it does not clone source or compile the workspace.

Configure these GitHub repository variables before the workflow runs:

```text
DEPLOY_API_BASE_URL=https://api.example.com/v1
DEPLOY_ADMIN_BASE_PATH=/
```

Use `/admin/` only when Admin Web shares a host with the public site or API. A
separate Admin domain uses `/`.

Build locally and deploy a prebuilt linux-x64 release:

```sh
VITE_API_BASE_URL=http://<server-ip>/v1 \
VITE_ADMIN_BASE_PATH=/admin/ \
bun run build:prebuilt
scp dist/prebuilt/mbc_walkwith_linux_x64_*.tar.gz root@<server-ip>:/tmp/
mbcwalkwith deploy-prebuilt /tmp/mbc_walkwith_linux_x64_<timestamp>.tar.gz
```

The local-build path and `mbcwalkwith deploy --check` source path remain
available for recovery, but they are not the normal small-VPS update path.

For a one-IP test server, use the same host for admin, public, and API origins.
Nginx then serves:

```text
/          public landing web
/admin/    admin web
/v1/       backend API
```

Rollback to the previous release:

```sh
mbcwalkwith rollback
```

Rollback to a specific release directory name:

```sh
mbcwalkwith rollback 20260525-143000
```

Status:

```sh
mbcwalkwith status
```

Logs:

```sh
mbcwalkwith logs api
mbcwalkwith logs nginx
mbcwalkwith logs backup
mbcwalkwith logs backup-verify
mbcwalkwith logs backup-restore
```

Configure an independent private R2 repository, initialize encryption, and
enable backup timers:

```sh
sudoedit /etc/mbc_walkwith/backup.env
mbcwalkwith backup-init
mbcwalkwith backup-now
mbcwalkwith backup-status
```

`backup-init` is intentionally explicit. A normal install or deploy does not
enable backups until R2 credentials and the restic password recovery process
have been reviewed.

Configure SSL:

```sh
mbcwalkwith ssl \
  --admin-origin https://admin.example.com \
  --api-origin https://api.example.com \
  --email ops@example.com
```

You can also pass domains directly:

```sh
mbcwalkwith ssl \
  --admin-domain admin.example.com \
  --api-domain api.example.com \
  --email ops@example.com
```

Optional:

```sh
mbcwalkwith ssl \
  --admin-origin https://admin.example.com \
  --api-origin https://api.example.com \
  --public-origin https://www.example.com \
  --email ops@example.com
```

Clean old releases:

```sh
mbcwalkwith cleanup-releases --keep-releases 5
```

## 5. Install Behavior

`install` performs these steps:

1. install base system packages
2. install Bun
3. create service user
4. prepare `/opt/mbc_walkwith`
5. prepare PostgreSQL role and database
6. clone or refresh managed source checkout
7. write backend and deploy env files
8. write systemd services
9. install the `mbcwalkwith` command

The installer also creates a disabled root-only backup configuration and a
restic password file. Operators must store that password securely outside the
VPS before enabling backups.

After installation, review:

```text
/etc/mbc_walkwith/backend.env
```

before the first deploy.

You can also compare it against:

```text
backend/.env.production.example
```

## 6. Deploy Behavior

`deploy` performs these steps:

1. refresh `source/`
2. create an isolated pending release directory
3. extract source into that release
4. run `bun install --frozen-lockfile`
5. optionally run `bun run check`
6. run `bun run build` to produce the admin and public web bundles
7. run database migrations
8. finalize the prepared release and switch the `current` symlink
9. restart API
10. run a local `/v1/health` check backed by a real PostgreSQL query
11. mark the release complete and clean old releases

If the final health check fails and a previous release exists, the script
attempts to repoint `current` back to the previous release and restart
services.

Before build and migrate, deploy also validates key production settings in
`/etc/mbc_walkwith/backend.env`, including:

- `DATABASE_URL`
- `USE_MOCK_DATA=false`
- rotated JWT secrets
- S3/R2 credentials when `MEDIA_STORAGE_DRIVER=s3`

`deploy-prebuilt FILE` is the recommended path for small VPS test instances.
It performs these steps:

1. validate `/etc/mbc_walkwith/backend.env`
2. extract into an isolated pending release directory
3. extract the uploaded local-built tarball
4. validate `release-manifest.json` requires `target=linux-x64`, `runtime=bun`,
   and matching API/admin build-time values
5. run Drizzle Kit migrations from `backend/drizzle.config.ts`
6. finalize the prepared release and switch the `current` symlink
7. rewrite the API systemd service so it can run `backend_dist/main.js`
8. restart API
9. run a local `/v1/health` check backed by PostgreSQL
10. mark the release complete and clean old releases

This path does not run `bun install`, `bun run check`, or `bun run build` on
the VPS. The uploaded archive carries a minimal Drizzle Kit migration runtime
under `backend/node_modules` and executes migrations from the bundled
`backend/migrations/` directory. Build and type/test checks must happen locally
before upload.

`deploy-release [URL]` downloads the rolling GitHub Release archive and its
adjacent `.sha256` file over HTTPS, verifies the checksum, and executes the same
prebuilt validation, migration, rollback, and health-check chain. A successful
release also updates the installed deployment and backup commands from the
validated archive, so future updates do not depend on a source checkout.

## 7. nginx and SSL

The `ssl` command:

- writes nginx virtual host config
- requests certificates with certbot
- updates:
  - `ADMIN_WEB_ORIGIN`
  - `PUBLIC_API_BASE_URL`
- restarts API
- reloads nginx
- supports Certbot install methods: `auto`, `snap`, `venv`, `apt`, or `none`

Vite embeds the API URL and admin base path at build time. Before running
`ssl` against an existing release, deploy source or a prebuilt package using
the final HTTPS origins. The command refuses to configure mismatched assets
instead of leaving the browser pointed at an old or localhost API URL.

Current assumption:

- one admin origin
- one API origin

Origins are the primary external configuration inputs:

- `--admin-origin`
- `--api-origin`
- `--public-origin`

## 8. Runtime Notes

The generated `backend.env` defaults to:

- `USE_MOCK_DATA=false`
- `MEDIA_STORAGE_DRIVER=local`
- `MEDIA_UPLOAD_DIR=/var/lib/mbc_walkwith/uploads`

The local upload directory belongs to the API service user and lives outside
timestamped releases, so deployments and release cleanup cannot remove sermon
audio or images. Production may switch to a private R2/S3 bucket.

The VPS backend has no sermon transcription, outline generation, or Scripture
extraction provider configuration. Run those steps locally and upload the
reviewed package through the admin API.

## 9. Current Limits

- Debian/Ubuntu only
- no fully interactive release selector for rollback yet
- separate public web domains require `--public-origin`, matching DNS records,
  and successful certificate issuance
- no built-in remote object storage validation beyond runtime configuration
- backup recovery still requires a real R2 credential, restic password, and a
  PostgreSQL restore rehearsal on the target VPS

## 10. Related Docs

- [operations.md](operations.md)
- [backend_release_checklist.md](backend_release_checklist.md)
- [docker_deployment.md](docker_deployment.md)
