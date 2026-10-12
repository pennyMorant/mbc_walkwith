#!/usr/bin/env bash
set -Eeuo pipefail

backup_env="/etc/mbc_walkwith/backup.env"
state_dir="/var/lib/mbc_walkwith/backup"
dump_dir="${state_dir}/dumps"
restore_dir="/var/lib/mbc_walkwith/restore"
lock_file="/run/lock/mbcwalkwith_backup.lock"
latest_state_file="${state_dir}/latest.env"

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

require_root() {
  [[ "$(id -u)" -eq 0 ]] || die "This command must run as root."
}

load_config() {
  [[ -f "$backup_env" ]] || die "Missing ${backup_env}. Run the VPS installer first."
  # This root-owned file is an operator configuration file, not user input.
  set -a
  # shellcheck disable=SC1090
  . "$backup_env"
  set +a

  : "${BACKUP_ENABLED:=false}"
  : "${BACKUP_DATABASE_NAME:=mbc_walkwith}"
  : "${BACKUP_RESTIC_REPOSITORY:=}"
  : "${BACKUP_ALERT_ENABLED:=false}"
  : "${AWS_DEFAULT_REGION:=auto}"
  export RESTIC_REPOSITORY="$BACKUP_RESTIC_REPOSITORY"
  export RESTIC_CACHE_DIR="${state_dir}/restic_cache"
}

validate_config() {
  [[ "$BACKUP_ENABLED" == "true" ]] || die "Set BACKUP_ENABLED=true in ${backup_env} before enabling backups."
  [[ "$BACKUP_DATABASE_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || die "BACKUP_DATABASE_NAME must be a safe PostgreSQL identifier."
  [[ -n "${BACKUP_RESTIC_REPOSITORY:-}" ]] || die "BACKUP_RESTIC_REPOSITORY is required."
  [[ -n "${RESTIC_PASSWORD_FILE:-}" && -f "$RESTIC_PASSWORD_FILE" ]] || die "RESTIC_PASSWORD_FILE is missing."
  [[ -n "${AWS_ACCESS_KEY_ID:-}" ]] || die "AWS_ACCESS_KEY_ID is required."
  [[ -n "${AWS_SECRET_ACCESS_KEY:-}" ]] || die "AWS_SECRET_ACCESS_KEY is required."
  [[ -r "$RESTIC_PASSWORD_FILE" ]] || die "RESTIC_PASSWORD_FILE is not readable."
  if [[ "$BACKUP_ALERT_ENABLED" == "true" ]]; then
    [[ -n "${BACKUP_ALERT_TO:-}" ]] || die "BACKUP_ALERT_TO is required when alerts are enabled."
    [[ -n "${BACKUP_ALERT_FROM:-}" ]] || die "BACKUP_ALERT_FROM is required when alerts are enabled."
    [[ -n "${BACKUP_ALERT_RESEND_API_KEY:-}" ]] || die "BACKUP_ALERT_RESEND_API_KEY is required when alerts are enabled."
  fi
}

prepare_dirs() {
  install -d -m 0710 -o root -g postgres "$state_dir" "$restore_dir"
  install -d -m 0700 -o root -g root "$RESTIC_CACHE_DIR"
  install -d -m 0700 -o postgres -g postgres "$dump_dir"
}

with_lock() {
  exec 9>"$lock_file"
  flock -n 9 || die "Another backup or restore verification is already running."
  "$@"
}

restic_command() {
  restic "$@"
}

latest_snapshot_json() {
  restic_command snapshots --tag database --latest 1 --json
}

latest_snapshot_id() {
  latest_snapshot_json | python3 -c '
import json, sys
snapshots = json.load(sys.stdin)
if not snapshots:
    raise SystemExit(1)
print(snapshots[-1]["short_id"])
'
}

send_alert() {
  local subject="$1"
  local body="$2"
  [[ "$BACKUP_ALERT_ENABLED" == "true" ]] || return 0

  local payload
  payload="$(python3 - "$BACKUP_ALERT_FROM" "$BACKUP_ALERT_TO" "$subject" "$body" <<'PY'
import json
import sys
print(json.dumps({
    "from": sys.argv[1],
    "to": [sys.argv[2]],
    "subject": sys.argv[3],
    "text": sys.argv[4],
}))
PY
)"
  curl --fail --silent --show-error --max-time 20 \
    --request POST \
    --url https://api.resend.com/emails \
    --header "Authorization: Bearer ${BACKUP_ALERT_RESEND_API_KEY}" \
    --header "Content-Type: application/json" \
    --data "$payload" >/dev/null
}

write_latest_state() {
  local snapshot_id="$1"
  local dump_name="$2"
  local checksum="$3"
  local dump_size="$4"
  local finished_at
  finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  umask 077
  cat > "${latest_state_file}.tmp" <<EOF
BACKUP_FINISHED_AT=${finished_at}
BACKUP_SNAPSHOT_ID=${snapshot_id}
BACKUP_DUMP_NAME=${dump_name}
BACKUP_SHA256=${checksum}
BACKUP_SIZE_BYTES=${dump_size}
EOF
  mv "${latest_state_file}.tmp" "$latest_state_file"
}

cleanup_stale_dumps() {
  find "$dump_dir" -maxdepth 1 -type f -name '*.dump' -mtime +3 -delete
}

retention_due() {
  local marker="$1"
  local days="$2"
  [[ ! -f "$marker" ]] || find "$marker" -mtime "+${days}" -print -quit | grep -q .
}

run_retention() {
  local forget_marker="${state_dir}/retention_forget_at"
  local prune_marker="${state_dir}/retention_prune_at"

  if retention_due "$forget_marker" 6; then
    log "Applying database backup retention policy."
    restic_command forget --tag database --keep-daily 30 --keep-weekly 12 --keep-monthly 12 \
      || die "Restic retention policy update failed."
    touch "$forget_marker" || die "Could not record retention policy completion."
  fi
  if retention_due "$prune_marker" 29; then
    log "Pruning unreferenced encrypted backup data."
    restic_command prune || die "Restic prune failed."
    touch "$prune_marker" || die "Could not record restic prune completion."
  fi
}

run_backup() (
  local started_at dump_name dump_path checksum dump_size snapshot_id
  local success_message
  started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  dump_name="${BACKUP_DATABASE_NAME}_$(date -u +%Y-%m-%dT%H-%M-%SZ).dump"
  dump_path="${dump_dir}/${dump_name}"

  trap 'rm -f "$dump_path"' EXIT
  log "Creating PostgreSQL dump for ${BACKUP_DATABASE_NAME}."
  runuser -u postgres -- pg_dump \
    --format=custom \
    --no-owner \
    --no-privileges \
    --file "$dump_path" \
    "$BACKUP_DATABASE_NAME" || die "pg_dump failed for ${BACKUP_DATABASE_NAME}."

  pg_restore --list "$dump_path" >/dev/null || die "The generated PostgreSQL dump is unreadable."
  checksum="$(sha256sum "$dump_path" | awk '{print $1}')" || die "Could not calculate the dump checksum."
  dump_size="$(stat -c '%s' "$dump_path")" || die "Could not read the dump size."

  log "Uploading encrypted restic snapshot."
  restic_command backup --tag database --tag mbc_walkwith "$dump_path" >/dev/null || die "Restic backup upload failed."
  snapshot_id="$(latest_snapshot_id)" || die "The new restic snapshot could not be located."
  [[ -n "$snapshot_id" ]] || die "The new restic snapshot could not be located."
  write_latest_state "$snapshot_id" "$dump_name" "$checksum" "$dump_size" || die "Could not record the latest backup state."
  run_retention || die "Backup retention cleanup failed."
  cleanup_stale_dumps || die "Could not clean stale local backup dumps."
  printf -v success_message 'Completed: %s\nSnapshot: %s\nDump: %s\nSize: %s bytes\nSHA-256: %s' \
    "$started_at" "$snapshot_id" "$dump_name" "$dump_size" "$checksum"
  send_alert \
    "MBC WalkWith database backup succeeded" \
    "$success_message" || die "Backup succeeded but the success alert could not be sent."
  log "Backup succeeded. Snapshot ${snapshot_id}."
)

run_backup_with_alert() {
  if run_backup; then
    return
  else
    local exit_code=$?
    send_alert \
      "MBC WalkWith database backup failed" \
      "The backup task failed at $(date -u +%Y-%m-%dT%H:%M:%SZ). Check: journalctl -u mbcwalkwith-backup --no-pager" || true
    return "$exit_code"
  fi
}

run_verify() {
  log "Checking restic repository integrity."
  restic_command check || die "Restic repository integrity check failed."
  log "Backup repository integrity check succeeded."
}

run_verify_with_alert() {
  if run_verify; then
    return
  else
    local exit_code=$?
    send_alert \
      "MBC WalkWith database backup repository verification failed" \
      "The repository verification failed at $(date -u +%Y-%m-%dT%H:%M:%SZ). Check: journalctl -u mbcwalkwith-backup-verify --no-pager" || true
    return "$exit_code"
  fi
}

restore_verify() (
  local snapshot_id work_dir temp_database restored_dump success_message
  snapshot_id="$(latest_snapshot_id)" || die "No database backup snapshot exists."
  work_dir="${restore_dir}/${snapshot_id}"
  temp_database="mbc_backup_verify_$(date -u +%Y%m%d%H%M%S)"
  rm -rf "$work_dir"
  install -d -m 0700 "$work_dir"

  trap 'runuser -u postgres -- dropdb --if-exists "$temp_database" >/dev/null 2>&1 || true; rm -rf "$work_dir"' EXIT
  log "Restoring snapshot ${snapshot_id} into a temporary verification directory."
  restic_command restore "$snapshot_id" --target "$work_dir" >/dev/null || die "Restic snapshot restore failed."
  chown -R postgres:postgres "$work_dir"
  chmod 0700 "$work_dir"
  restored_dump="$(find "$work_dir" -type f -name '*.dump' -print -quit)"
  [[ -n "$restored_dump" ]] || die "No PostgreSQL dump was found in restored snapshot ${snapshot_id}."
  pg_restore --list "$restored_dump" >/dev/null || die "Restored PostgreSQL dump is unreadable."

  runuser -u postgres -- createdb --template=template0 "$temp_database" || die "Could not create the temporary restore database."
  runuser -u postgres -- pg_restore \
    --exit-on-error \
    --no-owner \
    --no-privileges \
    --dbname "$temp_database" \
    "$restored_dump" || die "Temporary PostgreSQL restore failed."
  runuser -u postgres -- psql -d "$temp_database" -v ON_ERROR_STOP=1 -tAc \
    "select to_regclass('public.users') is not null and to_regclass('public.sermons') is not null;" \
    | grep -qx 't' || die "Temporary restore is missing expected application tables."
  log "Restore verification succeeded for snapshot ${snapshot_id}."
  printf -v success_message 'Verified snapshot: %s\nCompleted: %s' \
    "$snapshot_id" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  send_alert \
    "MBC WalkWith database restore verification succeeded" \
    "$success_message" || die "Restore verification succeeded but the success alert could not be sent."
)

run_restore_verify_with_alert() {
  if restore_verify; then
    return
  else
    local exit_code=$?
    send_alert \
      "MBC WalkWith database restore verification failed" \
      "The restore verification failed at $(date -u +%Y-%m-%dT%H:%M:%SZ). Check: journalctl -u mbcwalkwith-backup-restore --no-pager" || true
    return "$exit_code"
  fi
}

initialize_repository() {
  if restic_command snapshots >/dev/null 2>&1; then
    log "Restic repository is already initialized."
    return
  fi
  log "Initializing encrypted restic repository."
  restic_command init
}

show_status() {
  if [[ -f "$latest_state_file" ]]; then
    cat "$latest_state_file"
  else
    echo "No successful local backup state has been recorded."
  fi
  if ! latest_snapshot_json; then
    echo "No readable remote database snapshot was found."
  fi
}

main() {
  local command="${1:-}"
  require_root
  load_config
  case "$command" in
    init)
      validate_config
      prepare_dirs
      with_lock initialize_repository
      ;;
    run)
      validate_config
      prepare_dirs
      with_lock run_backup_with_alert
      ;;
    verify)
      validate_config
      prepare_dirs
      with_lock run_verify_with_alert
      ;;
    restore-verify)
      validate_config
      prepare_dirs
      with_lock run_restore_verify_with_alert
      ;;
    status)
      prepare_dirs
      if [[ "$BACKUP_ENABLED" != "true" ]]; then
        echo "Backups are disabled. Configure ${backup_env}, then run mbcwalkwith backup-init."
      else
        validate_config
        with_lock show_status
      fi
      ;;
    *)
      die "Usage: $(basename "$0") {init|run|verify|restore-verify|status}"
      ;;
  esac
}

main "$@"
