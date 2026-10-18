from __future__ import annotations

import importlib.util
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from .config import AppConfig


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def run_diagnostics(config: AppConfig) -> list[CheckResult]:
    results = [
        _binary_check("ffmpeg", config.paths.ffmpeg_bin),
        _binary_check("ffprobe", config.paths.ffprobe_bin),
        _work_dir_check(config.paths.work_dir),
        _python_import_check("PyYAML", "yaml"),
    ]

    if config.transcription.provider.startswith("faster-whisper"):
        results.append(_python_import_check("faster-whisper", "faster_whisper"))

    return results


def summarize_diagnostics(results: Iterable[CheckResult]) -> tuple[bool, str]:
    items = list(results)
    failed = [item for item in items if not item.ok]
    if not failed:
        return True, "All checks passed."
    return False, "; ".join(f"{item.name}: {item.detail}" for item in failed)


def _binary_check(name: str, binary: str) -> CheckResult:
    resolved = shutil.which(binary)
    return CheckResult(
        name=name,
        ok=resolved is not None,
        detail=resolved or f"'{binary}' not found on PATH",
    )


def _python_import_check(name: str, module_name: str) -> CheckResult:
    spec = importlib.util.find_spec(module_name)
    return CheckResult(
        name=name,
        ok=spec is not None,
        detail="Importable" if spec else f"Module '{module_name}' not installed",
    )


def _work_dir_check(work_dir: str) -> CheckResult:
    path = Path(work_dir).expanduser().resolve()
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError as error:
        return CheckResult(name="work-directory", ok=False, detail=str(error))
    return CheckResult(name="work-directory", ok=True, detail=str(path))
