#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
platform="${DOCKER_PLATFORM:-linux/amd64}"
image_tag="${IMAGE_TAG:-local}"
api_image="${API_IMAGE:-mbc_walkwith_api}"
migration_image="${MIGRATION_IMAGE:-mbc_walkwith_migration}"
web_image="${WEB_IMAGE:-mbc_walkwith_web}"
output_mode="${DOCKER_OUTPUT_MODE:---load}"

command -v docker >/dev/null 2>&1 || {
  echo "Docker with buildx is required." >&2
  exit 1
}
docker buildx version >/dev/null

case "$output_mode" in
  --load | --push) ;;
  *)
    echo "DOCKER_OUTPUT_MODE must be --load or --push." >&2
    exit 1
    ;;
esac

build_target() {
  local dockerfile="$1"
  local target="$2"
  local image="$3"

  docker buildx build \
    --platform "$platform" \
    --file "$repo_root/$dockerfile" \
    --target "$target" \
    --tag "${image}:${image_tag}" \
    "$output_mode" \
    "$repo_root"
}

echo "Building MBC WalkWith images for ${platform} with tag ${image_tag}..."
build_target infra/docker/api.Dockerfile api "$api_image"
build_target infra/docker/api.Dockerfile migration "$migration_image"
build_target infra/docker/web.Dockerfile web "$web_image"

printf '%s\n' \
  "Built ${api_image}:${image_tag}" \
  "Built ${migration_image}:${image_tag}" \
  "Built ${web_image}:${image_tag}"
