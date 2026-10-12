#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
compose_file="${MBC_DOCKER_COMPOSE_FILE:-${repo_root}/infra/docker/compose.yml}"
compose_env="${MBC_DOCKER_ENV_FILE:-${repo_root}/infra/docker/compose.env}"
backup_dir="${MBC_DOCKER_BACKUP_DIR:-${repo_root}/var/docker_backups}"
timestamp="$(date -u +%Y%m%d_%H%M%S)"
backup_path="${backup_dir}/mbc_walkwith_${timestamp}.dump"
partial_path="${backup_path}.partial"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required." >&2
  exit 1
}
[[ -f "$compose_env" ]] || {
  echo "Missing ${compose_env}." >&2
  exit 1
}
mkdir -p "$backup_dir"
trap 'rm -f "$partial_path"' EXIT

compose() {
  docker compose --env-file "$compose_env" --file "$compose_file" "$@"
}

database_name="$(sed -n 's/^POSTGRES_DB=//p' "$compose_env" | tail -n 1)"
database_user="$(sed -n 's/^POSTGRES_USER=//p' "$compose_env" | tail -n 1)"
database_name="${database_name:-mbc_walkwith}"
database_user="${database_user:-mbc_walkwith}"

compose exec -T postgres pg_dump \
  --username "$database_user" \
  --dbname "$database_name" \
  --format=custom > "$partial_path"

[[ -s "$partial_path" ]] || {
  echo "Backup is empty: ${partial_path}" >&2
  exit 1
}
mv "$partial_path" "$backup_path"
trap - EXIT
shasum -a 256 "$backup_path" > "${backup_path}.sha256"
echo "Database backup ready: ${backup_path}"
