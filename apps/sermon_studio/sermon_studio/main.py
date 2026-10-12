from __future__ import annotations

from pathlib import Path

from .config import AppConfig, load_config
from .models import SourceInput
from .pipeline import process_source, upload_project


def load_app_config(config_path: str | Path) -> AppConfig:
    return load_config(config_path)


def run_process(config: AppConfig, source: SourceInput, log=print):
    return process_source(config, source, log=log)


def run_upload(
    config: AppConfig,
    project_root: str | Path,
    publish: bool = False,
    log=print,
):
    return upload_project(config, project_root, publish=publish, log=log)
