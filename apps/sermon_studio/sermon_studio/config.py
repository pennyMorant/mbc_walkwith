from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class PathsConfig:
    work_dir: str
    ffmpeg_bin: str = "ffmpeg"
    ffprobe_bin: str = "ffprobe"


@dataclass(frozen=True)
class AudioConfig:
    codec: str = "aac"
    bitrate: str = "128k"
    sample_rate: int = 44100
    channels: int = 2


@dataclass(frozen=True)
class TranscriptionConfig:
    provider: str
    model: str
    device: str = "cpu"
    compute_type: str = "int8"
    language: str | None = None


@dataclass(frozen=True)
class AppConfig:
    paths: PathsConfig
    audio: AudioConfig
    transcription: TranscriptionConfig


def load_config(path: str | Path) -> AppConfig:
    path = Path(path).expanduser().resolve()
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return AppConfig(
        paths=PathsConfig(**_require_mapping(raw, "paths")),
        audio=AudioConfig(**dict(raw.get("audio") or {})),
        transcription=TranscriptionConfig(
            **_require_mapping(raw, "transcription")
        ),
    )


def _require_mapping(raw: dict[str, Any], key: str) -> dict[str, Any]:
    value = raw.get(key)
    if not isinstance(value, dict):
        raise ValueError(f"Expected '{key}' section in config file.")
    return value
