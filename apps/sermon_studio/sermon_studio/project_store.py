from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .models import ProjectFiles, SermonManifest


def create_project_files(work_dir: str | Path, title: str, sermon_date: str) -> ProjectFiles:
    root_name = f"{sermon_date}_{slugify(title)}"
    root = Path(work_dir).expanduser().resolve() / root_name
    source_dir = root / "source"
    output_dir = root / "output"
    logs_dir = root / "logs"
    for directory in (source_dir, output_dir, logs_dir):
        directory.mkdir(parents=True, exist_ok=True)
    return ProjectFiles(
        root=root,
        source_dir=source_dir,
        output_dir=output_dir,
        logs_dir=logs_dir,
        transcript_file=output_dir / "transcript.txt",
        markdown_file=output_dir / "review.md",
        manifest_file=output_dir / "manifest.json",
    )


def write_manifest(project: ProjectFiles, manifest: SermonManifest) -> Path:
    if project.manifest_file is None:
        raise ValueError("Project manifest path is not initialized.")
    project.manifest_file.write_text(
        json.dumps(manifest.to_json_dict(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return project.manifest_file


def read_manifest(path: str | Path) -> dict[str, Any]:
    return json.loads(Path(path).expanduser().resolve().read_text(encoding="utf-8"))


def resolve_original_audio_path(
    source_dir: str | Path,
    manifest_data: dict[str, Any],
) -> Path:
    audio = manifest_data.get("audio")
    if not isinstance(audio, dict):
        raise RuntimeError("Manifest is missing audio metadata.")
    file_name = str(audio.get("fileName") or "").strip()
    if not file_name:
        raise RuntimeError("Manifest audio metadata is missing fileName.")
    audio_path = Path(source_dir).expanduser().resolve() / file_name
    if not audio_path.is_file():
        raise RuntimeError(f"Original audio file not found: {audio_path}")
    return audio_path


def write_text(path: str | Path, content: str) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-") or "sermon"


def update_manifest_backend(path: str | Path, backend_payload: dict[str, Any]) -> None:
    data = read_manifest(path)
    backend = dict(data.get("backend") or {})
    backend.update(backend_payload)
    data["backend"] = backend
    Path(path).write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
