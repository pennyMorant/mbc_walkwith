from __future__ import annotations

import hashlib
import mimetypes
import subprocess
from pathlib import Path

from .models import AudioMetadata


def normalize_audio(
    source_path: str | Path,
    output_path: str | Path,
    ffmpeg_bin: str,
    sample_rate: int = 16000,
) -> Path:
    source_path = Path(source_path).expanduser().resolve()
    output_path = Path(output_path).expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    command = [
        ffmpeg_bin,
        "-y",
        "-i",
        str(source_path),
        "-ar",
        str(sample_rate),
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        str(output_path),
    ]
    subprocess.run(command, check=True)
    return output_path


def build_audio_metadata(
    original_audio_path: str | Path,
    ffprobe_bin: str | None = None,
) -> AudioMetadata:
    original_audio_path = Path(original_audio_path).expanduser().resolve()
    size_bytes = original_audio_path.stat().st_size
    mime_type = mimetypes.guess_type(original_audio_path.name)[0] or "application/octet-stream"
    duration_seconds = (
        probe_duration_seconds(original_audio_path, ffprobe_bin)
        if ffprobe_bin
        else None
    )
    return AudioMetadata(
        file_name=original_audio_path.name,
        mime_type=mime_type,
        size_bytes=size_bytes,
        sha256=sha256_file(original_audio_path),
        duration_seconds=duration_seconds,
    )


def probe_duration_seconds(audio_path: str | Path, ffprobe_bin: str | None) -> int | None:
    if not ffprobe_bin:
        return None
    audio_path = Path(audio_path).expanduser().resolve()
    command = [
        ffprobe_bin,
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(audio_path),
    ]
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
        )
    except Exception:
        return None
    value = result.stdout.strip()
    if not value:
        return None
    try:
        return round(float(value))
    except ValueError:
        return None


def sha256_file(path: str | Path) -> str:
    path = Path(path)
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()
