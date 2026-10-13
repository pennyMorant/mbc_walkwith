#!/usr/bin/env bash
set -Eeuo pipefail

script_name="$(basename "$0")"
original_args=("$@")

if (($# == 0)); then
  command="menu"
elif [[ "$1" == "-h" || "$1" == "--help" || "$1" == "help" ]]; then
  command="help"
  shift
elif [[ "$1" == "--interactive" ]]; then
  command="menu"
  shift
elif [[ "$1" == "rollback" ]]; then
  command="rollback"
  shift
elif [[ "$1" == -* ]]; then
  command="menu"
else
  command="$1"
  shift
fi

app_name="mbc_walkwith"
installed_command_name="mbcwalkwith"
app_dir="/opt/mbc_walkwith"
api_port="3020"
db_name="mbc_walkwith"
db_user="mbc_walkwith"
service_user="${MBC_WALKWITH_SERVICE_USER:-mbcwalkwith}"
service_home="${MBC_WALKWITH_SERVICE_HOME:-}"
service_cache_dir="${MBC_WALKWITH_SERVICE_CACHE_DIR:-}"
public_repo_url="https://github.com/pennyMorant/mbc_walkwith.git"
public_release_url="https://github.com/pennyMorant/mbc_walkwith/releases/download/deployment-latest/mbc_walkwith_linux_x64.tar.gz"
repo_url="${MBC_WALKWITH_REPO_URL:-$public_repo_url}"
git_ref="${MBC_WALKWITH_GIT_REF:-main}"
admin_origin=""
api_origin=""
public_origin=""
certbot_email=""
certbot_method="auto"
assume_yes="false"
run_check="false"
skip_migrate="false"
skip_build="false"
skip_healthcheck="false"
keep_releases="5"
remove_database="false"
remove_ssl="false"
app_dir_from_cli="false"
api_port_from_cli="false"
repo_url_from_cli="false"
git_ref_from_cli="false"
admin_origin_from_cli="false"
api_origin_from_cli="false"
public_origin_from_cli="false"
service_user_from_cli="false"
declare -a positional_args=()

usage() {
  cat <<EOF
Usage:
  ${script_name} [command] [options]

Commands:
  menu                    Show an interactive menu. Default.
  install                 Install runtime dependencies, config, and services.
  deploy                  Deploy or update the application from Git.
  deploy-prebuilt FILE    Deploy a local-built linux-x64 release tarball.
  deploy-release [URL]    Download, verify, and deploy a GitHub release artifact.
  rollback                Roll back current to the previous or specified release.
  status                  Show service, release, and health status.
  logs TARGET             Show journal logs for api or nginx.
  backup-init             Initialize the encrypted backup repository and timers.
  backup-now              Run one PostgreSQL backup immediately.
  backup-status           Show backup timer and latest snapshot status.
  backup-verify           Verify the encrypted backup repository.
  ssl                     Configure nginx and request HTTPS certificates.
  cleanup-releases        Remove old release directories while keeping recent ones.
  sync-source             Refresh the managed source checkout.
  upgrade-script          Refresh the installed mbcwalkwith command from source.
  upgrade                 Upgrade system/runtime packages only.
  uninstall               Remove services, config, and release directories.

Common options:
  --repo-url URL          Git repository URL. Defaults to the public MBC WalkWith repository.
  --git-ref REF           Git branch, tag, or ref. Default: main.
  --app-dir PATH          Install root. Default: /opt/mbc_walkwith.
  --api-port PORT         Local API port. Default: 3020.
  --admin-origin ORIGIN   Admin web origin, e.g. https://admin.example.com
  --api-origin ORIGIN     API origin, e.g. https://api.example.com
  --public-origin ORIGIN  Optional public origin, e.g. https://www.example.com
  --admin-domain DOMAIN   Alias for --admin-origin https://DOMAIN
  --api-domain DOMAIN     Alias for --api-origin https://DOMAIN
  --public-domain DOMAIN  Alias for --public-origin https://DOMAIN
  --email EMAIL           Let's Encrypt account email.
  --certbot-method MODE   Certbot install method. Supported: auto, snap, venv, apt, none.
  --service-user USER     Linux service user. Default: mbcwalkwith.
  --db-name NAME          PostgreSQL database name. Default: mbc_walkwith.
  --db-user NAME          PostgreSQL role name. Default: mbc_walkwith.
  --check                 Run workspace checks before deploy.
  --skip-migrate          Skip database migrations during deploy.
  --skip-build            Skip bun build during source deploy.
  --skip-healthcheck      Skip local health check after deploy.
  --keep-releases N       Keep this many newest releases. Default: 5.
  --remove-database       Drop the PostgreSQL database and role on uninstall.
  --remove-ssl            Delete Let's Encrypt certificates on uninstall.
  -y, --yes              Assume yes for prompts.
  -h, --help             Show this help.

Notes:
  - This script currently supports Debian/Ubuntu only.
  - It manages API, admin web static files, and public landing static files.
  - Use deploy-release for small VPS instances. GitHub Actions builds the API,
    admin Web, public Web, and migration runtime; the VPS downloads no source.
  - It does not deploy or manage the local sermon processing workstation.
  - Database backups require /etc/mbc_walkwith/backup.env to be configured
    with an independent private R2 bucket before running backup-init.
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

log() {
  printf '\n==> %s\n' "$*"
}

shell_quote() {
  printf "%q" "$1"
}

prompt_value() {
  local label="$1"
  local current="$2"
  local value

  if [[ -n "$current" ]]; then
    read -r -p "${label} [${current}]: " value
    printf '%s' "${value:-$current}"
  else
    read -r -p "${label}: " value
    printf '%s' "$value"
  fi
}

confirm() {
  local message="$1"
  local answer

  if [[ "$assume_yes" == "true" ]]; then
    return 0
  fi

  read -r -p "${message} Type yes to continue: " answer
  [[ "$answer" == "yes" ]]
}

parse_options() {
  while (($#)); do
    case "$1" in
      --repo-url)
        repo_url="${2:-}"
        repo_url_from_cli="true"
        shift 2
        ;;
      --git-ref|--branch|--ref)
        git_ref="${2:-}"
        git_ref_from_cli="true"
        shift 2
        ;;
      --app-dir)
        app_dir="${2:-}"
        app_dir_from_cli="true"
        shift 2
        ;;
      --api-port)
        api_port="${2:-}"
        api_port_from_cli="true"
        shift 2
        ;;
      --admin-origin)
        admin_origin="${2:-}"
        admin_origin_from_cli="true"
        shift 2
        ;;
      --api-origin)
        api_origin="${2:-}"
        api_origin_from_cli="true"
        shift 2
        ;;
      --public-origin)
        public_origin="${2:-}"
        public_origin_from_cli="true"
        shift 2
        ;;
      --admin-domain)
        admin_origin="$(domain_to_https_origin "${2:-}")"
        admin_origin_from_cli="true"
        shift 2
        ;;
      --api-domain)
        api_origin="$(domain_to_https_origin "${2:-}")"
        api_origin_from_cli="true"
        shift 2
        ;;
      --public-domain)
        public_origin="$(domain_to_https_origin "${2:-}")"
        public_origin_from_cli="true"
        shift 2
        ;;
      --email)
        certbot_email="${2:-}"
        shift 2
        ;;
      --certbot-method)
        certbot_method="${2:-}"
        shift 2
        ;;
      --service-user)
        service_user="${2:-}"
        service_user_from_cli="true"
        shift 2
        ;;
      --db-name)
        db_name="${2:-}"
        shift 2
        ;;
      --db-user)
        db_user="${2:-}"
        shift 2
        ;;
      --check)
        run_check="true"
        shift
        ;;
      --skip-migrate)
        skip_migrate="true"
        shift
        ;;
      --skip-build)
        skip_build="true"
        shift
        ;;
      --skip-healthcheck)
        skip_healthcheck="true"
        shift
        ;;
      --keep-releases)
        keep_releases="${2:-}"
        shift 2
        ;;
      --remove-database)
        remove_database="true"
        shift
        ;;
      --remove-ssl)
        remove_ssl="true"
        shift
        ;;
      -y|--yes)
        assume_yes="true"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        positional_args+=("$1")
        shift
        ;;
    esac
  done
}

discover_repo_url() {
  if [[ -n "$repo_url" ]]; then
    return
  fi

  local candidate_root=""
  if command -v git >/dev/null 2>&1; then
    candidate_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  fi
  if [[ -n "$candidate_root" ]]; then
    repo_url="$(git -C "$candidate_root" config --get remote.origin.url || true)"
  fi
}

validate_common_options() {
  [[ "$api_port" =~ ^[0-9]+$ ]] || die "--api-port must be numeric."
  [[ "$db_name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || die "--db-name must be a safe PostgreSQL identifier."
  [[ "$db_user" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || die "--db-user must be a safe PostgreSQL identifier."
  [[ "$service_user" =~ ^[a-z_][a-z0-9_-]*[$]?$ ]] || die "--service-user must be a safe Linux user name."
  [[ "$service_user" != "root" ]] || die "--service-user cannot be root."
  validate_managed_directory "--app-dir" "$app_dir"
  [[ -z "$service_home" ]] || validate_managed_directory "--service-home" "$service_home"
  [[ -z "$service_cache_dir" ]] || validate_managed_directory "--service-cache-dir" "$service_cache_dir"
  [[ "$certbot_method" =~ ^(auto|snap|venv|apt|none)$ ]] || die "--certbot-method must be auto, snap, venv, apt, or none."
  [[ "$keep_releases" =~ ^[0-9]+$ ]] || die "--keep-releases must be numeric."
  [[ "$keep_releases" -ge 1 ]] || die "--keep-releases must be at least 1."
}

normalize_origin() {
  local value="${1:-}"
  if [[ -z "$value" ]]; then
    printf ''
    return 0
  fi
  value="${value%/}"
  printf '%s' "$value"
}

domain_to_https_origin() {
  local value="${1:-}"
  if [[ -z "$value" ]]; then
    printf ''
    return 0
  fi
  value="${value%/}"
  if [[ "$value" == http://* || "$value" == https://* ]]; then
    printf '%s' "$value"
  else
    printf 'https://%s' "$value"
  fi
}

origin_to_domain() {
  local origin
  origin="$(normalize_origin "$1")"
  origin="${origin#http://}"
  origin="${origin#https://}"
  origin="${origin%%/*}"
  if [[ "$origin" == *:* && "$origin" != \[* ]]; then
    origin="${origin%%:*}"
  fi
  printf '%s' "$origin"
}

validate_managed_directory() {
  local label="$1"
  local value="$2"
  local canonical
  [[ -n "$value" ]] || die "${label} cannot be empty."
  [[ "$value" == /* ]] || die "${label} must be an absolute path."
  canonical="$(realpath -m -- "$value")"
  [[ "$value" == "$canonical" ]] || die "${label} must be a canonical path without symlinks, dot segments, or duplicate separators: ${canonical}"
  case "$canonical" in
    /|/bin|/boot|/dev|/etc|/home|/lib|/lib64|/opt|/proc|/root|/run|/sbin|/sys|/tmp|/usr|/var)
      die "${label} points to a system directory: ${canonical}"
      ;;
  esac
}

admin_web_base_path() {
  local admin_domain api_domain public_domain
  admin_domain="$(origin_to_domain "$admin_origin")"
  api_domain="$(origin_to_domain "$api_origin")"
  public_domain="$(origin_to_domain "$public_origin")"

  if [[ -n "$admin_domain" && ( "$admin_domain" == "$api_domain" || "$admin_domain" == "$public_domain" ) ]]; then
    printf '/admin/'
  else
    printf '/'
  fi
}

current_web_build_matches_origins() {
  local current_release expected_api_base_url expected_admin_base_path
  current_release="$(readlink -f "${app_dir}/current" 2>/dev/null || true)"
  [[ -z "$current_release" || ! -d "$current_release" ]] && return 0
  expected_api_base_url="$(api_base_url_from_origin "$api_origin")"
  [[ -n "$expected_api_base_url" ]] || expected_api_base_url="http://127.0.0.1:${api_port}/v1"
  expected_admin_base_path="$(admin_web_base_path)"

  if [[ -f "${current_release}/release-manifest.json" ]]; then
    python3 - "${current_release}/release-manifest.json" "$expected_api_base_url" "$expected_admin_base_path" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    manifest = json.load(handle)
raise SystemExit(0 if (
    manifest.get("apiBaseUrl") == sys.argv[2]
    and manifest.get("adminBasePath") == sys.argv[3]
) else 1)
PY
    return
  fi

  [[ -f "${current_release}/.web-build-env" ]] || return 1
  grep -Fqx "API_BASE_URL=${expected_api_base_url}" "${current_release}/.web-build-env" \
    && grep -Fqx "ADMIN_BASE_PATH=${expected_admin_base_path}" "${current_release}/.web-build-env"
}

validate_tarball_entries() {
  local artifact_path="$1"
  tar -tzf "$artifact_path" | while IFS= read -r entry; do
    [[ -n "$entry" ]] || continue
    if [[ "$entry" == /* || "$entry" == ".." || "$entry" == "../"* || "$entry" == *"/../"* || "$entry" == *"/.." ]]; then
      echo "Unsafe path in prebuilt tarball: ${entry}" >&2
      exit 1
    fi
  done
}

deploy_release_artifact() {
  local artifact_url="${positional_args[0]:-$public_release_url}"
  [[ "$artifact_url" == https://* ]] || die "deploy-release requires an HTTPS artifact URL."

  local download_dir archive_path checksum_path quoted_download_dir
  download_dir="$(mktemp -d /tmp/mbcwalkwith-release.XXXXXX)"
  printf -v quoted_download_dir '%q' "$download_dir"
  trap "rm -rf ${quoted_download_dir}" EXIT INT TERM
  archive_path="${download_dir}/mbc_walkwith_linux_x64.tar.gz"
  checksum_path="${archive_path}.sha256"

  log "Downloading prebuilt release"
  if ! curl \
    --fail \
    --location \
    --proto '=https' \
    --retry 3 \
    --retry-all-errors \
    --silent \
    --show-error \
    --output "$archive_path" \
    "$artifact_url"; then
    die "Failed to download release artifact."
  fi
  if ! curl \
    --fail \
    --location \
    --proto '=https' \
    --retry 3 \
    --retry-all-errors \
    --silent \
    --show-error \
    --output "$checksum_path" \
    "${artifact_url}.sha256"; then
    die "Failed to download release checksum."
  fi

  log "Verifying release checksum"
  if ! grep -Eq '^[0-9a-fA-F]{64}  mbc_walkwith_linux_x64\.tar\.gz$' "$checksum_path"; then
    die "Release checksum file has an unexpected format."
  fi
  if ! (cd "$download_dir" && sha256sum --check "$(basename "$checksum_path")"); then
    die "Release checksum verification failed."
  fi

  positional_args=("$archive_path")
  deploy_prebuilt_app
  rm -rf "$download_dir"
  trap - EXIT INT TERM
}

api_base_url_from_origin() {
  local origin
  origin="$(normalize_origin "$1")"
  [[ -n "$origin" ]] || {
    printf ''
    return 0
  }
  printf '%s/v1' "$origin"
}

validate_backend_env_file() {
  local env_file="/etc/mbc_walkwith/backend.env"
  [[ -f "$env_file" ]] || die "Missing ${env_file}. Run install first."

  local database_url media_driver admin_secret member_secret use_mock_data
  database_url="$(read_env_value "$env_file" "DATABASE_URL")"
  media_driver="$(read_env_value "$env_file" "MEDIA_STORAGE_DRIVER")"
  admin_secret="$(read_env_value "$env_file" "auth_secret")"
  member_secret="$(read_env_value "$env_file" "app_user_auth_secret")"
  use_mock_data="$(read_env_value "$env_file" "USE_MOCK_DATA")"

  [[ -n "$database_url" ]] || die "DATABASE_URL must be set in ${env_file}."
  [[ "$use_mock_data" != "true" ]] || die "USE_MOCK_DATA=true is not allowed for VPS deployment."
  [[ "$admin_secret" != "dev-only-change-me-minimum-32-characters" ]] || die "auth_secret must be rotated in ${env_file}."
  [[ "$member_secret" != "dev-only-change-me-minimum-32-characters" ]] || die "app_user_auth_secret must be rotated in ${env_file}."

  if [[ "$media_driver" == "s3" ]]; then
    local s3_bucket s3_access_key s3_secret
    s3_bucket="$(read_env_value "$env_file" "S3_BUCKET")"
    s3_access_key="$(read_env_value "$env_file" "S3_ACCESS_KEY_ID")"
    s3_secret="$(read_env_value "$env_file" "S3_SECRET_ACCESS_KEY")"
    [[ -n "$s3_bucket" ]] || die "S3_BUCKET must be set when MEDIA_STORAGE_DRIVER=s3."
    [[ -n "$s3_access_key" ]] || die "S3_ACCESS_KEY_ID must be set when MEDIA_STORAGE_DRIVER=s3."
    [[ -n "$s3_secret" ]] || die "S3_SECRET_ACCESS_KEY must be set when MEDIA_STORAGE_DRIVER=s3."
  fi
}

init_runtime() {
  if [[ ! -r /etc/os-release ]]; then
    die "/etc/os-release is missing; this script supports Debian/Ubuntu only."
  fi

  . /etc/os-release
  case "${ID:-}" in
    ubuntu|debian)
      os_id="$ID"
      ;;
    *)
      die "Unsupported OS: ${PRETTY_NAME:-unknown}. Use Debian or Ubuntu."
      ;;
  esac

  if ! command -v sudo >/dev/null 2>&1 && [[ "$(id -u)" -ne 0 ]]; then
    die "sudo is required when running as a non-root user."
  fi

  if [[ "$(id -u)" -eq 0 ]]; then
    SUDO=()
  else
    SUDO=(sudo)
  fi

  deploy_user="${SUDO_USER:-$(id -un)}"
  deploy_home="$(getent passwd "$deploy_user" | cut -d: -f6)"
  [[ -n "$deploy_home" ]] || die "Cannot resolve home directory for ${deploy_user}."
  if [[ -z "$service_home" ]]; then
    service_home="${app_dir}/.home"
  fi
  if [[ -z "$service_cache_dir" ]]; then
    service_cache_dir="${app_dir}/.cache"
  fi

  export BUN_INSTALL="${MBC_WALKWITH_BUN_INSTALL:-${app_dir}/.bun}"
  export PATH="${BUN_INSTALL}/bin:${PATH}"

  if id -u "$service_user" >/dev/null 2>&1; then
    service_group="$(id -gn "$service_user")"
  else
    service_group="$service_user"
  fi
}

run_as_deploy_user() {
  run_as_user "$deploy_user" "$@"
}

run_as_user() {
  local target_user="$1"
  shift
  if [[ "$(id -un)" == "$target_user" ]]; then
    "$@"
  elif [[ "$(id -u)" -eq 0 ]]; then
    runuser -u "$target_user" -- "$@"
  else
    "${SUDO[@]}" -u "$target_user" -- "$@"
  fi
}

run_shell_as_deploy_user() {
  local cwd="$1"
  local cmd="$2"
  local quoted_cwd
  printf -v quoted_cwd '%q' "$cwd"
  local shell_cmd="cd ${quoted_cwd} && ${cmd}"

  run_as_user "$deploy_user" env \
    HOME="$deploy_home" \
    XDG_CACHE_HOME="$service_cache_dir" \
    BUN_INSTALL="$BUN_INSTALL" \
    PATH="${BUN_INSTALL}/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c "$shell_cmd"
}

run_release_shell_with_env() {
  local cwd="$1"
  local cmd="$2"
  local env_file="/etc/mbc_walkwith/backend.env"
  local quoted_cwd quoted_env
  printf -v quoted_cwd '%q' "$cwd"
  printf -v quoted_env '%q' "$env_file"
  local shell_cmd="set -a && source ${quoted_env} && set +a && cd ${quoted_cwd} && ${cmd}"

  run_as_user "$service_user" env \
    HOME="$service_home" \
    XDG_CACHE_HOME="$service_cache_dir" \
    BUN_INSTALL="$BUN_INSTALL" \
    PATH="${BUN_INSTALL}/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c "$shell_cmd"
}

as_postgres() {
  if [[ "$(id -u)" -eq 0 ]]; then
    runuser -u postgres -- "$@"
  else
    "${SUDO[@]}" -u postgres "$@"
  fi
}

ensure_service_user() {
  if id -u "$service_user" >/dev/null 2>&1; then
    service_group="$(id -gn "$service_user")"
    return
  fi

  log "Creating ${service_user} service user"
  "${SUDO[@]}" useradd \
    --system \
    --user-group \
    --home-dir "$service_home" \
    --shell /usr/sbin/nologin \
    "$service_user"
  service_group="$(id -gn "$service_user")"
}

install_base_tooling() {
  log "Installing base tooling"
  "${SUDO[@]}" apt-get update
  "${SUDO[@]}" apt-get install -y \
    ca-certificates \
    curl \
    git \
    nginx \
    openssl \
    postgresql \
    postgresql-client \
    python3 \
    python3-venv \
    restic \
    unzip
}

install_bun() {
  if [[ -x "${BUN_INSTALL}/bin/bun" ]]; then
    return
  fi

  log "Installing Bun to ${BUN_INSTALL}"
  "${SUDO[@]}" install -d -m 0755 -o "$deploy_user" -g "$deploy_user" "$BUN_INSTALL"
  run_as_deploy_user env BUN_INSTALL="$BUN_INSTALL" bash -lc 'curl -fsSL https://bun.sh/install | bash'
}

sync_source() {
  discover_repo_url
  [[ -n "$repo_url" ]] || die "--repo-url is required or must be discoverable from the current checkout."

  local source_dir="${app_dir}/source"
  log "Syncing managed source checkout"
  "${SUDO[@]}" install -d -m 0755 -o "$deploy_user" -g "$deploy_user" "$app_dir"

  if [[ ! -d "${source_dir}/.git" ]]; then
    rm -rf "$source_dir"
    run_as_deploy_user git clone --no-checkout "$repo_url" "$source_dir"
  else
    "${SUDO[@]}" chown -R "${deploy_user}:${deploy_user}" "$source_dir"
    run_shell_as_deploy_user "$source_dir" "git remote set-url origin $(shell_quote "$repo_url")"
  fi

  run_shell_as_deploy_user "$source_dir" "git fetch --prune --tags origin $(shell_quote "$git_ref")"
  run_shell_as_deploy_user "$source_dir" "git checkout --detach FETCH_HEAD"
  [[ -f "${source_dir}/tools/scripts/vps/mbc_walkwith.sh" ]] || die "Managed source checkout is missing tools/scripts/vps/mbc_walkwith.sh"
}

write_installed_command() {
  local source_script="${app_dir}/source/tools/scripts/vps/mbc_walkwith.sh"
  local source_backup_script="${app_dir}/source/tools/scripts/vps/mbc_walkwith_backup.sh"
  local target_script="/usr/local/bin/${installed_command_name}"
  local target_backup_script="/usr/local/libexec/mbcwalkwith_backup"

  [[ -f "$source_script" ]] || die "Missing ${source_script}. Run sync-source first."
  [[ -f "$source_backup_script" ]] || die "Missing ${source_backup_script}. Run sync-source first."
  log "Installing ${installed_command_name} command"
  "${SUDO[@]}" install -m 0755 "$source_script" "$target_script"
  "${SUDO[@]}" install -d -m 0755 /usr/local/libexec
  "${SUDO[@]}" install -m 0755 "$source_backup_script" "$target_backup_script"
}

install_packaged_commands() {
  local release_dir="$1"
  local packaged_command="${release_dir}/deployment/mbcwalkwith"
  local packaged_backup="${release_dir}/deployment/mbcwalkwith_backup"

  [[ -x "$packaged_command" ]] || die "Release is missing deployment/mbcwalkwith."
  [[ -x "$packaged_backup" ]] || die "Release is missing deployment/mbcwalkwith_backup."
  log "Updating installed deployment commands"
  "${SUDO[@]}" install -m 0755 "$packaged_command" "/usr/local/bin/${installed_command_name}"
  "${SUDO[@]}" install -d -m 0755 /usr/local/libexec
  "${SUDO[@]}" install -m 0755 "$packaged_backup" /usr/local/libexec/mbcwalkwith_backup
}

prepare_app_dirs() {
  log "Preparing application directories"
  "${SUDO[@]}" install -d -m 0755 -o "$deploy_user" -g "$deploy_user" "$app_dir"
  "${SUDO[@]}" install -d -m 0755 -o "$deploy_user" -g "$deploy_user" "${app_dir}/releases"
  "${SUDO[@]}" install -d -m 0750 -o "$service_user" -g "$service_group" "$service_home"
  "${SUDO[@]}" install -d -m 0750 -o "$service_user" -g "$service_group" "$service_cache_dir"
  "${SUDO[@]}" install -d -m 0750 -o "$service_user" -g "$service_group" /var/lib/mbc_walkwith/uploads
  "${SUDO[@]}" install -d -m 0750 -o root -g "$service_group" /etc/mbc_walkwith
}

prepare_database() {
  log "Preparing PostgreSQL database"
  "${SUDO[@]}" systemctl enable --now postgresql
  "${SUDO[@]}" install -d -m 0750 -o root -g "$service_group" /etc/mbc_walkwith

  local db_password_file="/etc/mbc_walkwith/db-password"
  if [[ ! -f "$db_password_file" ]]; then
    openssl rand -hex 32 > /tmp/mbcwalkwith-db-password
    "${SUDO[@]}" install -m 0600 -o root -g root /tmp/mbcwalkwith-db-password "$db_password_file"
    rm -f /tmp/mbcwalkwith-db-password
  fi
  local db_password
  db_password="$("${SUDO[@]}" cat "$db_password_file")"

  local role_exists db_exists
  role_exists="$(as_postgres psql -tAc "select 1 from pg_roles where rolname='${db_user}'" || true)"
  if [[ "$role_exists" != "1" ]]; then
    as_postgres psql -c "create role \"${db_user}\" login password '${db_password}';"
  else
    as_postgres psql -c "alter role \"${db_user}\" with password '${db_password}';"
  fi

  db_exists="$(as_postgres psql -tAc "select 1 from pg_database where datname='${db_name}'" || true)"
  if [[ "$db_exists" != "1" ]]; then
    as_postgres createdb -O "$db_user" "$db_name"
  fi
}

update_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  if "${SUDO[@]}" grep -q "^${key}=" "$file"; then
    "${SUDO[@]}" sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" | "${SUDO[@]}" tee -a "$file" >/dev/null
  fi
}

read_env_value() {
  local file="$1"
  local key="$2"
  "${SUDO[@]}" awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' "$file" 2>/dev/null || true
}

write_env_files() {
  log "Writing environment files"
  local db_password_file="/etc/mbc_walkwith/db-password"
  [[ -f "$db_password_file" ]] || die "Missing ${db_password_file}. Run install first."
  local db_password
  db_password="$("${SUDO[@]}" cat "$db_password_file")"

  local backend_env="/etc/mbc_walkwith/backend.env"
  if [[ ! -f "$backend_env" ]]; then
    local admin_jwt_secret member_jwt_secret dev_admin_password
    admin_jwt_secret="$(openssl rand -hex 48)"
    member_jwt_secret="$(openssl rand -hex 48)"
    dev_admin_password="$(openssl rand -hex 16)"

    cat > /tmp/mbcwalkwith-backend.env <<EOF
# Generated backend runtime configuration
NODE_ENV=production
PORT=${api_port}
HOST=127.0.0.1
PUBLIC_API_BASE_URL=http://127.0.0.1:${api_port}/v1
ADMIN_WEB_ORIGIN=http://127.0.0.1
USE_MOCK_DATA=false

DATABASE_URL=postgres://${db_user}:${db_password}@127.0.0.1:5432/${db_name}
REDIS_URL=

MEDIA_STORAGE_DRIVER=local
MEDIA_UPLOAD_DIR=/var/lib/mbc_walkwith/uploads
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=true

# Sermon transcription, outline generation, and Scripture extraction run on the
# local sermon workstation. The VPS only stores reviewed local packages.

auth_secret=${admin_jwt_secret}
app_user_auth_secret=${member_jwt_secret}
DEV_ADMIN_EMAIL=admin@mbc.local
DEV_ADMIN_PASSWORD=${dev_admin_password}
BOOTSTRAP_DEV_ADMIN=true

# Set this with a single-line JSON string, for example:
# FCM_SERVICE_ACCOUNT_JSON=$(jq -c . service-account.json)
FCM_SERVICE_ACCOUNT_JSON=
# Optional dedicated credential for Firebase Auth; when empty, FCM JSON is reused.
FIREBASE_SERVICE_ACCOUNT_JSON=
MEMBER_AUTH_RATE_LIMIT_WINDOW_MS=60000
MEMBER_AUTH_RATE_LIMIT_PER_WINDOW=10
FCM_HTTP_TIMEOUT_MS=10000
EOF
    "${SUDO[@]}" install -m 0640 -o root -g "$service_group" /tmp/mbcwalkwith-backend.env "$backend_env"
    rm -f /tmp/mbcwalkwith-backend.env
  fi

  local runtime_admin_origin runtime_api_base_url
  runtime_admin_origin="$(normalize_origin "$admin_origin")"
  runtime_api_base_url="$(api_base_url_from_origin "$api_origin")"
  [[ -n "$runtime_admin_origin" ]] || runtime_admin_origin="http://127.0.0.1"
  [[ -n "$runtime_api_base_url" ]] || runtime_api_base_url="http://127.0.0.1:${api_port}/v1"
  update_env_value "$backend_env" "PORT" "$api_port"
  update_env_value "$backend_env" "HOST" "127.0.0.1"
  update_env_value "$backend_env" "PUBLIC_API_BASE_URL" "$runtime_api_base_url"
  update_env_value "$backend_env" "ADMIN_WEB_ORIGIN" "$runtime_admin_origin"
  update_env_value "$backend_env" "USE_MOCK_DATA" "false"
  update_env_value "$backend_env" "DATABASE_URL" "postgres://${db_user}:${db_password}@127.0.0.1:5432/${db_name}"
  local configured_media_driver configured_media_upload_dir
  configured_media_driver="$(read_env_value "$backend_env" "MEDIA_STORAGE_DRIVER")"
  configured_media_upload_dir="$(read_env_value "$backend_env" "MEDIA_UPLOAD_DIR")"
  if [[ "$configured_media_driver" == "local" && ( -z "$configured_media_upload_dir" || "$configured_media_upload_dir" == "uploads" ) ]]; then
    update_env_value "$backend_env" "MEDIA_UPLOAD_DIR" "/var/lib/mbc_walkwith/uploads"
  fi

  local deploy_env="/etc/mbc_walkwith/deploy.env"
  cat > /tmp/mbcwalkwith-deploy.env <<EOF
MBC_WALKWITH_APP_DIR=$(shell_quote "$app_dir")
MBC_WALKWITH_API_PORT=$(shell_quote "$api_port")
MBC_WALKWITH_REPO_URL=$(shell_quote "$repo_url")
MBC_WALKWITH_GIT_REF=$(shell_quote "$git_ref")
MBC_WALKWITH_ADMIN_ORIGIN=$(shell_quote "$(normalize_origin "$admin_origin")")
MBC_WALKWITH_API_ORIGIN=$(shell_quote "$(normalize_origin "$api_origin")")
MBC_WALKWITH_PUBLIC_ORIGIN=$(shell_quote "$(normalize_origin "$public_origin")")
MBC_WALKWITH_SERVICE_USER=$(shell_quote "$service_user")
MBC_WALKWITH_SERVICE_HOME=$(shell_quote "$service_home")
MBC_WALKWITH_SERVICE_CACHE_DIR=$(shell_quote "$service_cache_dir")
MBC_WALKWITH_BUN_INSTALL=$(shell_quote "$BUN_INSTALL")
EOF
  "${SUDO[@]}" install -m 0640 -o root -g "$service_group" /tmp/mbcwalkwith-deploy.env "$deploy_env"
  rm -f /tmp/mbcwalkwith-deploy.env

  write_backup_env_file
}

write_backup_env_file() {
  local backup_env="/etc/mbc_walkwith/backup.env"
  local restic_password_file="/etc/mbc_walkwith/backup-restic-password"
  if [[ ! -f "$restic_password_file" ]]; then
    openssl rand -hex 48 > /tmp/mbcwalkwith-backup-restic-password
    "${SUDO[@]}" install -m 0600 -o root -g root /tmp/mbcwalkwith-backup-restic-password "$restic_password_file"
    rm -f /tmp/mbcwalkwith-backup-restic-password
  fi

  if [[ -f "$backup_env" ]]; then
    return
  fi

  cat > /tmp/mbcwalkwith-backup.env <<EOF
# PostgreSQL backup configuration. Keep this file root-readable only.
# Configure an independent private R2 bucket and then run: mbcwalkwith backup-init
BACKUP_ENABLED=false
BACKUP_DATABASE_NAME=${db_name}
BACKUP_RESTIC_REPOSITORY=
RESTIC_PASSWORD_FILE=${restic_password_file}
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=auto
BACKUP_TIMEZONE=America/Los_Angeles
BACKUP_ALERT_ENABLED=false
BACKUP_ALERT_TO=
BACKUP_ALERT_FROM=
BACKUP_ALERT_RESEND_API_KEY=
EOF
  "${SUDO[@]}" install -m 0600 -o root -g root /tmp/mbcwalkwith-backup.env "$backup_env"
  rm -f /tmp/mbcwalkwith-backup.env
}

write_systemd_services() {
  log "Writing systemd services"
  local backend_env="/etc/mbc_walkwith/backend.env"
  local bun_bin="${BUN_INSTALL}/bin/bun"
  [[ -x "$bun_bin" ]] || die "Bun is missing at ${bun_bin}."

  cat > /tmp/mbcwalkwith-api.service <<EOF
[Unit]
Description=MBC WalkWith API
Wants=network-online.target
After=network-online.target postgresql.service

[Service]
Type=simple
User=${service_user}
WorkingDirectory=${app_dir}/current
EnvironmentFile=${backend_env}
Environment=HOME=${service_home}
Environment=XDG_CACHE_HOME=${service_cache_dir}
Environment=PATH=${BUN_INSTALL}/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/bin/bash -c 'cd ${app_dir}/current && if [[ -f backend_dist/main.js ]]; then exec ${bun_bin} backend_dist/main.js; fi; exec ${bun_bin} run start:api'
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-api.service /etc/systemd/system/mbcwalkwith-api.service
  rm -f /tmp/mbcwalkwith-api.service

  write_backup_systemd_units

  "${SUDO[@]}" systemctl daemon-reload
  "${SUDO[@]}" systemctl enable mbcwalkwith-api
}

backup_timezone() {
  local backup_env="/etc/mbc_walkwith/backup.env"
  local timezone="America/Los_Angeles"
  if [[ -f "$backup_env" ]]; then
    timezone="$(grep '^BACKUP_TIMEZONE=' "$backup_env" | cut -d= -f2- || true)"
    timezone="${timezone:-America/Los_Angeles}"
  fi
  [[ "$timezone" =~ ^[A-Za-z0-9_.+-]+(/[A-Za-z0-9_.+-]+)+$ ]] || die "BACKUP_TIMEZONE must be an IANA timezone, such as America/Los_Angeles."
  [[ -f "/usr/share/zoneinfo/${timezone}" ]] || die "BACKUP_TIMEZONE is not installed on this server: ${timezone}."
  if command -v systemd-analyze >/dev/null 2>&1; then
    systemd-analyze calendar "*-*-* 02:30:00 ${timezone}" >/dev/null || die "BACKUP_TIMEZONE is not accepted by systemd: ${timezone}."
  fi
  printf '%s' "$timezone"
}

write_backup_systemd_units() {
  local backup_helper="/usr/local/libexec/mbcwalkwith_backup"
  local timezone
  timezone="$(backup_timezone)"

  cat > /tmp/mbcwalkwith-backup.service <<EOF
[Unit]
Description=MBC WalkWith PostgreSQL backup
Wants=network-online.target
After=network-online.target postgresql.service

[Service]
Type=oneshot
User=root
UMask=0077
ExecStart=${backup_helper} run
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/mbc_walkwith/backup /var/lib/mbc_walkwith/restore /etc/mbc_walkwith
EOF
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-backup.service /etc/systemd/system/mbcwalkwith-backup.service
  rm -f /tmp/mbcwalkwith-backup.service

  cat > /tmp/mbcwalkwith-backup.timer <<EOF
[Unit]
Description=Daily MBC WalkWith PostgreSQL backup

[Timer]
OnCalendar=*-*-* 02:30:00 ${timezone}
Persistent=true
RandomizedDelaySec=10m
Unit=mbcwalkwith-backup.service

[Install]
WantedBy=timers.target
EOF
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-backup.timer /etc/systemd/system/mbcwalkwith-backup.timer
  rm -f /tmp/mbcwalkwith-backup.timer

  cat > /tmp/mbcwalkwith-backup-restore.service <<EOF
[Unit]
Description=MBC WalkWith PostgreSQL backup restore verification
Wants=network-online.target
After=network-online.target postgresql.service

[Service]
Type=oneshot
User=root
UMask=0077
ExecStart=${backup_helper} restore-verify
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/mbc_walkwith/backup /var/lib/mbc_walkwith/restore /etc/mbc_walkwith
EOF
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-backup-restore.service /etc/systemd/system/mbcwalkwith-backup-restore.service
  rm -f /tmp/mbcwalkwith-backup-restore.service

  cat > /tmp/mbcwalkwith-backup-verify.service <<EOF
[Unit]
Description=MBC WalkWith encrypted backup repository verification
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=root
UMask=0077
ExecStart=${backup_helper} verify
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/mbc_walkwith/backup /var/lib/mbc_walkwith/restore /etc/mbc_walkwith
EOF
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-backup-verify.service /etc/systemd/system/mbcwalkwith-backup-verify.service
  rm -f /tmp/mbcwalkwith-backup-verify.service

  cat > /tmp/mbcwalkwith-backup-restore.timer <<EOF
[Unit]
Description=Monthly MBC WalkWith PostgreSQL backup restore verification

[Timer]
OnCalendar=*-*-01 04:00:00 ${timezone}
Persistent=true
RandomizedDelaySec=15m
Unit=mbcwalkwith-backup-restore.service

[Install]
WantedBy=timers.target
EOF
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-backup-restore.timer /etc/systemd/system/mbcwalkwith-backup-restore.timer
  rm -f /tmp/mbcwalkwith-backup-restore.timer

  cat > /tmp/mbcwalkwith-backup-verify.timer <<EOF
[Unit]
Description=Weekly MBC WalkWith encrypted backup repository verification

[Timer]
OnCalendar=Sun *-*-* 03:30:00 ${timezone}
Persistent=true
RandomizedDelaySec=15m
Unit=mbcwalkwith-backup-verify.service

[Install]
WantedBy=timers.target
EOF
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-backup-verify.timer /etc/systemd/system/mbcwalkwith-backup-verify.timer
  rm -f /tmp/mbcwalkwith-backup-verify.timer
}

run_backup_helper() {
  local action="$1"
  local backup_helper="/usr/local/libexec/mbcwalkwith_backup"
  [[ -x "$backup_helper" ]] || die "Backup helper is missing. Run mbcwalkwith upgrade-script first."
  "${SUDO[@]}" "$backup_helper" "$action"
}

initialize_backup() {
  load_deploy_env
  write_backup_systemd_units
  "${SUDO[@]}" systemctl daemon-reload
  run_backup_helper init
  "${SUDO[@]}" systemctl enable --now mbcwalkwith-backup.timer mbcwalkwith-backup-verify.timer mbcwalkwith-backup-restore.timer
  echo "Backup timers enabled. Run ${installed_command_name} backup-now to create and verify the first snapshot."
}

backup_now() {
  run_backup_helper run
}

backup_status() {
  load_deploy_env
  echo "Backup timer: $("${SUDO[@]}" systemctl is-active mbcwalkwith-backup.timer 2>/dev/null || printf 'not-installed')"
  echo "Verify timer: $("${SUDO[@]}" systemctl is-active mbcwalkwith-backup-verify.timer 2>/dev/null || printf 'not-installed')"
  echo "Restore timer: $("${SUDO[@]}" systemctl is-active mbcwalkwith-backup-restore.timer 2>/dev/null || printf 'not-installed')"
  "${SUDO[@]}" systemctl list-timers mbcwalkwith-backup.timer mbcwalkwith-backup-verify.timer mbcwalkwith-backup-restore.timer --no-pager || true
  run_backup_helper status
}

backup_verify() {
  run_backup_helper verify
}

load_deploy_env() {
  local deploy_env="/etc/mbc_walkwith/deploy.env"
  [[ -f "$deploy_env" ]] || return 0
  set -a
  # deploy.env is generated by this script and remains root-owned.
  # shellcheck disable=SC1090
  . <("${SUDO[@]}" cat "$deploy_env")
  set +a
  [[ "$app_dir_from_cli" == "true" ]] || app_dir="${MBC_WALKWITH_APP_DIR:-$app_dir}"
  [[ "$api_port_from_cli" == "true" ]] || api_port="${MBC_WALKWITH_API_PORT:-$api_port}"
  [[ "$repo_url_from_cli" == "true" ]] || repo_url="${MBC_WALKWITH_REPO_URL:-$repo_url}"
  [[ "$git_ref_from_cli" == "true" ]] || git_ref="${MBC_WALKWITH_GIT_REF:-$git_ref}"
  [[ "$admin_origin_from_cli" == "true" ]] || admin_origin="${MBC_WALKWITH_ADMIN_ORIGIN:-$admin_origin}"
  [[ "$api_origin_from_cli" == "true" ]] || api_origin="${MBC_WALKWITH_API_ORIGIN:-$api_origin}"
  [[ "$public_origin_from_cli" == "true" ]] || public_origin="${MBC_WALKWITH_PUBLIC_ORIGIN:-$public_origin}"
  [[ "$service_user_from_cli" == "true" ]] || service_user="${MBC_WALKWITH_SERVICE_USER:-$service_user}"
  service_home="${MBC_WALKWITH_SERVICE_HOME:-$service_home}"
  service_cache_dir="${MBC_WALKWITH_SERVICE_CACHE_DIR:-$service_cache_dir}"
  export BUN_INSTALL="${MBC_WALKWITH_BUN_INSTALL:-$BUN_INSTALL}"
  export PATH="${BUN_INSTALL}/bin:${PATH}"
  if id -u "$service_user" >/dev/null 2>&1; then
    service_group="$(id -gn "$service_user")"
  else
    service_group="$service_user"
  fi

  local backend_env="/etc/mbc_walkwith/backend.env"
  if [[ -f "$backend_env" ]]; then
    if [[ -z "$admin_origin" ]]; then
      admin_origin="$(read_env_value "$backend_env" "ADMIN_WEB_ORIGIN")"
    fi
    if [[ -z "$api_origin" ]]; then
      local api_base_url
      api_base_url="$(read_env_value "$backend_env" "PUBLIC_API_BASE_URL")"
      api_origin="${api_base_url%/v1}"
    fi
  fi
}

healthcheck() {
  local payload
  payload="$(curl -fsS --max-time 5 "http://127.0.0.1:${api_port}/v1/health")"
  HEALTHCHECK_PAYLOAD="$payload" python3 -c '
import json, os
payload = json.loads(os.environ["HEALTHCHECK_PAYLOAD"])
data = payload.get("data", {})
inner = data.get("data", {})
assert data.get("ok") is True, "health ok=false"
assert inner.get("databaseConfigured") is True, "databaseConfigured=false"
assert inner.get("databaseReady") is True, "databaseReady=false"
'
}

wait_for_healthcheck() {
  local attempts="${1:-20}"
  local delay_seconds="${2:-2}"
  local attempt=1
  while (( attempt <= attempts )); do
    if healthcheck; then
      return 0
    fi
    sleep "$delay_seconds"
    ((attempt+=1))
  done
  return 1
}

run_release_migrations() {
  local release_dir="$1"
  if [[ -f "${release_dir}/backend/drizzle.config.ts" ]]; then
    run_release_shell_with_env "$release_dir/backend" "${BUN_INSTALL}/bin/bun run db:migrate"
  else
    run_release_shell_with_env "$release_dir" "${BUN_INSTALL}/bin/bun run db:migrate"
  fi
}

mark_release_prepared() {
  local release_dir="$1"
  run_as_deploy_user touch "${release_dir}/.release-prepared"
}

mark_release_complete() {
  local release_dir="$1"
  run_as_deploy_user touch "${release_dir}/.release-complete"
}

is_complete_release() {
  local release_dir="$1"
  [[ -d "$release_dir" && -f "${release_dir}/.release-complete" ]]
}

deploy_app() {
  load_deploy_env
  local source_dir="${app_dir}/source"
  [[ -d "${source_dir}/.git" ]] || sync_source
  sync_source

  local timestamp staging_dir release_dir current_link previous_release
  timestamp="$(date +%Y%m%d-%H%M%S)"
  staging_dir="${app_dir}/releases/.pending-${timestamp}"
  release_dir="${app_dir}/releases/${timestamp}"
  current_link="${app_dir}/current"
  previous_release="$(readlink -f "$current_link" 2>/dev/null || true)"

  log "Preparing release ${release_dir}"
  run_shell_as_deploy_user "$source_dir" "mkdir -p $(shell_quote "$staging_dir") && git archive --format=tar HEAD | tar -x -C $(shell_quote "$staging_dir")"
  "${SUDO[@]}" chown -R "${deploy_user}:${service_group}" "$staging_dir"

  log "Installing dependencies"
  run_shell_as_deploy_user "$staging_dir" "${BUN_INSTALL}/bin/bun install --frozen-lockfile"

  if [[ "$run_check" == "true" ]]; then
    log "Running workspace checks"
    run_shell_as_deploy_user "$staging_dir" "${BUN_INSTALL}/bin/bun run check"
  fi

  validate_backend_env_file

  if [[ "$skip_build" != "true" ]]; then
    local build_api_base_url build_admin_base_path
    build_api_base_url="$(api_base_url_from_origin "$api_origin")"
    build_admin_base_path="$(admin_web_base_path)"
    if [[ -z "$build_api_base_url" ]]; then
      build_api_base_url="http://127.0.0.1:${api_port}/v1"
    fi

    log "Building web assets"
    run_shell_as_deploy_user "$staging_dir" "VITE_API_BASE_URL=$(shell_quote "$build_api_base_url") VITE_ADMIN_BASE_PATH=$(shell_quote "$build_admin_base_path") ${BUN_INSTALL}/bin/bun run build"
    cat > /tmp/mbcwalkwith-web-build-env <<EOF
API_BASE_URL=${build_api_base_url}
ADMIN_BASE_PATH=${build_admin_base_path}
EOF
    "${SUDO[@]}" install -m 0644 -o "$deploy_user" -g "$service_group" /tmp/mbcwalkwith-web-build-env "${staging_dir}/.web-build-env"
    rm -f /tmp/mbcwalkwith-web-build-env
  fi

  if [[ "$skip_migrate" != "true" ]]; then
    log "Running database migrations"
    run_release_migrations "$staging_dir"
  fi

  mark_release_prepared "$staging_dir"
  run_as_deploy_user mv "$staging_dir" "$release_dir"

  ln -sfn "$release_dir" "$current_link"

  log "Restarting services"
  "${SUDO[@]}" systemctl restart mbcwalkwith-api

  if [[ "$skip_healthcheck" != "true" ]]; then
    log "Running local health check"
    if ! wait_for_healthcheck; then
      if [[ -n "$previous_release" && -d "$previous_release" ]]; then
        log "Health check failed, rolling back to previous release"
        ln -sfn "$previous_release" "$current_link"
        "${SUDO[@]}" systemctl restart mbcwalkwith-api
      fi
      die "Health check failed after deploy."
    fi
  fi

  mark_release_complete "$release_dir"
  cleanup_releases
  echo "Deploy complete. Current release: $(readlink -f "$current_link")"
}

deploy_prebuilt_app() {
  load_deploy_env
  local artifact_path="${positional_args[0]:-}"
  [[ -n "$artifact_path" ]] || die "deploy-prebuilt requires a release tarball path."
  [[ -f "$artifact_path" ]] || die "Release tarball not found: ${artifact_path}"

  validate_backend_env_file

  local timestamp staging_dir release_dir current_link previous_release
  timestamp="$(date +%Y%m%d-%H%M%S)"
  staging_dir="${app_dir}/releases/.pending-${timestamp}"
  release_dir="${app_dir}/releases/${timestamp}"
  current_link="${app_dir}/current"
  previous_release="$(readlink -f "$current_link" 2>/dev/null || true)"

  log "Preparing prebuilt release ${release_dir}"
  "${SUDO[@]}" install -d -m 0755 -o "$deploy_user" -g "$service_group" "$staging_dir"
  validate_tarball_entries "$artifact_path"
  run_as_deploy_user tar --no-same-owner -xzf "$artifact_path" -C "$staging_dir"
  "${SUDO[@]}" chown -R "${deploy_user}:${service_group}" "$staging_dir"

  [[ -f "${staging_dir}/release-manifest.json" ]] || die "Prebuilt release is missing release-manifest.json."
  local expected_admin_base_path expected_api_base_url
  expected_admin_base_path="$(admin_web_base_path)"
  expected_api_base_url="$(api_base_url_from_origin "$api_origin")"
  [[ -n "$expected_api_base_url" ]] || expected_api_base_url="http://127.0.0.1:${api_port}/v1"
  python3 - "$staging_dir/release-manifest.json" "$expected_admin_base_path" "$expected_api_base_url" <<'PY'
import json
import sys

manifest_path = sys.argv[1]
expected_admin_base_path = sys.argv[2]
expected_api_base_url = sys.argv[3]
with open(manifest_path, "r", encoding="utf-8") as handle:
    manifest = json.load(handle)

target = manifest.get("target")
runtime = manifest.get("runtime")
api_entry = manifest.get("apiEntry")
admin_web_dist = manifest.get("adminWebDist")
admin_base_path = manifest.get("adminBasePath")
api_base_url = manifest.get("apiBaseUrl")
public_web_dist = manifest.get("publicWebDist")

if target != "linux-x64":
    raise SystemExit(f"Expected linux-x64 prebuilt target, got {target!r}.")
if runtime != "bun":
    raise SystemExit(f"Expected bun runtime, got {runtime!r}.")
if api_entry != "backend_dist/main.js":
    raise SystemExit(f"Unexpected apiEntry: {api_entry!r}.")
if admin_web_dist != "apps/admin_web/dist":
    raise SystemExit(f"Unexpected adminWebDist: {admin_web_dist!r}.")
if admin_base_path != expected_admin_base_path:
    raise SystemExit(
        f"Expected adminBasePath {expected_admin_base_path!r}, got {admin_base_path!r}. "
        "Rebuild the prebuilt package with VITE_ADMIN_BASE_PATH set for this deployment topology."
    )
if api_base_url != expected_api_base_url:
    raise SystemExit(
        f"Expected apiBaseUrl {expected_api_base_url!r}, got {api_base_url!r}. "
        "Rebuild the prebuilt package with VITE_API_BASE_URL set for this deployment."
    )
if public_web_dist != "apps/public_web/dist":
    raise SystemExit(f"Unexpected publicWebDist: {public_web_dist!r}.")
PY
  [[ -f "${staging_dir}/backend_dist/main.js" ]] || die "Prebuilt release is missing backend_dist/main.js."
  [[ -f "${staging_dir}/backend/drizzle.config.ts" ]] || die "Prebuilt release is missing backend/drizzle.config.ts."
  [[ -f "${staging_dir}/backend/src/shared/db/schema.ts" ]] || die "Prebuilt release is missing backend/src/shared/db/schema.ts."
  [[ -f "${staging_dir}/backend/node_modules/drizzle-kit/bin.cjs" ]] || die "Prebuilt release is missing the Drizzle Kit Bun entrypoint."
  [[ -d "${staging_dir}/backend/migrations" ]] || die "Prebuilt release is missing backend/migrations."
  [[ -f "${staging_dir}/apps/admin_web/dist/index.html" ]] || die "Prebuilt release is missing admin web dist."
  [[ -f "${staging_dir}/apps/public_web/dist/index.html" ]] || die "Prebuilt release is missing public web dist."
  [[ -x "${staging_dir}/deployment/mbcwalkwith" ]] || die "Prebuilt release is missing deployment/mbcwalkwith."
  [[ -x "${staging_dir}/deployment/mbcwalkwith_backup" ]] || die "Prebuilt release is missing deployment/mbcwalkwith_backup."

  if [[ "$skip_migrate" != "true" ]]; then
    log "Running database migrations"
    run_release_migrations "$staging_dir"
  fi

  mark_release_prepared "$staging_dir"
  run_as_deploy_user mv "$staging_dir" "$release_dir"

  ln -sfn "$release_dir" "$current_link"

  log "Writing systemd service"
  write_systemd_services

  log "Restarting services"
  "${SUDO[@]}" systemctl restart mbcwalkwith-api

  if [[ "$skip_healthcheck" != "true" ]]; then
    log "Running local health check"
    if ! wait_for_healthcheck; then
      if [[ -n "$previous_release" && -d "$previous_release" ]]; then
        log "Health check failed, rolling back to previous release"
        ln -sfn "$previous_release" "$current_link"
        "${SUDO[@]}" systemctl restart mbcwalkwith-api
      fi
      die "Health check failed after prebuilt deploy."
    fi
  fi

  mark_release_complete "$release_dir"
  install_packaged_commands "$release_dir"
  cleanup_releases
  echo "Prebuilt deploy complete. Current release: $(readlink -f "$current_link")"
}

rollback_app() {
  load_deploy_env
  local releases_dir="${app_dir}/releases"
  local current_link="${app_dir}/current"
  local current_release requested target_release
  current_release="$(readlink -f "$current_link" 2>/dev/null || true)"
  [[ -n "$current_release" && -d "$current_release" ]] || die "No current release found."
  requested="${positional_args[0]:-}"

  if [[ -n "$requested" ]]; then
    if [[ "$requested" == /* ]]; then
      target_release="$requested"
    else
      target_release="${releases_dir}/${requested}"
    fi
  else
    mapfile -t releases < <(find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -exec test -f '{}/.release-complete' \; -print | sort -r)
    target_release=""
    for release in "${releases[@]}"; do
      if [[ "$release" != "$current_release" ]]; then
        target_release="$release"
        break
      fi
    done
  fi

  [[ -n "$target_release" && -d "$target_release" ]] || die "No rollback release found."
  target_release="$(realpath -m -- "$target_release")"
  [[ "$target_release" == "${releases_dir}/"* ]] || die "Rollback target must be inside ${releases_dir}."
  is_complete_release "$target_release" || die "Rollback target is not a completed, health-checked release: ${target_release}"
  log "Rolling back to ${target_release}"
  ln -sfn "$target_release" "$current_link"
  "${SUDO[@]}" systemctl restart mbcwalkwith-api
  if ! wait_for_healthcheck; then
    ln -sfn "$current_release" "$current_link"
    "${SUDO[@]}" systemctl restart mbcwalkwith-api
    die "Rollback health check failed. Restored previous current release."
  fi
  echo "Rollback complete. Current release: $(readlink -f "$current_link")"
}

write_nginx_http_config() {
  local config_file="/etc/nginx/conf.d/mbc_walkwith.conf"
  local admin_domain api_domain public_domain
  admin_domain="$(origin_to_domain "$admin_origin")"
  api_domain="$(origin_to_domain "$api_origin")"
  public_domain="$(origin_to_domain "$public_origin")"
  [[ -n "$admin_domain" ]] || die "--admin-origin is required."
  [[ -n "$api_domain" ]] || die "--api-origin is required."

  local admin_web_root="${app_dir}/current/apps/admin_web/dist"
  local public_web_root="${app_dir}/current/apps/public_web/dist"
  local admin_server_root="$admin_web_root"
  if [[ "$public_domain" == "$admin_domain" ]]; then
    admin_server_root="$public_web_root"
  fi

  if [[ "$admin_domain" == "$api_domain" ]]; then
    cat > /tmp/mbcwalkwith-nginx.conf <<EOF
server {
  listen 80;
  server_name ${admin_domain};
  client_max_body_size 512m;
  root ${admin_server_root};
  index index.html;

  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  location = /admin {
    return 301 /admin/;
  }

  location ^~ /admin/assets/ {
    root ${app_dir}/current/apps/admin_web/dist;
    rewrite ^/admin/(.*)$ /\$1 break;
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }

  location ^~ /admin/ {
    root ${app_dir}/current/apps/admin_web/dist;
    rewrite ^ /index.html break;
  }

  location = /v1 {
    proxy_pass http://127.0.0.1:${api_port}/v1;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location ^~ /v1/ {
    proxy_pass http://127.0.0.1:${api_port};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}

$(if [[ -n "$public_domain" && "$public_domain" != "$admin_domain" ]]; then cat <<PUBLICBLOCK
server {
  listen 80;
  server_name ${public_domain};
  client_max_body_size 512m;
  root ${public_web_root};
  index index.html;

  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }
}
PUBLICBLOCK
fi)
EOF
  else
    cat > /tmp/mbcwalkwith-nginx.conf <<EOF
server {
  listen 80;
  server_name ${admin_domain};
  client_max_body_size 512m;
  root ${admin_server_root};
  index index.html;

  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  location = /admin {
    return 301 /admin/;
  }

  location ^~ /admin/assets/ {
    root ${admin_web_root};
    rewrite ^/admin/(.*)$ /\$1 break;
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }

  location ^~ /admin/ {
    root ${admin_web_root};
    rewrite ^ /index.html break;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri \$uri/ /index.html;
  }
}

server {
  listen 80;
  server_name ${api_domain};
  client_max_body_size 512m;

  location / {
    proxy_pass http://127.0.0.1:${api_port};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}

$(if [[ -n "$public_domain" && "$public_domain" != "$admin_domain" ]]; then cat <<PUBLICBLOCK
server {
  listen 80;
  server_name ${public_domain};
  client_max_body_size 512m;
  root ${public_web_root};
  index index.html;

  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }
}
PUBLICBLOCK
fi)
EOF
  fi
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-nginx.conf "$config_file"
  rm -f /tmp/mbcwalkwith-nginx.conf
  "${SUDO[@]}" nginx -t
  "${SUDO[@]}" systemctl enable --now nginx
  "${SUDO[@]}" systemctl reload nginx
}

write_nginx_https_config() {
  local config_file="/etc/nginx/conf.d/mbc_walkwith.conf"
  local admin_domain api_domain public_domain
  admin_domain="$(origin_to_domain "$admin_origin")"
  api_domain="$(origin_to_domain "$api_origin")"
  public_domain="$(origin_to_domain "$public_origin")"
  [[ -n "$admin_domain" ]] || die "--admin-origin is required."
  [[ -n "$api_domain" ]] || die "--api-origin is required."

  local admin_web_root="${app_dir}/current/apps/admin_web/dist"
  local public_web_root="${app_dir}/current/apps/public_web/dist"
  local admin_server_root="$admin_web_root"
  if [[ "$public_domain" == "$admin_domain" ]]; then
    admin_server_root="$public_web_root"
  fi

  local redirect_domains="$admin_domain"
  if [[ "$api_domain" != "$admin_domain" ]]; then
    redirect_domains+=" ${api_domain}"
  fi
  if [[ -n "$public_domain" && "$public_domain" != "$admin_domain" && "$public_domain" != "$api_domain" ]]; then
    redirect_domains+=" ${public_domain}"
  fi

  if [[ "$admin_domain" == "$api_domain" ]]; then
    cat > /tmp/mbcwalkwith-nginx.conf <<EOF
server {
  listen 80;
  server_name ${redirect_domains};
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://\$host\$request_uri; }
}

server {
  listen 443 ssl http2;
  server_name ${admin_domain};
  ssl_certificate /etc/letsencrypt/live/${admin_domain}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${admin_domain}/privkey.pem;
  client_max_body_size 512m;
  root ${admin_server_root};
  index index.html;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  location = /admin {
    return 301 /admin/;
  }

  location ^~ /admin/assets/ {
    root ${admin_web_root};
    rewrite ^/admin/(.*)$ /\$1 break;
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }

  location ^~ /admin/ {
    root ${admin_web_root};
    rewrite ^ /index.html break;
  }

  location = /v1 {
    proxy_pass http://127.0.0.1:${api_port}/v1;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location ^~ /v1/ {
    proxy_pass http://127.0.0.1:${api_port};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}

$(if [[ -n "$public_domain" && "$public_domain" != "$admin_domain" ]]; then cat <<PUBLICBLOCK
server {
  listen 443 ssl http2;
  server_name ${public_domain};
  ssl_certificate /etc/letsencrypt/live/${admin_domain}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${admin_domain}/privkey.pem;
  client_max_body_size 512m;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  root ${public_web_root};
  index index.html;

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }
}
PUBLICBLOCK
fi)
EOF
  else
  cat > /tmp/mbcwalkwith-nginx.conf <<EOF
server {
  listen 80;
  server_name ${redirect_domains};
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://\$host\$request_uri; }
}

server {
  listen 443 ssl http2;
  server_name ${admin_domain};
  ssl_certificate /etc/letsencrypt/live/${admin_domain}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${admin_domain}/privkey.pem;
  client_max_body_size 512m;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  root ${admin_server_root};
  index index.html;

  location = /admin {
    return 301 /admin/;
  }

  location ^~ /admin/assets/ {
    root ${admin_web_root};
    rewrite ^/admin/(.*)$ /\$1 break;
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }

  location ^~ /admin/ {
    root ${admin_web_root};
    rewrite ^ /index.html break;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}

server {
  listen 443 ssl http2;
  server_name ${api_domain};
  ssl_certificate /etc/letsencrypt/live/${admin_domain}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${admin_domain}/privkey.pem;
  client_max_body_size 512m;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff;

  location / {
    proxy_pass http://127.0.0.1:${api_port};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
  }
}

$(if [[ -n "$public_domain" && "$public_domain" != "$admin_domain" ]]; then cat <<PUBLICBLOCK
server {
  listen 443 ssl http2;
  server_name ${public_domain};
  ssl_certificate /etc/letsencrypt/live/${admin_domain}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${admin_domain}/privkey.pem;
  client_max_body_size 512m;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  root ${public_web_root};
  index index.html;

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
    try_files \$uri =404;
  }
}
PUBLICBLOCK
fi)
EOF
  fi
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-nginx.conf "$config_file"
  rm -f /tmp/mbcwalkwith-nginx.conf
  "${SUDO[@]}" nginx -t
  "${SUDO[@]}" systemctl enable --now nginx
  "${SUDO[@]}" systemctl reload nginx
}

install_certbot_venv() {
  "${SUDO[@]}" apt-get update
  "${SUDO[@]}" apt-get install -y python3 python3-venv
  "${SUDO[@]}" python3 -m venv /opt/certbot
  "${SUDO[@]}" /opt/certbot/bin/pip install --upgrade pip setuptools wheel
  "${SUDO[@]}" /opt/certbot/bin/pip install --upgrade certbot certbot-nginx
  "${SUDO[@]}" ln -sf /opt/certbot/bin/certbot /usr/local/bin/certbot
}

install_certbot_snap() {
  if ! command -v snap >/dev/null 2>&1; then
    "${SUDO[@]}" apt-get update
    "${SUDO[@]}" apt-get install -y snapd
  fi
  "${SUDO[@]}" systemctl enable --now snapd.socket
  "${SUDO[@]}" snap install core || "${SUDO[@]}" snap refresh core
  "${SUDO[@]}" snap install --classic certbot || "${SUDO[@]}" snap refresh certbot
  "${SUDO[@]}" ln -sf /snap/bin/certbot /usr/local/bin/certbot
}

install_certbot_apt() {
  "${SUDO[@]}" apt-get update
  "${SUDO[@]}" apt-get install -y certbot python3-certbot-nginx
}

install_certbot_renewal_timer() {
  cat > /tmp/mbcwalkwith-certbot-renew.service <<'EOF'
[Unit]
Description=Renew MBC WalkWith TLS certificates
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/certbot renew --quiet
ExecStartPost=/bin/systemctl reload nginx
EOF

  cat > /tmp/mbcwalkwith-certbot-renew.timer <<'EOF'
[Unit]
Description=Check MBC WalkWith TLS certificate renewal twice daily

[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-certbot-renew.service /etc/systemd/system/mbcwalkwith-certbot-renew.service
  "${SUDO[@]}" install -m 0644 /tmp/mbcwalkwith-certbot-renew.timer /etc/systemd/system/mbcwalkwith-certbot-renew.timer
  rm -f /tmp/mbcwalkwith-certbot-renew.service /tmp/mbcwalkwith-certbot-renew.timer
  "${SUDO[@]}" systemctl daemon-reload
  "${SUDO[@]}" systemctl enable --now mbcwalkwith-certbot-renew.timer
}

install_or_upgrade_certbot() {
  [[ "$certbot_method" != "none" ]] || return 0

  local resolved_certbot_method="$certbot_method"
  if [[ "$resolved_certbot_method" == "auto" ]]; then
    if command -v snap >/dev/null 2>&1 || [[ "${os_id:-}" == "ubuntu" ]]; then
      resolved_certbot_method="snap"
    else
      resolved_certbot_method="venv"
    fi
  fi

  log "Installing or upgrading Certbot (${resolved_certbot_method})"
  case "$resolved_certbot_method" in
    snap)
      install_certbot_snap || {
        echo "Snap Certbot failed; falling back to Python venv Certbot." >&2
        install_certbot_venv
      }
      ;;
    venv)
      install_certbot_venv
      ;;
    apt)
      install_certbot_apt
      ;;
  esac
  install_certbot_renewal_timer
}

configure_ssl() {
  load_deploy_env
  if [[ -z "$admin_origin" ]]; then
    admin_origin="$(domain_to_https_origin "$(prompt_value "Admin domain" "")")"
  fi
  if [[ -z "$api_origin" ]]; then
    api_origin="$(domain_to_https_origin "$(prompt_value "API domain" "")")"
  fi
  if [[ -z "$certbot_email" && "$certbot_method" != "none" ]]; then
    certbot_email="$(prompt_value "Let's Encrypt email" "$certbot_email")"
  fi

  local admin_domain api_domain public_domain
  admin_domain="$(origin_to_domain "$admin_origin")"
  api_domain="$(origin_to_domain "$api_origin")"
  public_domain="$(origin_to_domain "$public_origin")"
  [[ -n "$admin_domain" ]] || die "--admin-origin is required."
  [[ -n "$api_domain" ]] || die "--api-origin is required."
  if [[ "$certbot_method" != "none" ]]; then
    [[ -n "$certbot_email" ]] || die "--email is required."
  fi

  write_env_files
  current_web_build_matches_origins || die "The current web release was built for different origins. Deploy source again, or upload a prebuilt package built with VITE_API_BASE_URL=$(api_base_url_from_origin "$api_origin") and VITE_ADMIN_BASE_PATH=$(admin_web_base_path), before running ssl."

  log "Writing initial HTTP nginx config"
  write_nginx_http_config

  if [[ "$certbot_method" == "none" ]]; then
    "${SUDO[@]}" systemctl restart mbcwalkwith-api || true
    echo "Certbot disabled. HTTP nginx config has been written; HTTPS was not requested."
    return 0
  fi

  install_or_upgrade_certbot

  log "Requesting Let's Encrypt certificate"
  local -a certbot_domains=("$admin_domain")
  if [[ "$api_domain" != "$admin_domain" ]]; then
    certbot_domains+=("$api_domain")
  fi
  if [[ -n "$public_domain" && "$public_domain" != "$admin_domain" && "$public_domain" != "$api_domain" ]]; then
    certbot_domains+=("$public_domain")
  fi

  local -a certbot_args=(
    --nginx
    --non-interactive
    --agree-tos
    --expand
    --redirect
    --email "$certbot_email"
  )
  local certbot_domain
  for certbot_domain in "${certbot_domains[@]}"; do
    certbot_args+=(-d "$certbot_domain")
  done
  "${SUDO[@]}" certbot \
    "${certbot_args[@]}"

  log "Reloading services with updated origins"
  "${SUDO[@]}" systemctl restart mbcwalkwith-api
  write_nginx_https_config
}

status_app() {
  load_deploy_env
  local source_dir="${app_dir}/source"
  local current_release
  current_release="$(readlink -f "${app_dir}/current" 2>/dev/null || printf 'none')"
  echo "MBC WalkWith status"
  echo "App dir: ${app_dir}"
  echo "Current release: ${current_release}"
  if [[ -d "${source_dir}/.git" ]]; then
    echo "Source branch: $(git -C "$source_dir" rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'unknown')"
    echo "Source commit: $(git -C "$source_dir" log -1 --pretty=format:'%h %s' 2>/dev/null || printf 'unknown')"
  else
    echo "Source checkout: missing"
  fi
  if [[ "$current_release" != "none" && -d "$current_release" ]]; then
    echo "Release name: $(basename "$current_release")"
  fi
  echo "Admin origin: ${admin_origin:-not-set}"
  echo "API origin: ${api_origin:-not-set}"
  echo "Public origin: ${public_origin:-not-set}"
  echo "Recent releases:"
  find "${app_dir}/releases" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -r | head -n 5 || true
  echo "Source checkout: ${app_dir}/source"
  echo "API service: $("${SUDO[@]}" systemctl is-active mbcwalkwith-api 2>/dev/null || printf 'not-installed')"
  echo "Nginx: $("${SUDO[@]}" systemctl is-active nginx 2>/dev/null || printf 'not-installed')"
  echo "Backup timer: $("${SUDO[@]}" systemctl is-active mbcwalkwith-backup.timer 2>/dev/null || printf 'not-installed')"
  echo "Backup verify timer: $("${SUDO[@]}" systemctl is-active mbcwalkwith-backup-verify.timer 2>/dev/null || printf 'not-installed')"
  if healthcheck; then
    echo "Health: ok"
  else
    echo "Health: failed"
  fi
}

logs_cmd() {
  local target="${1:-api}"
  local lines="${2:-200}"
  case "$target" in
    api)
      "${SUDO[@]}" journalctl -u mbcwalkwith-api -n "$lines" --no-pager
      ;;
    nginx)
      "${SUDO[@]}" journalctl -u nginx -n "$lines" --no-pager
      ;;
    backup)
      "${SUDO[@]}" journalctl -u mbcwalkwith-backup -n "$lines" --no-pager
      ;;
    backup-restore)
      "${SUDO[@]}" journalctl -u mbcwalkwith-backup-restore -n "$lines" --no-pager
      ;;
    backup-verify)
      "${SUDO[@]}" journalctl -u mbcwalkwith-backup-verify -n "$lines" --no-pager
      ;;
    *)
      die "Unknown log target: ${target}. Use api, nginx, backup, backup-verify, or backup-restore."
      ;;
  esac
}

cleanup_releases() {
  load_deploy_env
  local releases_dir="${app_dir}/releases"
  local current_release
  [[ -d "$releases_dir" ]] || return 0
  current_release="$(readlink -f "${app_dir}/current" 2>/dev/null || true)"

  find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -name '.pending-*' -mtime +0 -exec "${SUDO[@]}" rm -rf -- {} + 2>/dev/null || true
  mapfile -t all_releases < <(find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -exec test -f '{}/.release-complete' \; -print | sort -r)
  local index=0
  for release in "${all_releases[@]}"; do
    if [[ "$index" -lt "$keep_releases" ]]; then
      ((index+=1))
      continue
    fi
    if [[ -n "$current_release" && "$release" == "$current_release" ]]; then
      continue
    fi
    log "Removing old release ${release}"
    "${SUDO[@]}" rm -rf "$release"
  done
}

upgrade_packages() {
  log "Upgrading runtime packages"
  "${SUDO[@]}" apt-get update
  "${SUDO[@]}" apt-get upgrade -y
  if [[ -x "${BUN_INSTALL}/bin/bun" ]]; then
    run_as_deploy_user env BUN_INSTALL="$BUN_INSTALL" "${BUN_INSTALL}/bin/bun" upgrade || true
  fi
}

uninstall_ssl() {
  load_deploy_env
  if [[ -z "$admin_origin" ]]; then
    admin_origin="$(domain_to_https_origin "$(prompt_value "Admin domain" "")")"
  fi
  if [[ -z "$api_origin" ]]; then
    api_origin="$(domain_to_https_origin "$(prompt_value "API domain" "")")"
  fi

  local admin_domain api_domain public_domain
  admin_domain="$(origin_to_domain "$admin_origin")"
  api_domain="$(origin_to_domain "$api_origin")"
  public_domain="$(origin_to_domain "$public_origin")"
  [[ -n "$admin_domain" || -n "$api_domain" || -n "$public_domain" ]] || die "At least one domain is required for SSL removal."
  command -v certbot >/dev/null 2>&1 || die "certbot is not installed."
  confirm "This will delete Let's Encrypt certificates for configured MBC WalkWith domains." || die "SSL removal cancelled."

  log "Removing Let's Encrypt certificates"
  [[ -z "$admin_domain" ]] || "${SUDO[@]}" certbot delete --non-interactive --cert-name "$admin_domain" || true
  [[ -z "$api_domain" ]] || "${SUDO[@]}" certbot delete --non-interactive --cert-name "$api_domain" || true
  [[ -z "$public_domain" ]] || "${SUDO[@]}" certbot delete --non-interactive --cert-name "$public_domain" || true
}

uninstall_app() {
  load_deploy_env
  confirm "This will remove MBC WalkWith services, config, nginx config, and ${app_dir}." || die "Uninstall cancelled."
  "${SUDO[@]}" systemctl disable --now mbcwalkwith-api >/dev/null 2>&1 || true
  "${SUDO[@]}" systemctl disable --now mbcwalkwith-backup.timer mbcwalkwith-backup-verify.timer mbcwalkwith-backup-restore.timer >/dev/null 2>&1 || true
  "${SUDO[@]}" rm -f /etc/systemd/system/mbcwalkwith-api.service
  "${SUDO[@]}" rm -f /etc/systemd/system/mbcwalkwith-backup.service
  "${SUDO[@]}" rm -f /etc/systemd/system/mbcwalkwith-backup.timer
  "${SUDO[@]}" rm -f /etc/systemd/system/mbcwalkwith-backup-verify.service
  "${SUDO[@]}" rm -f /etc/systemd/system/mbcwalkwith-backup-verify.timer
  "${SUDO[@]}" rm -f /etc/systemd/system/mbcwalkwith-backup-restore.service
  "${SUDO[@]}" rm -f /etc/systemd/system/mbcwalkwith-backup-restore.timer
  "${SUDO[@]}" systemctl daemon-reload
  "${SUDO[@]}" rm -f /etc/nginx/conf.d/mbc_walkwith.conf
  "${SUDO[@]}" systemctl reload nginx >/dev/null 2>&1 || true
  if [[ "$remove_ssl" == "true" ]]; then
    uninstall_ssl
  fi
  "${SUDO[@]}" rm -rf /etc/mbc_walkwith
  "${SUDO[@]}" rm -rf "$app_dir"
  if [[ "$remove_database" == "true" ]]; then
    as_postgres dropdb --if-exists "$db_name" || true
    as_postgres psql -c "drop role if exists \"${db_user}\";" || true
  fi
  if id -u "$service_user" >/dev/null 2>&1; then
    "${SUDO[@]}" userdel "$service_user" >/dev/null 2>&1 || true
  fi
  "${SUDO[@]}" rm -f "/usr/local/bin/${installed_command_name}"
}

menu() {
  while true; do
    cat <<EOF

MBC WalkWith VPS Manager
1) Install environment and services
2) Configure nginx + SSL
3) Deploy latest GitHub release
4) Roll back to previous release
5) Show status
6) Show API logs
7) Clean old releases
8) Sync managed source checkout
9) Upgrade installed command
  10) Upgrade system/runtime packages
11) Initialize encrypted database backups
12) Run database backup now
13) Show database backup status
14) Verify database backup repository
15) Uninstall
0) Exit
EOF
    read -r -p "Choose an option: " choice
    case "$choice" in
      1) install_all ;;
      2) configure_ssl ;;
      3) deploy_release_artifact ;;
      4) rollback_app ;;
      5) status_app ;;
      6) logs_cmd api ;;
      7) cleanup_releases ;;
      8) sync_source ;;
      9) write_installed_command ;;
      10) upgrade_packages ;;
      11) initialize_backup ;;
      12) backup_now ;;
      13) backup_status ;;
      14) backup_verify ;;
      15) uninstall_app ;;
      0) exit 0 ;;
      *) echo "Unknown choice." ;;
    esac
  done
}

install_all() {
  validate_common_options
  discover_repo_url
  init_runtime
  ensure_service_user
  install_base_tooling
  install_bun
  prepare_app_dirs
  prepare_database
  sync_source
  write_env_files
  write_systemd_services
  write_installed_command
  echo "Installation complete."
  echo "Review /etc/mbc_walkwith/backend.env before the first deploy."
  echo "Deploy latest GitHub release with: ${installed_command_name} deploy-release"
  echo "Recovery source deploy: ${installed_command_name} deploy --check"
  echo "Recovery local artifact deploy: ${installed_command_name} deploy-prebuilt /tmp/mbc_walkwith_linux_x64.tar.gz"
}

parse_options "$@"

if [[ "$command" == "help" ]]; then
  usage
  exit 0
fi

validate_common_options
discover_repo_url
init_runtime

case "$command" in
  help)
    usage
    ;;
  menu)
    menu
    ;;
  install)
    install_all
    ;;
  deploy)
    deploy_app
    ;;
  deploy-prebuilt)
    deploy_prebuilt_app
    ;;
  deploy-release)
    deploy_release_artifact
    ;;
  rollback)
    rollback_app
    ;;
  status)
    status_app
    ;;
  backup-init)
    initialize_backup
    ;;
  backup-now)
    backup_now
    ;;
  backup-status)
    backup_status
    ;;
  backup-verify)
    backup_verify
    ;;
  logs)
    logs_cmd "${positional_args[@]:-}"
    ;;
  ssl|nginx)
    configure_ssl
    ;;
  cleanup-releases)
    cleanup_releases
    ;;
  sync-source)
    sync_source
    ;;
  upgrade-script)
    write_installed_command
    ;;
  upgrade)
    upgrade_packages
    ;;
  uninstall)
    uninstall_app
    ;;
  *)
    die "Unknown command: ${command}"
    ;;
esac
