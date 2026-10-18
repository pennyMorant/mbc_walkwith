from __future__ import annotations

import re
import tempfile
from pathlib import Path

from .models import OutputFiles


def create_output_files(
    work_dir: str | Path,
    source_file: str | Path,
    output_dir: str | Path | None = None,
) -> OutputFiles:
    source = Path(source_file).expanduser().resolve()
    root = (
        Path(output_dir).expanduser().resolve()
        if output_dir
        else Path(work_dir).expanduser().resolve() / slugify(source.stem)
    )
    root.mkdir(parents=True, exist_ok=True)
    return OutputFiles(
        root=root,
        audio_file=root / "sermon_audio.m4a",
        transcription_audio_file=root / ".transcription.wav",
        transcript_text_file=root / "transcript.txt",
        transcript_markdown_file=root / "transcript.md",
        transcript_srt_file=root / "transcript.srt",
        processing_info_file=root / "processing_info.json",
    )


def resolve_output_directory(
    work_dir: str | Path,
    source_file: str | Path,
    output_parent: str | Path | None = None,
) -> Path:
    source = Path(source_file).expanduser().resolve()
    parent = (
        Path(output_parent).expanduser().resolve()
        if output_parent
        else Path(work_dir).expanduser().resolve()
    )
    return parent / slugify(source.stem)


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-") or "sermon"


def publish_output_files(staged: OutputFiles, destination: OutputFiles) -> None:
    pairs = list(zip(_published_files(staged), _published_files(destination)))
    missing = [source.name for source, _ in pairs if not source.is_file()]
    if missing:
        raise RuntimeError(f"Staged output is incomplete: {', '.join(missing)}")

    destination.root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix=".sermon-studio-backup-",
        dir=destination.root.parent,
    ) as backup_name:
        backup_root = Path(backup_name)
        moved_existing: list[tuple[Path, Path]] = []
        published: list[Path] = []
        try:
            for source, target in pairs:
                if target.exists():
                    backup = backup_root / target.name
                    target.replace(backup)
                    moved_existing.append((backup, target))
                source.replace(target)
                published.append(target)
        except Exception:
            for target in reversed(published):
                target.unlink(missing_ok=True)
            for backup, target in reversed(moved_existing):
                backup.replace(target)
            raise


def _published_files(outputs: OutputFiles) -> tuple[Path, ...]:
    return (
        outputs.audio_file,
        outputs.transcript_text_file,
        outputs.transcript_markdown_file,
        outputs.transcript_srt_file,
        outputs.processing_info_file,
    )
