#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
private_dir="${repo_root}/private/local"
backend_env="${private_dir}/backend.env"
admin_env="${private_dir}/admin_web.env"
public_env="${private_dir}/public_web.env"
mobile_config="${private_dir}/mobile.json"

usage() {
  cat <<'EOF'
Usage: local_environment.sh COMMAND [ARGS...]

Commands:
  init       Create missing private/local files from public examples.
  check      Validate local configuration without printing secret values.
  api        Run the backend with private/local/backend.env.
  admin      Run admin Web on http://127.0.0.1:5173.
  public     Run public Web on http://127.0.0.1:5174.
  web        Run API, admin Web, and public Web together.
  mobile     Run Flutter with private/local/mobile.json; forwards extra args.
  help       Show this help.

Private files are never overwritten by init and are excluded from Git.
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

copy_example() {
  local source="$1"
  local target="$2"
  if [[ -e "$target" ]]; then
    chmod 0600 "$target"
    printf 'Keeping existing %s\n' "${target#"${repo_root}/"}"
    return
  fi
  cp "$source" "$target"
  chmod 0600 "$target"
  printf 'Created %s\n' "${target#"${repo_root}/"}"
}

init_config() {
  mkdir -p "$private_dir"
  chmod 0700 "$private_dir"
  copy_example "${repo_root}/backend/.env.example" "$backend_env"
  copy_example "${repo_root}/apps/admin_web/.env.example" "$admin_env"
  copy_example "${repo_root}/apps/public_web/.env.example" "$public_env"
  copy_example "${repo_root}/apps/mobile/config/dart_defines.local.example.json" "$mobile_config"
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || die "Missing ${path#"${repo_root}/"}. Run 'bun run local:init' first."
}

env_value() {
  local file="$1"
  local key="$2"
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' "$file"
}

require_env_key() {
  local file="$1"
  local key="$2"
  [[ -n "$(env_value "$file" "$key")" ]] || die "${file#"${repo_root}/"} is missing ${key}."
}

validate_env_file() {
  local file="$1"
  require_file "$file"
  if ! awk '
    /^[[:space:]]*$/ { next }
    /^[[:space:]]*#/ { next }
    /^[A-Za-z_][A-Za-z0-9_]*=/ { next }
    { invalid = 1 }
    END { exit invalid }
  ' "$file"; then
    die "${file#"${repo_root}/"} contains an invalid environment line."
  fi
}

check_config() {
  validate_env_file "$backend_env"
  validate_env_file "$admin_env"
  validate_env_file "$public_env"
  require_file "$mobile_config"

  require_env_key "$backend_env" NODE_ENV
  require_env_key "$backend_env" PORT
  require_env_key "$backend_env" PUBLIC_API_BASE_URL
  require_env_key "$backend_env" ADMIN_WEB_ORIGIN
  require_env_key "$backend_env" USE_MOCK_DATA
  [[ "$(env_value "$backend_env" NODE_ENV)" == "development" ]] || die "Local backend NODE_ENV must be development."
  [[ "$(env_value "$backend_env" USE_MOCK_DATA)" =~ ^(true|false)$ ]] || die "USE_MOCK_DATA must be true or false."
  if [[ "$(env_value "$backend_env" USE_MOCK_DATA)" != "true" ]]; then
    require_env_key "$backend_env" DATABASE_URL
  fi
  require_env_key "$admin_env" VITE_API_BASE_URL
  require_env_key "$public_env" VITE_API_BASE_URL
  local backend_api_url admin_api_url public_api_url
  backend_api_url="$(env_value "$backend_env" PUBLIC_API_BASE_URL)"
  admin_api_url="$(env_value "$admin_env" VITE_API_BASE_URL)"
  public_api_url="$(env_value "$public_env" VITE_API_BASE_URL)"
  [[ "$backend_api_url" == http://* || "$backend_api_url" == https://* ]] || die "PUBLIC_API_BASE_URL must be an HTTP(S) URL."
  [[ "$admin_api_url" == "$backend_api_url" ]] || die "Admin VITE_API_BASE_URL must match backend PUBLIC_API_BASE_URL."
  [[ "$public_api_url" == "$backend_api_url" ]] || die "Public Web VITE_API_BASE_URL must match backend PUBLIC_API_BASE_URL."

  bun -e '
    const path = process.argv[1];
    const value = await Bun.file(path).json();
    const required = ["API_BASE_URL", "USE_MOCK_REMOTE_DATA", "DEBUG_MEMBER_AUTH_BYPASS"];
    for (const key of required) {
      if (!(key in value) || value[key] === "") throw new Error(`${path} is missing ${key}`);
    }
    if (typeof value.API_BASE_URL !== "string") throw new Error("API_BASE_URL must be a string");
    if (!/^https?:\/\//.test(value.API_BASE_URL)) throw new Error("API_BASE_URL must be an HTTP(S) URL");
    if (typeof value.USE_MOCK_REMOTE_DATA !== "boolean") throw new Error("USE_MOCK_REMOTE_DATA must be boolean");
    if (typeof value.DEBUG_MEMBER_AUTH_BYPASS !== "boolean") throw new Error("DEBUG_MEMBER_AUTH_BYPASS must be boolean");
  ' "$mobile_config"

  printf 'Local configuration is valid. Secret values were not printed.\n'
}

run_api() {
  check_config
  cd "$repo_root"
  exec bun --env-file="$backend_env" --watch backend/src/main.ts
}

run_admin() {
  check_config
  cd "${repo_root}/apps/admin_web"
  exec bun --env-file="$admin_env" run vite --host 127.0.0.1 --port 5173
}

run_public() {
  check_config
  cd "${repo_root}/apps/public_web"
  exec bun --env-file="$public_env" run vite --host 127.0.0.1 --port 5174
}

run_web() {
  check_config
  bash "$0" api &
  local api_pid=$!
  bash "$0" admin &
  local admin_pid=$!
  bash "$0" public &
  local public_pid=$!
  trap "kill ${api_pid} ${admin_pid} ${public_pid} 2>/dev/null || true" EXIT INT TERM
  while kill -0 "$api_pid" "$admin_pid" "$public_pid" 2>/dev/null; do
    sleep 1
  done
  kill "$api_pid" "$admin_pid" "$public_pid" 2>/dev/null || true
  local status=0
  wait "$api_pid" || status=$?
  wait "$admin_pid" || status=$?
  wait "$public_pid" || status=$?
  return "$status"
}

run_mobile() {
  check_config
  cd "${repo_root}/apps/mobile"
  exec flutter run --dart-define-from-file="$mobile_config" "$@"
}

command="${1:-help}"
shift || true
case "$command" in
  init) init_config ;;
  check) check_config ;;
  api) run_api ;;
  admin) run_admin ;;
  public) run_public ;;
  web) run_web ;;
  mobile) run_mobile "$@" ;;
  help|-h|--help) usage ;;
  *) die "Unknown command: ${command}. Run with 'help' for usage." ;;
esac
