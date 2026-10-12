#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
release_root="${MBC_WALKWITH_PREBUILT_DIR:-${repo_root}/dist/prebuilt}"
release_name="${MBC_WALKWITH_RELEASE_NAME:-mbc_walkwith_linux_x64_$(date +%Y%m%d_%H%M%S)}"
staging_dir="${release_root}/${release_name}"
archive_path="${release_root}/${release_name}.tar.gz"
target_arch="linux-x64"
api_base_url="${VITE_API_BASE_URL:-http://127.0.0.1/v1}"
admin_base_path="${VITE_ADMIN_BASE_PATH:-/}"

command -v bun >/dev/null 2>&1 || {
  echo "bun is required." >&2
  exit 1
}

[[ -n "$release_name" ]] || {
  echo "MBC_WALKWITH_RELEASE_NAME cannot be empty." >&2
  exit 1
}
[[ "$release_name" != "." && "$release_name" != ".." && "$release_name" != */* ]] || {
  echo "MBC_WALKWITH_RELEASE_NAME must be a safe directory name." >&2
  exit 1
}
[[ "$release_root" == /* ]] || {
  echo "MBC_WALKWITH_PREBUILT_DIR must be an absolute path." >&2
  exit 1
}
[[ "$staging_dir" == "${release_root}/"* && "$archive_path" == "${release_root}/"* ]] || {
  echo "Prebuilt output paths must stay inside MBC_WALKWITH_PREBUILT_DIR." >&2
  exit 1
}

rm -rf "$staging_dir" "$archive_path"
mkdir -p \
  "$staging_dir/backend_dist" \
  "$staging_dir/backend/migrations" \
  "$staging_dir/backend/src/shared/db" \
  "$staging_dir/apps/admin_web" \
  "$staging_dir/apps/public_web"

cd "$repo_root"

echo "Building backend Bun bundles for ${target_arch} runtime..."
bun build \
  backend/src/main.ts \
  --target=bun \
  --outdir="$staging_dir/backend_dist" \
  --entry-naming='[dir]/[name].js'

cp -R backend/migrations/. "$staging_dir/backend/migrations/"
cp backend/drizzle.config.ts "$staging_dir/backend/drizzle.config.ts"
cp backend/src/shared/db/schema.ts "$staging_dir/backend/src/shared/db/schema.ts"

cat > "$staging_dir/backend/package.json" <<'EOF'
{
  "name": "@mbc/backend-prebuilt-migrations",
  "private": true,
  "type": "module",
  "scripts": {
    "db:migrate": "test -n \"$DATABASE_URL\" || (echo 'DATABASE_URL is required to run Drizzle Kit migrations.' >&2; exit 1); drizzle-kit migrate --config drizzle.config.ts"
  },
  "dependencies": {
    "drizzle-kit": "^0.30.2",
    "drizzle-orm": "^0.38.4",
    "pg": "^8.13.1"
  }
}
EOF

echo "Installing minimal Drizzle Kit migration runtime..."
(
  cd "$staging_dir/backend"
  bun install --production
)

echo "Building admin web with VITE_API_BASE_URL=${api_base_url} and VITE_ADMIN_BASE_PATH=${admin_base_path}..."
VITE_API_BASE_URL="$api_base_url" VITE_ADMIN_BASE_PATH="$admin_base_path" bun run build:admin
cp -R apps/admin_web/dist "$staging_dir/apps/admin_web/dist"

echo "Building public web with VITE_API_BASE_URL=${api_base_url}..."
VITE_API_BASE_URL="$api_base_url" bun run build:public
cp -R apps/public_web/dist "$staging_dir/apps/public_web/dist"

chmod -R u+rwX,go+rX \
  "$staging_dir/apps/admin_web/dist" \
  "$staging_dir/apps/public_web/dist"

git_commit="$(git rev-parse --short HEAD 2>/dev/null || printf 'unknown')"
created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > "$staging_dir/release-manifest.json" <<EOF
{
  "name": "${release_name}",
  "target": "${target_arch}",
  "runtime": "bun",
  "apiEntry": "backend_dist/main.js",
  "adminWebDist": "apps/admin_web/dist",
  "adminBasePath": "${admin_base_path}",
  "publicWebDist": "apps/public_web/dist",
  "gitCommit": "${git_commit}",
  "createdAt": "${created_at}"
}
EOF

tar -czf "$archive_path" -C "$staging_dir" .

echo "Prebuilt release ready:"
echo "$archive_path"
