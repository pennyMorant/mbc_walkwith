from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass
class BackendConfig:
    base_url: str
    email: str
    password: str
    submit_for_review: bool = True


@dataclass
class PathsConfig:
    work_dir: str
    ffmpeg_bin: str = "ffmpeg"
    ffprobe_bin: str = "ffprobe"


@dataclass
class TranscriptionConfig:
    provider: str
    model: str
    device: str = "cpu"
    compute_type: str = "int8"
    language: str | None = None


@dataclass
class SummaryConfig:
    provider: str
    model: str
    endpoint: str | None = None
    api_key: str | None = None
    temperature: float = 0.2


@dataclass
class DefaultsConfig:
    speaker: str = ""
    series: str = ""
    primary_reference: str = ""


@dataclass
class AppConfig:
    backend: BackendConfig
    paths: PathsConfig
    transcription: TranscriptionConfig
    summary: SummaryConfig
    defaults: DefaultsConfig


def load_config(path: str | Path) -> AppConfig:
    path = Path(path).expanduser().resolve()
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return AppConfig(
        backend=BackendConfig(**_require_mapping(raw, "backend")),
        paths=PathsConfig(**_require_mapping(raw, "paths")),
        transcription=TranscriptionConfig(
            **_require_mapping(raw, "transcription")
        ),
        summary=SummaryConfig(**_require_mapping(raw, "summary")),
        defaults=DefaultsConfig(**dict(raw.get("defaults") or {})),
    )


def _require_mapping(raw: dict[str, Any], key: str) -> dict[str, Any]:
    value = raw.get(key)
    if not isinstance(value, dict):
        raise ValueError(f"Expected '{key}' section in config file.")
    return value
