#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
compose_file="${MBC_DOCKER_COMPOSE_FILE:-${repo_root}/infra/docker/compose.yml}"
compose_env="${MBC_DOCKER_ENV_FILE:-${repo_root}/infra/docker/compose.env}"
command_name="${1:-help}"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required." >&2
  exit 1
}
command -v curl >/dev/null 2>&1 || {
  echo "curl is required." >&2
  exit 1
}
docker compose version >/dev/null

[[ -f "$compose_env" ]] || {
  echo "Missing ${compose_env}. Copy compose.env.example and replace every placeholder." >&2
  exit 1
}

compose() {
  docker compose --env-file "$compose_env" --file "$compose_file" "$@"
}

wait_for_http() {
  local url="$1"
  local attempts=30
  local index

  for ((index = 1; index <= attempts; index += 1)); do
    if curl --fail --silent --show-error "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "Health check failed after ${attempts} attempts: ${url}" >&2
  return 1
}

read_env_value() {
  local key="$1"
  local fallback="$2"
  local value
  value="$(sed -n "s/^${key}=//p" "$compose_env" | tail -n 1)"
  printf '%s' "${value:-$fallback}"
}

case "$command_name" in
  deploy)
    compose up --detach postgres
    compose run --rm migrate
    compose up --detach api web
    bind_address="$(read_env_value WEB_BIND_ADDRESS 127.0.0.1)"
    web_port="$(read_env_value WEB_PORT 8080)"
    [[ "$bind_address" != "0.0.0.0" ]] || bind_address="127.0.0.1"
    wait_for_http "http://${bind_address}:${web_port}/v1/health"
    compose ps
    ;;
  migrate)
    compose up --detach postgres
    compose run --rm migrate
    ;;
  status)
    compose ps
    ;;
  logs)
    shift
    compose logs --follow --tail=200 "$@"
    ;;
  stop)
    compose stop
    ;;
  down)
    compose down
    ;;
  help | --help | -h)
    cat <<'EOF'
Usage: manage.sh <command>

Commands:
  deploy   Start PostgreSQL, run Drizzle migrations, then start API and Web
  migrate  Start PostgreSQL and run Drizzle migrations only
  status   Show container status
  logs     Follow logs; optional service names may follow
  stop     Stop services without deleting volumes
  down     Remove containers and network; named volumes remain intact

Environment:
  MBC_DOCKER_ENV_FILE      Compose variable file (default infra/docker/compose.env)
  MBC_DOCKER_COMPOSE_FILE  Compose file override
EOF
    ;;
  *)
    echo "Unknown command: ${command_name}" >&2
    exit 2
    ;;
esac
