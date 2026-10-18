#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "This build script requires Linux x86_64." >&2
  exit 1
fi

command -v ffmpeg >/dev/null || { echo "ffmpeg is required." >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe is required." >&2; exit 1; }

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
python3 -m venv .build_venv
.build_venv/bin/pip install --upgrade pip
.build_venv/bin/pip install '.[local,gui,build]'
.build_venv/bin/pyinstaller --clean --noconfirm packaging/sermon_studio_linux.spec
echo "Portable bundle: $root/dist/sermon-studio/"
