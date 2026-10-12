#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
image_tag="${IMAGE_TAG:-local}"
api_image="${API_IMAGE:-mbc_walkwith_api}"
migration_image="${MIGRATION_IMAGE:-mbc_walkwith_migration}"
web_image="${WEB_IMAGE:-mbc_walkwith_web}"
output_dir="${DOCKER_EXPORT_DIR:-${repo_root}/dist/docker}"
archive_path="${output_dir}/mbc_walkwith_images_${image_tag}.tar.gz"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required." >&2
  exit 1
}
mkdir -p "$output_dir"

images=(
  "${api_image}:${image_tag}"
  "${migration_image}:${image_tag}"
  "${web_image}:${image_tag}"
)

for image in "${images[@]}"; do
  docker image inspect "$image" >/dev/null
done

docker save "${images[@]}" | gzip -9 > "$archive_path"
(
  cd "$output_dir"
  shasum -a 256 "$(basename "$archive_path")" > "$(basename "$archive_path").sha256"
)

echo "Docker image archive ready: ${archive_path}"
