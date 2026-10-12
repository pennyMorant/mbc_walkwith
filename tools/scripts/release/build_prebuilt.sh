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
bun_version="${MBC_WALKWITH_BUN_VERSION:-1.3.13}"

canonicalize_path() {
  local value="$1"
  local probe="$value"
  local suffix=""
  while [[ ! -e "$probe" ]]; do
    suffix="/$(basename "$probe")${suffix}"
    probe="$(dirname "$probe")"
  done
  [[ -d "$probe" ]] || {
    echo "The nearest existing parent is not a directory: ${probe}" >&2
    return 1
  }
  printf '%s%s' "$(cd -P "$probe" && pwd)" "$suffix"
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
canonical_release_root="$(canonicalize_path "$release_root")"
[[ "$release_root" == "$canonical_release_root" ]] || {
  echo "MBC_WALKWITH_PREBUILT_DIR must be a canonical path: ${canonical_release_root}" >&2
  exit 1
}
case "$canonical_release_root" in
  /|/bin|/boot|/dev|/etc|/home|/lib|/lib64|/opt|/proc|/root|/run|/sbin|/sys|/tmp|/usr|/var)
    echo "MBC_WALKWITH_PREBUILT_DIR cannot be a system directory: ${canonical_release_root}" >&2
    exit 1
    ;;
esac
staging_dir="${canonical_release_root}/${release_name}"
archive_path="${canonical_release_root}/${release_name}.tar.gz"

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  command -v docker >/dev/null 2>&1 || {
    echo "A linux/amd64 Docker runtime is required when building prebuilt releases outside Linux x86_64." >&2
    exit 1
  }
  mkdir -p "$release_root"
  release_root="$(cd "$release_root" && pwd -P)"
  echo "Re-running prebuilt build inside linux/amd64 Docker..."
  exec docker run --rm --platform linux/amd64 \
    -e "VITE_API_BASE_URL=${api_base_url}" \
    -e "VITE_ADMIN_BASE_PATH=${admin_base_path}" \
    -e "MBC_WALKWITH_RELEASE_NAME=${release_name}" \
    -e "MBC_WALKWITH_PREBUILT_DIR=/output" \
    -e "HOST_UID=$(id -u)" \
    -e "HOST_GID=$(id -g)" \
    -v "${repo_root}:/source:ro" \
    -v "${release_root}:/output" \
    "oven/bun:${bun_version}-debian" \
    bash -lc 'cp -a /source /tmp/workspace && rm -rf /tmp/workspace/node_modules /tmp/workspace/backend/node_modules /tmp/workspace/apps/*/node_modules /tmp/workspace/packages/*/node_modules && cd /tmp/workspace && bun install --frozen-lockfile && bash tools/scripts/release/build_prebuilt.sh && chown -R "${HOST_UID}:${HOST_GID}" /output'
fi

command -v bun >/dev/null 2>&1 || {
  echo "bun is required." >&2
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
  "apiBaseUrl": "${api_base_url}",
  "publicWebDist": "apps/public_web/dist",
  "gitCommit": "${git_commit}",
  "createdAt": "${created_at}"
}
EOF

tar -czf "$archive_path" -C "$staging_dir" .

echo "Prebuilt release ready:"
echo "$archive_path"
