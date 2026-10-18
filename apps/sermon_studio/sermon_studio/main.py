from __future__ import annotations

from pathlib import Path

from .config import AppConfig, load_config
from .pipeline import process_media


def load_app_config(config_path: str | Path) -> AppConfig:
    return load_config(config_path)


def run_process(
    config: AppConfig,
    source_file: str | Path,
    output_dir: str | Path | None = None,
    start_seconds: float = 0,
    end_seconds: float | None = None,
    log=print,
    progress=None,
):
    return process_media(
        config,
        source_file,
        output_dir=output_dir,
        start_seconds=start_seconds,
        end_seconds=end_seconds,
        log=log,
        progress=progress,
    )
