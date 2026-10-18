from __future__ import annotations

import re
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


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-") or "sermon"
